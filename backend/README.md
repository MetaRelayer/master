Monad Gasless Relayer

A high-performance parallel relayer service for gasless NFT minting on Monad blockchain.

Features:
Multi-process architecture using Node.js cluster module
Automatic load balancing across multiple worker processes
Gasless minting of NFTs (meta-transactions)
REST API for transaction submission and status checking
Health monitoring and metrics
Proper error handling and retry logic

Installation

Clone this repository:

bashCopygit clone https://github.com/MetaRelayer/master.git
cd backend


Install dependencies:

npm install

Create your environment configuration:

.env

Edit the .env file and add your relay wallet's private key, contract address and rpc settings.

Configuration

The relayer can be configured using environment variables:

Testnet RPC endpoint https://testnet-rpc.monad.xyz/
CONTRACT_ADDRESS
Address of the Gasless NFT contract

RELAYER_PRIVATE_KEY
Private key for the relayer wallet(required)

PORT
Port for the API server3000

HOST
Host for the API server0.0.0.0 

MAX_WORKERS 
Maximum number of worker processes 8 

TRANSACTION_TIMEOUT
Timeout for transactions (ms)60000

LOG_LEVEL
Winston logger levelinfo

GAS_LIMITGas
limit for transactions1 50000


Running the Relayer
Start the relayer service:

npm start

For development with auto-restart:
npm run dev

API Endpoints

Submit a Transaction
/relay

Check Transaction Status
GET /status/:requestId

Check if Address Has Minted
GET /hasMinted/:address

Health Check
GET /health

Architecture
The relayer uses a master-worker architecture:
The master process handles API requests and distributes work
Worker processes handle blockchain interactions
Communication between master and workers is via Node.js IPC
Automatic load balancing distributes tasks to the least busy worker
Dead workers are automatically restarted
