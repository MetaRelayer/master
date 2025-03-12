// src/components/NFT/NFTComponent/index.tsx
import React from 'react';
import { useState, useEffect } from "react";
import { Check, AlertCircle } from "lucide-react";
import ConnectComponent from '../ConnectComponent';
import MintComponent from '../MintComponent';
import {
  checkHasMinted,
  domain,
  generateNextTokenId
} from './constant';
import { useAccount, useNetwork } from 'wagmi';

// Fix the window.ethereum type by referencing existing types from Wagmi
import { Ethereum } from '@wagmi/core';
type ExtendedEthereum = Ethereum & {
  isMetaMask?: boolean;
};

declare global {
  interface Window {
    Ethereum?: ExtendedEthereum;
  }
}

const NFTComponent = () => {
  const [hasMinted, setHasMinted] = useState<boolean>(false);
  const [userAddress, setUserAddress] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [tokenId, setTokenId] = useState<string>("");
  const [chainId, setChainId] = useState<number>(domain.chainId);

  const { address } = useAccount();
  const { chain } = useNetwork();

  // Check wallet connection on load
  useEffect(() => {
    const checkConnection = async () => {
      if (address) {
        setUserAddress(address);
        if (chain?.id) {
          setChainId(chain.id);
        }
        await checkHasMinted(address, setHasMinted);
        const generateId = await generateNextTokenId();
        setTokenId(generateId.toString());
      }
    };
    checkConnection();
  }, [address, chain]);

  // Update chain ID when it changes
  useEffect(() => {
    if (chain?.id) {
      setChainId(chain.id);
    }
  }, [chain]);

  return (
    <div className="flex flex-col justify-center">
      <div className="relative w-full">
        <div className="relative">
          <div className="w-full">
            <div className="text-center mb-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-0">Monad Gasless NFT</h1>
              <p className="text-gray-600">Don't worry, the transaction fee is on us</p>
              {hasMinted && userAddress && (
                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <Check className="w-4 h-4 mr-1" />
                  You already minted!
                </div>
              )}
            </div>
            {chainId !== domain.chainId && (
              <div className="mb-8 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-3 text-amber-800">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>Please switch to Monad Testnet network</span>
              </div>
            )}
            <ConnectComponent
              userAddress={userAddress}
              setUserAddress={setUserAddress}
              setHasMinted={setHasMinted}
              setChainId={setChainId}
              setTokenId={setTokenId}
              setMessage={setMessage}
            />
            <MintComponent
              tokenId={tokenId}
              chainId={chainId}
              userAddress={userAddress}
              hasMinted={hasMinted}
              setMessage={setMessage}
              setHasMinted={setHasMinted}
            />
            {message && (
              <div
                className={`mt-8 p-3 rounded-xl ${message.includes("Error")
                  ? "bg-red-50 border border-red-200 text-red-700"
                  : "bg-green-50 border border-green-200 text-green-700"
                  }`}
              >
                {message.includes("NFT minted!") ? (
                  <p>
                    NFT Minted Successfully!{" "}
                    <a
                      href={message.split("hash: ")[1]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 underline"
                    >
                      View on Monad Explorer
                    </a>
                  </p>
                ) : (
                  message
                )}
              </div>
            )}
          </div>
        </div>
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 transform -skew-y-6 sm:skew-y-0 sm:rotate-180" />
        </div>
      </div>
      <div className="text-center mt-8 text-gray-500 text-sm">
        With Love for Monad
      </div>
    </div>
  );
};

export default NFTComponent;