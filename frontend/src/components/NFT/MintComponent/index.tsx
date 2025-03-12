// src/components/NFT/MintComponent/index.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';
import { Loader2, Check } from "lucide-react";
import ButtonComponent from 'components/FormComponet/ButtonComponent';
import { domain, EXPLORER_URL, NODE_URL, types } from 'components/NFT/NFTComponent/constant';
import { useAccount } from 'wagmi';

const MintComponent = ({
  tokenId,
  chainId,
  userAddress,
  hasMinted,
  setMessage,
  setHasMinted
}: any) => {
  const [isMinting, setIsMinting] = useState<boolean>(false);
  const { address } = useAccount();

  const mintNFT = async (): Promise<void> => {
    if (!userAddress) {
      setMessage("Please connect your wallet first.");
      return;
    }

    if (hasMinted) {
      setMessage("You have already minted your NFT. One mint per address is allowed.");
      return;
    }

    if (chainId !== domain.chainId) {
      setMessage("Please switch to Monad Testnet network.");
      return;
    }

    // Make sure tokenId is a valid number
    const parsedTokenId = parseInt(tokenId);
    if (isNaN(parsedTokenId)) {
      setMessage("Invalid token ID. Please reload the page.");
      return;
    }

    setIsMinting(true);
    try {
      // Check if ethereum provider exists
      if (!window.ethereum) {
        throw new Error("Ethereum provider not found. Please install MetaMask or use WalletConnect.");
      }

      // Create provider and signer - compatible with ethers v5
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();

      const value = {
        user: userAddress,
        tokenId: parsedTokenId // Use the parsed token ID
      };

      console.log("Signing with values:", value);

      // For ethers v5
      const signature = await signer._signTypedData(domain, types, value);
      const sig = ethers.utils.splitSignature(signature);

      const response = await axios.post(`${NODE_URL}/relay`, {
        user: userAddress,
        tokenId: parsedTokenId, // Use the parsed token ID
        sigR: sig.r,
        sigS: sig.s,
        sigV: sig.v,
      }, {
        headers: { "Content-Type": "application/json" },
        timeout: 10000
      });

      if (response.data.success) {
        // Get the requestId 
        const requestId = response.data.requestId;
        setMessage(`Transaction submitted. Waiting for confirmation...`);

        // Start polling for the transaction status
        let statusCheckAttempts = 0;
        const maxStatusChecks = 30;

        // Create a new interval for status checking
        const statusCheckInterval = setInterval(async () => {
          try {
            statusCheckAttempts++;

            // Check worker's transaction status
            const statusUrl = `${NODE_URL}/status/${requestId}`;
            const statusResponse = await axios.get(statusUrl, { timeout: 5000 });

            console.log("Status check:", statusResponse.data);

            // If we have a transaction hash, show success
            if (statusResponse.data.txHash) {
              clearInterval(statusCheckInterval);
              const txHash = statusResponse.data.txHash;
              setMessage(`NFT minted! Transaction hash: ${EXPLORER_URL}/${txHash}`);
              setHasMinted(true);
              setIsMinting(false);
              return;
            }

            if (statusResponse.data.status === 'failed') {
              clearInterval(statusCheckInterval);
              throw new Error(statusResponse.data.error || "Transaction failed");
            }

            // If we've checked too many times, give up
            if (statusCheckAttempts >= maxStatusChecks) {
              clearInterval(statusCheckInterval);
              setMessage(`Transaction submitted, but confirmation is taking longer than expected. ` +
                `You can check your wallet or block explorer later.`);
              setHasMinted(true);
              setIsMinting(false);
            }
          } catch (statusError) {
            console.error("Error checking status:", statusError);

            // If we've checked too many times, give up
            if (statusCheckAttempts >= maxStatusChecks) {
              clearInterval(statusCheckInterval);
              setMessage(`Transaction submitted, but confirmation status is unknown. ` +
                `You can check your wallet or block explorer later.`);
              setHasMinted(true);
              setIsMinting(false);
            }
          }
        }, 3000);

      } else {
        let errorMessage = response.data.error || "Unknown error occurred";

        // Handle error messages
        if (errorMessage.includes("User has already minted")) {
          errorMessage = "You have already minted your NFT. One mint per address is allowed.";
          setHasMinted(true);
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Minting error:", error);

      let errorMessage = "An unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;

        if (errorMessage.includes("User has already minted")) {
          errorMessage = "You have already minted your NFT. One mint per address is allowed.";
          setHasMinted(true);
        } else if (errorMessage.includes("user rejected")) {
          errorMessage = "Transaction was rejected in your wallet.";
        } else if (errorMessage.includes("insufficient funds")) {
          errorMessage = "The relayer doesn't have enough funds. Please try again later.";
        } else if (errorMessage.includes("Invalid signature")) {
          errorMessage = "The signature verification failed. Please try again.";
        }
      }

      setMessage(`Error: ${errorMessage}`);
      setIsMinting(false);
    }
  };

  return (
    <div>
      <div className="mb-8 rounded-xl">
        <div
          className="py-10 relative rounded-lg overflow-hidden mb-4 flex flex-col items-center justify-center"
          style={{ backgroundColor: '#200052' }}
        >
          <div className="flex items-center justify-center mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 111 111"
              className="w-24 h-24 animate-spin-slow"
              fill="none"
            >
              <path
                d="M55.4997 0C39.4726 0 0 39.4717 0 55.4997C0 71.5276 39.4726 111 55.4997 111C71.5268 111 111 71.5269 111 55.4997C111 39.4724 71.5274 0 55.4997 0ZM46.851 87.2363C40.0926 85.3946 21.9218 53.6094 23.7638 46.8509C25.6058 40.0921 57.3903 21.9218 64.1487 23.7637C70.9075 25.6054 89.0782 57.39 87.2362 64.1488C85.3943 70.9077 53.6094 89.0783 46.851 87.2363Z"
                fill="#836EF9"
              />
            </svg>
          </div>
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-white font-monument animate-pulse tracking-widest">
              GASLESS NFT
            </h3>
          </div>
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <p className="text-sm text-purple-100 font-medium">
              Token ID: {tokenId || "Generating..."}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center">
        <ButtonComponent
          onClick={mintNFT}
          disabled={!userAddress || isMinting || chainId !== domain.chainId || hasMinted || !tokenId}
          className="bg-green-600 text-white py-3 px-5 rounded-pill hover:bg-green-700 disabled:bg-gray-400 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] font-medium flex items-center justify-center space-x-2"
        >
          {isMinting ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="animate-spin h-5 w-5 text-white" />
              <span>Minting...</span>
            </div>
          ) : hasMinted ? (
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5" />
              <span>Already Minted</span>
            </div>
          ) : (
            "Mint NFT"
          )}
        </ButtonComponent>
      </div>
    </div>
  );
};

export default MintComponent;