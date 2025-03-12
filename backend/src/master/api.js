// API server for the relayer
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { ethers } = require('ethers');

function startApiServer(store, workerManager) {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(bodyParser.json({ limit: '2mb' }));
  app.use(express.json({ limit: '2mb' }));
  
  // Basic request logging
  app.use((req, res, next) => {
    if (req.method === 'POST' || req.path.startsWith('/status/')) {
      console.log(`[API] ${new Date().toISOString()} - ${req.method} ${req.url}`);
    }
    next();
  });
  
  // Health check endpoint
  app.get("/health", (req, res) => {
    const metrics = store.getHealthMetrics();
    const uptime = Math.floor((Date.now() - metrics.startTime) / 1000);
    
    res.json({
      status: "ok",
      network: "Monad Testnet",
      chainId: 10143,
      uptime: `${Math.floor(uptime / 60)}m ${uptime % 60}s`,
      workers: {
        total: workerManager.getWorkersCount(),
        active: workerManager.getActiveWorkers()
      },
      metrics: {
        totalRequests: metrics.totalRequests,
        successfulMints: metrics.successfulMints,
        failedMints: metrics.failedMints,
        mintedAddressesCount: store.getAllMintedAddresses().size,
        activeTransactions: store.getActiveTransactions().size,
        workerMetrics: metrics.workerStatus
      }
    });
  });
  
  // Status check endpoint
  app.get("/status/:requestId", async (req, res) => {
    const { requestId } = req.params;
    
    // Check if we have this transaction in our master tracking
    if (store.getTransaction(requestId)) {
      const txData = store.getTransaction(requestId);
      
      // Return status directly from master
      return res.json({
        success: true,
        requestId,
        ...txData,
        cached: true
      });
    }
    
    // If not in master cache, ask all workers
    const workers = Object.values(cluster.workers);
    if (workers.length === 0) {
      return res.status(503).json({
        success: false,
        error: "No workers available"
      });
    }
    
    // Set up a promise to ask all workers
    const statusPromise = new Promise((resolve) => {
      let responsesReceived = 0;
      let transactionFound = false;
      
      // Set timeout for overall request
      const timeout = setTimeout(() => {
        if (!transactionFound) {
          resolve({ 
            status: "unknown",
            error: "Transaction not found or timed out"
          });
        }
      }, 5000);
      
      // Handler for worker responses
      function messageHandler(worker, message) {
        if (message.type === 'tx_status_response' && message.requestId === requestId) {
          responsesReceived++;
          
          // If found, resolve with data
          if (message.found && !transactionFound) {
            transactionFound = true;
            clearTimeout(timeout);
            cluster.removeListener('message', messageHandler);
            resolve(message.data);
            
            // Update master cache
            store.setTransaction(requestId, {
              ...message.data,
              workerId: worker.id % workerManager.numWorkers,
              lastUpdated: Date.now()
            });
          } 
          // If all workers have responded and none found it
          else if (responsesReceived === workers.length && !transactionFound) {
            clearTimeout(timeout);
            cluster.removeListener('message', messageHandler);
            resolve({ 
              status: "unknown",
              error: "Transaction not found"
            });
          }
        }
      }
      
      // Set up listener
      cluster.on('message', messageHandler);
      
      // Ask all workers
      workers.forEach(worker => {
        worker.send({
          type: 'tx_status_query',
          requestId
        });
      });
    });
    
    // Wait for response and send to client
    const statusData = await statusPromise;
    return res.json({
      success: true,
      requestId,
      ...statusData
    });
  });
  
  // Check mint status endpoint
  app.get("/hasMinted/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!ethers.isAddress(address)) {
        return res.status(400).json({
          success: false,
          error: "Invalid Ethereum address format"
        });
      }
      
      // Check memory cache first
      if (store.hasMinted(address.toLowerCase())) {
        return res.json({ success: true, hasMinted: true });
      }
      
      // Check with a worker
      const worker = workerManager.getNextWorker();
      if (!worker) {
        return res.status(503).json({
          success: false,
          error: "No workers available"
        });
      }
      
      // Generate a unique request ID
      const requestId = `req_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
      
      // Send request to worker and wait for response
      const mintedCheckPromise = new Promise((resolve, reject) => {
        // Set timeout
        const timeout = setTimeout(() => {
          reject(new Error("Worker response timeout"));
        }, 5000);
        
        // Listen for response
        function messageHandler(message) {
          if (message.type === 'minted_response' && message.requestId === requestId) {
            clearTimeout(timeout);
            worker.removeListener('message', messageHandler);
            resolve(message.hasMinted);
          }
        }
        
        worker.on('message', messageHandler);
        
        // Send request to worker
        worker.send({ type: 'check_minted', address, requestId });
      });
      
      const hasMinted = await mintedCheckPromise;
      return res.json({ success: true, hasMinted });
    } catch (error) {
      console.error("Error checking mint status:", error);
      return res.status(500).json({
        success: false,
        error: `Error checking mint status: ${error.message}`
      });
    }
  });
  
  // Relay endpoint
  app.post("/relay", (req, res) => {
    // Update metrics
    store.incrementTotalRequests();
    
    const { user, tokenId, sigR, sigS, sigV } = req.body;
    
    // Input validation
    if (!user || tokenId === undefined || !sigR || !sigS || sigV === undefined) {
      console.error("Missing required parameters");
      return res.status(400).json({
        success: false,
        error: "Missing required parameters",
        errorType: "INVALID_PARAMETERS",
        received: { user, tokenId, sigR, sigS, sigV }
      });
    }
    
    // Check if user has already minted
    if (store.hasMinted(user.toLowerCase())) {
      return res.status(409).json({
        success: false,
        error: "User has already minted an NFT",
        errorType: "ALREADY_MINTED"
      });
    }
    
    // Get least busy worker
    const worker = workerManager.getNextWorker();
    if (!worker) {
      return res.status(503).json({
        success: false,
        error: "No workers available",
        errorType: "NO_WORKERS"
      });
    }
    
    // Create a requestId for tracking
    const requestId = `req_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    
    // Initialize transaction tracking
    store.setTransaction(requestId, {
      status: 'queued',
      address: user,
      tokenId: tokenId,
      workerId: worker.id % workerManager.numWorkers,
      createdAt: Date.now()
    });
    
    // Send task to worker
    worker.send({
      type: 'mint_request',
      data: { user, tokenId, sigR, sigS, sigV },
      requestId
    });
    
    // Return success immediately - fully async
    res.status(202).json({
      success: true,
      message: "Transaction submitted for processing",
      requestId
    });
  });
  
  // Start API server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Parallel Monad Relayer API server running on http://localhost:${PORT}`);
    console.log(`Worker count: ${workerManager.numWorkers}`);
  });
}

module.exports = { startApiServer };