// Master process - coordinates workers and handles API
const cluster = require('cluster');
const os = require('os');
const { setupTransactionStore } = require('./transactionStore');
const { setupWorkersManager } = require('./workersManager');
const { startApiServer } = require('./api');

function startMaster() {
  const numCPUs = os.cpus().length;
  console.log(`Master process ${process.pid} starting with ${numCPUs} CPUs`);
  
  // Initialize the transaction store
  const store = setupTransactionStore();
  
  // Setup worker management
  const workerManager = setupWorkersManager(store);
  
  // Start API server
  startApiServer(store, workerManager);
}

module.exports = startMaster;