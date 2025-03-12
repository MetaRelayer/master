// Manages worker processes
const cluster = require('cluster');
const os = require('os');

function setupWorkersManager(store) {
  const numCPUs = os.cpus().length;
  
  // Cap at 8 workers
  const numWorkers = Math.min(numCPUs, 8);
  
  // Fork worker processes (one per CPU core)
  for (let i = 0; i < numWorkers; i++) {
    store.initializeWorkerStatus(i);
    cluster.fork({ WORKER_ID: i });
  }
  
  // Handle worker messages
  cluster.on('message', (worker, message) => {
    const workerId = worker.id % numWorkers;
    
    if (message.type === 'mint_success') {
      // Record successful mint
      store.addMintedAddress(message.address.toLowerCase());
      store.incrementSuccessfulMints();
      store.setWorkerStatus(workerId, {
        transactions: (store.getHealthMetrics().workerStatus[workerId]?.transactions || 0) + 1,
        status: 'active'
      });
      
      // Update transaction tracking
      if (message.requestId) {
        store.updateTransaction(message.requestId, {
          status: 'confirmed',
          txHash: message.txHash,
          blockNumber: message.blockNumber,
          address: message.address,
          workerId: workerId,
          completedAt: Date.now()
        });
        
        // Clean up after 10 minutes
        setTimeout(() => {
          store.deleteTransaction(message.requestId);
        }, 10 * 60 * 1000);
      }
    } else if (message.type === 'mint_failure') {
      // Record failed mint
      store.incrementFailedMints();
      store.setWorkerStatus(workerId, {
        errors: (store.getHealthMetrics().workerStatus[workerId]?.errors || 0) + 1,
        status: 'active'
      });
      
      // Update transaction tracking
      if (message.requestId) {
        store.updateTransaction(message.requestId, {
          status: 'failed',
          error: message.error,
          errorCode: message.errorCode,
          address: message.address,
          workerId: workerId,
          completedAt: Date.now()
        });
        
        // Clean up after 10 minutes
        setTimeout(() => {
          store.deleteTransaction(message.requestId);
        }, 10 * 60 * 1000);
      }
    } else if (message.type === 'tx_update') {
      // Update transaction status
      if (message.requestId) {
        store.updateTransaction(message.requestId, message.data);
      }
    } else if (message.type === 'check_minted') {
      // Check if address has minted in our cache
      const hasMinted = store.hasMinted(message.address.toLowerCase());
      worker.send({ type: 'minted_response', requestId: message.requestId, hasMinted });
    } else if (message.type === 'worker_status') {
      // Update worker status
      store.setWorkerStatus(workerId, message.status);
    } else if (message.type === 'check_health') {
      // Worker is checking in
      store.setWorkerStatus(workerId, { status: 'active' });
    }
  });
  
  // Handle worker death and restart
  cluster.on('exit', (worker, code, signal) => {
    const workerId = worker.id % numWorkers;
    console.log(`Worker ${worker.process.pid} (ID: ${workerId}) died. Restarting...`);
    
    // Mark this worker's transactions as abandoned if they were in progress
    for (const [requestId, txData] of store.getActiveTransactions().entries()) {
      if (txData.workerId === workerId && 
          ['processing', 'submitted'].includes(txData.status)) {
        store.updateTransaction(requestId, {
          status: 'worker_died',
          error: 'Worker process terminated unexpectedly'
        });
      }
    }
    
    // Start a new worker
    const newWorker = cluster.fork({ WORKER_ID: workerId });
    console.log(`Started new worker ${newWorker.process.pid} (ID: ${workerId})`);
  });
  
  // Load balancing function - distribute work evenly
  function getNextWorker() {
    // Find available workers and sort by least busy
    const workers = Object.values(cluster.workers);
    if (workers.length === 0) return null;
    
    // Get worker with fewest active transactions
    const workerEntries = Object.entries(store.getHealthMetrics().workerStatus);
    workerEntries.sort((a, b) => a[1].transactions - b[1].transactions);
    
    // Get the worker ID of the least busy worker
    const workerId = parseInt(workerEntries[0][0]);
    
    return Object.values(cluster.workers).find(w => w.id % numWorkers === workerId);
  }
  
  return {
    numWorkers,
    getNextWorker,
    getWorkersCount: () => Object.keys(cluster.workers).length,
    getActiveWorkers: () => {
      const metrics = store.getHealthMetrics();
      return Object.values(metrics.workerStatus)
        .filter(w => Date.now() - w.lastActiveTime < 10000).length;
    }
  };
}

module.exports = { setupWorkersManager };