// src/components/NFT/ConnectComponent/index.tsx
import React, { useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId } from 'wagmi';
import { Wallet } from 'lucide-react';

const ConnectComponent = ({
  userAddress,
  setUserAddress,
  setHasMinted,
  setChainId,
  setTokenId,
  setMessage,
}: any) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  // Update parent component state when connection changes
  useEffect(() => {
    if (isConnected && address) {
      setUserAddress(address);
      if (chainId) {
        setChainId(chainId);
      }
      
      // Check if user has minted
      const checkMintStatus = async () => {
        try {
          const { checkHasMinted } = await import('../NFTComponent/constant');
          await checkHasMinted(address, setHasMinted);
          setMessage("Wallet connected!");
        } catch (error) {
          console.error("Error checking mint status:", error);
        }
      };
      
      checkMintStatus();
    } else {
      // Handle disconnect
      if (!isConnected && userAddress) {
        const handleDisconnect = async () => {
          const { generateNextTokenId } = await import('../NFTComponent/constant');
          const generateId = await generateNextTokenId();
          setTokenId(generateId.toString());
          setUserAddress("");
          setMessage("Wallet disconnected");
          setHasMinted(false);
        };
        
        handleDisconnect();
      }
    }
  }, [address, isConnected, chainId, setChainId, setHasMinted, setMessage, setTokenId, setUserAddress, userAddress]);

  return (
    <div className="w-full mb-4 flex items-center justify-center">
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          const ready = mounted && authenticationStatus !== 'loading';
          const connected = ready && account && chain && (!authenticationStatus || authenticationStatus === 'authenticated');

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                'style': {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
              className="w-full"
            >
              {(() => {
                if (!connected) {
                  return (
                    <div className="w-full flex items-center justify-center space-x-2">
                      <button
                        onClick={openConnectModal}
                        className="btn btn-primary rounded-pill transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <div className="flex items-center space-x-2">
                          <Wallet className="h-5 w-5" />
                          <span>Connect Wallet</span>
                        </div>
                      </button>
                    </div>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <div className="w-full flex items-center justify-center space-x-2">
                      <button
                        onClick={openChainModal}
                        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium flex items-center space-x-2 text-white"
                      >
                        <span>Wrong Network</span>
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="w-full flex flex-col gap-2 mb-8">
                    <div className="flex items-center justify-between p-3 bg-blue-600 text-white rounded-xl">
                      <div className="flex items-center space-x-2">
                        <Wallet className="h-5 w-5" />
                        <button onClick={openAccountModal} className="font-medium">
                          {account.displayName}
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={openChainModal}
                          className="bg-blue-500 hover:bg-blue-700 px-3 py-1 rounded-lg transition-colors duration-200 text-xs font-medium"
                        >
                          {chain.name}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
    </div>
  );
};

export default ConnectComponent;