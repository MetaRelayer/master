// Processes mint transactions
function setupTransactionHandler(blockchain, workerId) {
  // Worker status tracking
  let workerMetrics = {
    pendingTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    transactions: {} // Track individual transactions
  };
  
  // Update master with status
  function updateStatus() {
    process.send({
      type: 'worker_status',
      workerId,
      status: {
        pendingTasks: workerMetrics.pendingTasks,
        completedTasks: workerMetrics.completedTasks,
        failedTasks: workerMetrics.failedTasks,
        status: 'active',
        transactions: Object.keys(workerMetrics.transactions).length
      }
    });
  }
  
  // Update transaction status in master process
  function updateTransactionStatus(requestId, status, data = {}) {
    if (workerMetrics.transactions[requestId]) {
      // Update local worker state
      workerMetrics.transactions[requestId] = {
        ...workerMetrics.transactions[requestId],
        ...data,
        status
      };
      
      // Update master
      process.send({
        type: 'tx_update',
        requestId,
        data: {
          ...data,
          status
        }
      });
    }
  }
  
  // Get transaction status
  function getTransactionStatus(requestId) {
    if (workerMetrics.transactions[requestId]) {
      const txData = workerMetrics.transactions[requestId];
      
      // Send the transaction data back to the master
      process.send({
        type: 'tx_status_response',
        requestId,
        found: true,
        data: {
          status: txData.status || 'unknown',
          txHash: txData.txHash || null,
          blockNumber: txData.blockNumber || null,
          error: txData.error || null,
          user: txData.user,
          tokenId: txData.tokenId,
          duration: txData.duration
        }
      });
    } else {
      // We don't have this transaction
      process.send({
        type: 'tx_status_response',
        requestId,
        found: false
      });
    }
  }
  
  // Check if a user has minted
  async function checkHasMinted(address, requestId) {
    const hasMinted = await blockchain.checkHasMinted(address);
    process.send({
      type: 'minted_response',
      requestId,
      hasMinted
    });
  }
  
  // Process mint request
  async function processMintRequest(requestData, requestId) {
    const { user, tokenId, sigR, sigS, sigV } = requestData;
    const startTime = Date.now();
    
    // Update worker metrics
    workerMetrics.pendingTasks++;
    workerMetrics.transactions[requestId] = {
      user,
      tokenId,
      startTime,
      status: 'processing'
    };
    updateStatus();
    
    // Update transaction status in master
    updateTransactionStatus(requestId, 'processing', { user, tokenId });
    
    try {
      // Double-check if user has already minted (ask the master process)
      const hasMintedPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => resolve(false), 1000); // Default to false if no response
        
        function messageHandler(message) {
          if (message.type === 'minted_response' && message.requestId === requestId) {
            clearTimeout(timeout);
            process.removeListener('message', messageHandler);
            resolve(message.hasMinted);
          }
        }
        
        process.on('message', messageHandler);
        process.send({ type: 'check_minted', address: user, requestId, workerId });
      });
      
      const hasMinted = await hasMintedPromise;
      if (hasMinted) {
        console.log(`[Worker ${workerId}] User ${user} has already minted`);
        
        // Update metrics
        workerMetrics.pendingTasks--;
        workerMetrics.failedTasks++;
        workerMetrics.transactions[requestId].status = 'already_minted';
        updateStatus();
        
        // Update transaction status
        updateTransactionStatus(requestId, 'already_minted', { 
          error: 'User has already minted an NFT' 
        });
        
        // Notify master
        process.send({
          type: 'mint_failure',
          address: user,
          error: 'ALREADY_MINTED',
          workerId,
          requestId
        });
        
        return;
      }
      
      // Double-check with blockchain (in case master's cache is outdated)
      const onChainHasMinted = await blockchain.checkHasMinted(user);
      if (onChainHasMinted) {
        console.log(`[Worker ${workerId}] On-chain check: User ${user} has already minted`);
        
        // Update metrics
        workerMetrics.pendingTasks--;
        workerMetrics.failedTasks++;
        workerMetrics.transactions[requestId].status = 'already_minted';
        updateStatus();
        
        // Update transaction status
        updateTransactionStatus(requestId, 'already_minted', { 
          error: 'User has already minted an NFT (blockchain check)' 
        });
        
        // Notify master so it can update its cache
        process.send({
          type: 'mint_success', // Mark as success to update the master's cache
          address: user,
          workerId,
          requestId
        });
        
        return;
      }
      
      // Submit transaction
      console.log(`[Worker ${workerId}] Submitting transaction for user ${user}, tokenId ${tokenId}`);
      updateTransactionStatus(requestId, 'submitting');
      
      const tx = await blockchain.submitTransaction(user, tokenId, sigR, sigS, sigV);
      
      // Transaction submitted, update status
      console.log(`[Worker ${workerId}] Transaction submitted: ${tx.hash}`);
      updateTransactionStatus(requestId, 'submitted', { txHash: tx.hash });
      
      // Wait for confirmation
      console.log(`[Worker ${workerId}] Waiting for confirmation for tx: ${tx.hash}`);
      const receipt = await tx.wait();
      
      // Transaction confirmed, update status
      console.log(`[Worker ${workerId}] Transaction confirmed in block ${receipt.blockNumber}`);
      
      // Update metrics
      workerMetrics.pendingTasks--;
      workerMetrics.completedTasks++;
      workerMetrics.transactions[requestId].status = 'confirmed';
      workerMetrics.transactions[requestId].txHash = tx.hash;
      workerMetrics.transactions[requestId].blockNumber = receipt.blockNumber;
      workerMetrics.transactions[requestId].duration = Date.now() - startTime;
      updateStatus();
      
      // Update transaction status
      updateTransactionStatus(requestId, 'confirmed', {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        duration: Date.now() - startTime
      });
      
      // Notify master
      process.send({
        type: 'mint_success',
        address: user,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        workerId,
        requestId
      });
      
      // Clean up local transaction tracking after 10 minutes
      setTimeout(() => {
        delete workerMetrics.transactions[requestId];
      }, 10 * 60 * 1000);
      
    } catch (error) {
      // Handle errors
      console.error(`[Worker ${workerId}] Error processing mint request:`, error.message);
      
      // Update metrics
      workerMetrics.pendingTasks--;
      workerMetrics.failedTasks++;
      workerMetrics.transactions[requestId].status = 'failed';
      workerMetrics.transactions[requestId].error = error.message;
      workerMetrics.transactions[requestId].duration = Date.now() - startTime;
      updateStatus();
      
      // Update transaction status
      updateTransactionStatus(requestId, 'failed', {
        error: error.message,
        errorCode: error.code,
        duration: Date.now() - startTime
      });
      
      // Notify master
      process.send({
        type: 'mint_failure',
        address: user,
        error: error.message,
        errorCode: error.code,
        workerId,
        requestId
      });
      
      // Clean up local transaction tracking after 10 minutes
      setTimeout(() => {
        delete workerMetrics.transactions[requestId];
      }, 10 * 60 * 1000);
    }
  }
  
  // Return available methods
  return {
    processMintRequest,
    checkHasMinted,
    getTransactionStatus
  };
}

module.exports = { setupTransactionHandler };
