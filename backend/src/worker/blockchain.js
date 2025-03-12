// Handles blockchain interactions
const { ethers } = require('ethers');
const { getConfig } = require('../utils/config');

async function initializeBlockchain() {
  // Get configuration
  const config = getConfig();
  
  // Create provider
  const provider = new ethers.JsonRpcProvider(config.RPC_URL, undefined, {
    staticNetwork: true,
    batchStallTime: 5, // Lower for quicker execution
    pollingInterval: 750, // Slightly faster for worker processes
  });
  
  // Create wallet
  const relayerWallet = new ethers.Wallet(config.RELAYER_PRIVATE_KEY, provider);
  
  // Initialize nonce tracking
  let currentNonce = await relayerWallet.getNonce();
  let nonceLastRefreshed = Date.now();
  
  // NFT contract ABI
  const gaslessNFTAbi = [
    {
      inputs: [
        { internalType: "address", name: "user", type: "address" },
        { internalType: "uint256", name: "tokenId", type: "uint256" },
        { internalType: "bytes32", name: "sigR", type: "bytes32" },
        { internalType: "bytes32", name: "sigS", type: "bytes32" },
        { internalType: "uint8", name: "sigV", type: "uint8" },
      ],
      name: "mintNFT",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "user", type: "address" }],
      name: "hasMinted",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "view",
      type: "function",
    },
  ];
  
  // Create contract instance
  const gaslessNFTContract = new ethers.Contract(
    config.CONTRACT_ADDRESS,
    gaslessNFTAbi,
    relayerWallet
  );
  
  // Function to refresh nonce
  async function refreshNonce() {
    try {
      const newNonce = await relayerWallet.getNonce();
      if (newNonce !== currentNonce) {
        console.log(`Nonce updated: ${currentNonce} -> ${newNonce}`);
        currentNonce = newNonce;
      }
      nonceLastRefreshed = Date.now();
      return currentNonce;
    } catch (error) {
      console.error(`Error refreshing nonce:`, error.message);
      throw error;
    }
  }
  
  return {
    provider,
    relayerWallet,
    gaslessNFTContract,
    currentNonce,
    nonceLastRefreshed,
    refreshNonce,
    
    // Helper to check if a user has minted
    async checkHasMinted(address) {
      try {
        return await gaslessNFTContract.hasMinted(address);
      } catch (error) {
        console.warn(`Error checking if ${address} has minted:`, error.message);
        return false; // Assume not minted, contract will reject if already minted
      }
    },
    
    // Helper to submit a transaction with the correct nonce
    async submitTransaction(user, tokenId, sigR, sigS, sigV) {
      // Get fresh nonce if needed
      if (Date.now() - nonceLastRefreshed > 2000) {
        await refreshNonce();
      }
      
      // Submit transaction
      const tx = await gaslessNFTContract.mintNFT(
        user,
        tokenId,
        sigR,
        sigS,
        sigV,
        {
          gasLimit: 150000,
          // Critical: Incrementing nonce each time ensures parallel execution in Monad
          nonce: currentNonce++
        }
      );
      
      return tx;
    }
  };
}

module.exports = { initializeBlockchain };