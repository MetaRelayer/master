Meta Relay NFT Contract

This repository contains a Meta Relay Gasless NFT contract for the Monad blockchain. 
It uses a relay-based architecture where users can mint NFTs without paying gas fees.


Setting Up Hardhat

1. Create a New Project (Skip if using this repo)

If you're starting from scratch:

mkdir monad-gasless-nft
cd monad-gasless-nft
npm init -y

2. Install Hardhat and Dependencies

Install dotenv 
npm install --save-dev dotenv

npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox-viem @openzeppelin/contracts

3. Initialize Hardhat, If you're setting up a new project:
npx hardhat init  (Select "Create a TypeScript project" when prompted.)

4. Install ignition since we deploy using this method
npm install --save-dev @nomicfoundation/hardhat-ignition

mkdir -p ignition/modules

Create ignition/modules/Relay.ts with the following content:
typescriptCopyimport { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const RelayTestnetModule = buildModule("RelayTestnetModule", (m) => {
    // Replace with your relayer address where you hold MON
    // You will need to set PrivateKey for this address in your Relay Service
    const relayerAddress = "YOUR_RELAYER_ADDRESS";  
    
    // Deploy the RelayTransaction contract with the relayer address
    const metaTransaction = m.contract("RelayTransaction", [relayerAddress]);
    
    return { metaTransaction };
});

module.exports = RelayTestnetModule;

5. Configure Hardhat for Monad
Replace the content of hardhat.config.ts with:

import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ignition";
import "@nomicfoundation/hardhat-toolbox-viem";
import dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      metadata: {
        bytecodeHash: "none", 
        useLiteralContent: true, 
      },
    },
  },
  networks: {
    monadTestnet: {
      url: "https://testnet-rpc.monad.xyz",
      chainId: 10143,
      accounts: [PRIVATE_KEY]
    },
  },
    sourcify: {
    enabled: true,
    // for contract verification
    apiUrl: "https://sourcify-api-monad.blockvision.org",
    browserUrl: "https://testnet.monadexplorer.com",
  },
  // To avoid errors from Etherscan
  etherscan: {
    enabled: false,
  },
};

export default config;

6. Add Your Private Key 
Create a .env file in the project root:
touch .env

Add your private key to the .env file:
PRIVATE_KEY=your_private_key_here

7.Deploying the Contract

Compile the Contract
npx hardhat compile

Deploy to Monad Testnet
npx hardhat ignition deploy ignition/modules/Relay.ts --network monadTestnet

Verifying the Contract
npx hardhat verify --network monadTestnet 0xYourContractAddressHere "0xRelayerAddressUsedInDeployment"

Resources

Monad Documentation 
https://docs.monad.xyz/

Deploy Smart Contracts on Monad
https://docs.monad.xyz/getting-started/deploy-smart-contract/hardhat  

Verify Smart Contracts on Monad
https://docs.monad.xyz/getting-started/verify-smart-contract/hardhat

Hardhat Documentation
https://hardhat.org/docs

Hardhat Ignition
https://hardhat.org/ignition/docs/getting-started
