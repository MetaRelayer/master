// Worker process for blockchain interactions
const { initializeBlockchain } = require('./blockchain');
const { setupTransactionHandler } = require('./transactionHandler');

async function startWorker() {
  const workerId = parseInt(process.env.WORKER_ID || 0);
  console.log(`Worker ${process.pid} (ID: ${workerId}) started`);
  
  try {
    // Initialize blockchain connection
    const blockchain = await initializeBlockchain();
    
    // Initialize transaction handler
    const transactionHandler = setupTransactionHandler(blockchain, workerId);
    
    // Process messages from master
    process.on('message', (message) => {
      if (message.type === 'mint_request') {
        transactionHandler.processMintRequest(message.data, message.requestId);
      } else if (message.type === 'check_minted') {
        transactionHandler.checkHasMinted(message.address, message.requestId);
      } else if (message.type === 'tx_status_query') {
        transactionHandler.getTransactionStatus(message.requestId);
      }
    });
    
    // Send ready message
    process.send({
      type: 'worker_status',
      workerId,
      status: {
        status: 'ready',
        address: blockchain.relayerWallet.address,
        nonce: blockchain.currentNonce
      }
    });
    
    // Set up health check interval
    setInterval(() => {
      process.send({
        type: 'check_health',
        workerId
      });
    }, 5000);
    
  } catch (error) {
    console.error(`[Worker ${workerId}] Initialization error:`, error);
    process.exit(1);
  }
}

module.exports = startWorker;