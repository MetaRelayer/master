// src/components/NFT/NFTComponent/constant.ts (partial - just the affected function)

// Import the correct provider for ethers v5
import { ethers } from 'ethers';

// CONTRACT
export const CONTRACT_ADDRESS = "0x0238C45aDE925d7822B94FFf6D35a9C414532996"; // MUST CHANGE this CONTRACT ADDRESS WITH YOURS
export const EXPLORER_URL = "https://testnet.monadexplorer.com/tx";
export const NODE_URL = "http://localhost:3000";

export const domain = {
  name: "GaslessNFT",
  version: "1",
  chainId: 10143,
  verifyingContract: CONTRACT_ADDRESS,
};

export const types = {
  Mint: [
    { name: "user", type: "address" },
    { name: "tokenId", type: "uint256" },
  ],
};

// Check if user has already minted - fixed for ethers v5
export const checkHasMinted = async (address: string, setHasMinted: any) => {
  try {
    // Use providers.JsonRpcProvider for ethers v5
    const provider = new ethers.providers.JsonRpcProvider("https://monad-testnet.g.alchemy.com/v2/nRKjRbGd1vlkIaIxAlLUhd0rbTnE1s69");
    const abi = ["function hasMinted(address user) view returns (bool)"];
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
    const result = await contract.hasMinted(address);
    setHasMinted(result);
    return result;
  } catch (error) {
    console.error("Error checking mint status:", error);
    return false;
  }
};

export const generateNextTokenId = async () => {
  const randomId = Math.floor(Math.random() * 10000);
  return randomId;
};