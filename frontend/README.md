Meta Relayer frontend app to showcase gasless transaction by minting gasless NFT on Monad testnet utilizing relay service and contract.

Intallation and run project

-----------------------------------
Install all the packages mentioned in the package.json

yarn install

-----------------------------------
Once all the pacakges are installed run project on browser using

yarn start
make sure not to use 3000 port as its reserved for the relayer service, so you can either use 3001 or any other if you setup the project on the localhost machine.
-----------------------------------

Packages includes. 
Rainbow wallet kit
Ethers
wagmi
Axions
-----------------------------------

Design template
Tailwindcss

-----------------------------------
Use Rainbow wallet kit, supported wallet to Monad:
Metamask default
Phantom 
Okx wallet
-------------------------------------

You can customize your relay api and endpoints in src/components/NFT/NFTComponent/constant.js
constant.ts

export const CONTRACT_ADDRESS = "YOUR CONTRACT ADDRESS ";
export const EXPLORER_URL = "https://testnet.monadexplorer.com/tx"; # YOU CAN CHANGE THIS RPC WITH YOURS
export const NODE_URL = "http://localhost:3000"; BY DEFAULT localhost if you are on devlopment, you can change the endpoints in relay if you want to change.

