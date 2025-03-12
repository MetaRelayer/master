// Configuration settings for the relayer
require('dotenv').config();

function getConfig() {
  // Environment variables with defaults
  return {
    // Blockchain settings
    RPC_URL: process.env.RPC_URL || 'https://testnet-rpc.monad.xyz/',
    CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || '0x0238C45aDE925d7822B94FFf6D35a9C414532996',
    RELAYER_PRIVATE_KEY: process.env.RELAYER_PRIVATE_KEY || '',
    
    // Server settings
    PORT: parseInt(process.env.PORT || '3000'),
    HOST: process.env.HOST || '0.0.0.0',
    
    // Application settings
    MAX_WORKERS: parseInt(process.env.MAX_WORKERS || '8'),
    TRANSACTION_TIMEOUT: parseInt(process.env.TRANSACTION_TIMEOUT || '60000'),
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    
    // Gas settings for transactions
    GAS_LIMIT: parseInt(process.env.GAS_LIMIT || '150000'),
    GAS_PRICE_MULTIPLIER: parseFloat(process.env.GAS_PRICE_MULTIPLIER || '1.1')
  };
}

module.exports = { getConfig };