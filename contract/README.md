
# Meta Relay NFT Contract

This repository contains a Meta Relay Gasless NFT contract for the Monad blockchain. It uses a relay-based architecture where users can mint NFTs without paying gas fees.

## Setting Up Hardhat

### Create a New Project (Skip if using this repo)

If you're starting from scratch:
```bash
mkdir monad-gasless-nft
cd monad-gasless-nft
npm init -y
```

### Install Hardhat and Dependencies

- Install dotenv
  ```bash
  npm install --save-dev dotenv
  ```

- Install Hardhat and other dependencies
  ```bash
  npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox-viem @openzeppelin/contracts
  ```

- Initialize Hardhat, If you're setting up a new project:
  ```bash
  npx hardhat init  # Select "Create a TypeScript project" when prompted.
  ```

- Install ignition since we deploy using this method
  ```bash
  npm install --save-dev @nomicfoundation/hardhat-ignition
  mkdir -p ignition/modules
  ```

- Create `ignition/modules/Relay.ts` with the following content:
  ```typescript
  import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

  const RelayTestnetModule = buildModule("RelayTestnetModule", (m) => {
    const relayerAddress = "YOUR_RELAYER_ADDRESS";  // Replace with your relayer address where you hold MON
    // Deploy the RelayTransaction contract with the relayer address
    const metaTransaction = m.contract("RelayTransaction", [relayerAddress]);

    return { metaTransaction };
  });

  module.exports = RelayTestnetModule;
  ```

### Configure Hardhat for Monad

Replace the content of `hardhat.config.ts` with:
```typescript
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
    enabled: true,  // for contract verification
    apiUrl: "https://sourcify-api-monad.blockvision.org",
    browserUrl: "https://testnet.monadexplorer.com",
  },
  etherscan: {
    enabled: false,
  },
};

export default config;
```

### Add Your Private Key

- Create a `.env` file in the project root:
  ```bash
  touch .env
  ```

- Add your private key to the `.env file:
  ```bash
  PRIVATE_KEY=your_private_key_here
  ```

## Deploying the Contract

### Compile the Contract
```bash
npx hardhat compile
```

### Deploy to Monad Testnet
```bash
npx hardhat ignition deploy ignition/modules/Relay.ts --network monadTestnet
```

### Verifying the Contract
```bash
npx hardhat verify --network monadTestnet 0xYourContractAddressHere "0xRelayerAddressUsedInDeployment"
```

## Resources

- [Monad Documentation](https://docs.monad.xyz/)
- [Deploy Smart Contracts on Monad](https://docs.monad.xyz/getting-started/deploy-smart-contract/hardhat)
- [Verify Smart Contracts on Monad](https://docs.monad.xyz/getting-started/verify-smart-contract/hardhat)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Hardhat Ignition](https://hardhat.org/ignition/docs/getting-started)
