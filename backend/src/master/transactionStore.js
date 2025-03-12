// Manages transaction data and state

function setupTransactionStore() {
  // Transaction tracking in master process
  const activeTransactions = new Map(); // requestId -> {workerId, status, txHash, etc}
  
  // Simple shared memory cache for minted addresses (in-memory only)
  const mintedAddresses = new Set();
  
  // Health metrics
  const healthMetrics = {
    startTime: Date.now(),
    totalRequests: 0,
    successfulMints: 0,
    failedMints: 0,
    workerStatus: {}
  };
  
  return {
    // Transaction operations
    getTransaction: (requestId) => activeTransactions.get(requestId),
    setTransaction: (requestId, data) => activeTransactions.set(requestId, data),
    updateTransaction: (requestId, data) => {
      if (activeTransactions.has(requestId)) {
        const txData = activeTransactions.get(requestId);
        activeTransactions.set(requestId, {
          ...txData,
          ...data,
          lastUpdated: Date.now()
        });
      }
    },
    deleteTransaction: (requestId) => activeTransactions.delete(requestId),
    
    // Minted addresses operations
    hasMinted: (address) => mintedAddresses.has(address.toLowerCase()),
    addMintedAddress: (address) => mintedAddresses.add(address.toLowerCase()),
    
    // Metrics operations
    incrementTotalRequests: () => healthMetrics.totalRequests++,
    incrementSuccessfulMints: () => healthMetrics.successfulMints++,
    incrementFailedMints: () => healthMetrics.failedMints++,
    
    // Status operations 
    setWorkerStatus: (workerId, status) => {
      healthMetrics.workerStatus[workerId] = {
        ...healthMetrics.workerStatus[workerId],
        ...status,
        lastActiveTime: Date.now()
      };
    },
    
    // Getters for the entire state
    getActiveTransactions: () => activeTransactions,
    getAllMintedAddresses: () => mintedAddresses,
    getHealthMetrics: () => healthMetrics,
    
    // Initialize a worker's status
    initializeWorkerStatus: (workerId) => {
      healthMetrics.workerStatus[workerId] = {
        status: 'starting',
        transactions: 0,
        errors: 0,
        lastActiveTime: Date.now()
      };
    }
  };
}

module.exports = { setupTransactionStore };