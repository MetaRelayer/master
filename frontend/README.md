
# Meta Relayer Frontend App

Meta Relayer frontend app to showcase gasless transaction by minting gasless NFT on Monad testnet utilizing relay service and contract.

## Installation and Run Project

### Install all the packages mentioned in the package.json
```bash
yarn install
```

### Once all the packages are installed run project on browser using
```bash
yarn start

# Make sure not to use 3000 port as its reserved for the relayer service, so you can either use 3001 or any other if you setup the project on the localhost machine.
```

## Packages Includes
- Rainbow wallet kit
- Ethers
- Wagmi
- Axions

## Design Template
- Tailwindcss

## Use Rainbow wallet kit, supported wallet to Monad:
- Metamask default
- Phantom
- Okx wallet

## Configuration
You can customize your relay API and endpoints in `src/components/NFT/NFTComponent/constant.ts`:
```typescript
export const CONTRACT_ADDRESS = "YOUR CONTRACT ADDRESS";
export const EXPLORER_URL = "https://testnet.monadexplorer.com/tx"; # YOU CAN CHANGE THIS RPC WITH YOURS
export const NODE_URL = "http://localhost:3000"; # BY DEFAULT localhost if you are on development, you can change the endpoints in relay if you want to change.
```

## In action demo - https://metarelayer.xyz/
## Demo video - https://www.youtube.com/watch?v=dBZktf99kp8
