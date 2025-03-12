// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract RelayTransaction is ERC721, EIP712 {
    using ECDSA for bytes32;

    uint256 private _tokenIdCounter; // Counter for NFT token IDs
    address private _relayer; // Address of the relayer
    
    // Mapping to track if an address has already minted
    mapping(address => bool) private _hasMinted;
    
    // Stores the highest token ID minted
    uint256 private _highestTokenId;

    // EIP-712 Domain Separator
    bytes32 private constant MINT_TYPEHASH =
        keccak256("Mint(address user,uint256 tokenId)");
        
    // Events
    event NFTMinted(address indexed user, uint256 tokenId);

    constructor(address relayer) ERC721("GaslessNFT", "GNFT") EIP712("GaslessNFT", "1") {
        _relayer = relayer;
    }

    // Function to mint an NFT using a meta-transaction with one-mint-per-address limit
    function mintNFT(
        address user,
        uint256 tokenId,
        bytes32 sigR,
        bytes32 sigS,
        uint8 sigV
    ) external {
        // Verify that the caller is the relayer
        require(msg.sender == _relayer, "Only relayer can call this function");
        
        // Check if user has already minted
        require(!_hasMinted[user], "User has already minted their NFT");

        // Reconstruct the signed message hash
        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(MINT_TYPEHASH, user, tokenId))
        );

        // Recover the signer's address from the signature
        address signer = ECDSA.recover(digest, sigV, sigR, sigS);
        require(signer == user, "Invalid signature");

        // Track that this address has minted
        _hasMinted[user] = true;
        
        // Update highest token ID if necessary
        if (tokenId > _highestTokenId) {
            _highestTokenId = tokenId;
        }
        
        // Update counter if necessary
        if (tokenId >= _tokenIdCounter) {
            _tokenIdCounter = tokenId + 1;
        }
        
        // Mint the NFT to the user
        _safeMint(user, tokenId);
        
        // Emit event for indexing/tracking
        emit NFTMinted(user, tokenId);
    }

    // Function to get the current token counter value
    function getCurrentTokenId() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    // Function to get the highest minted token ID
    function getHighestTokenId() external view returns (uint256) {
        return _highestTokenId;
    }

    // Function to check if an address has already minted
    function hasMinted(address user) external view returns (bool) {
        return _hasMinted[user];
    }
    
    // Function to get the relayer address
    function getRelayer() external view returns (address) {
        return _relayer;
    }
    
    // Update relayer (onlyOwner would be better but keeping it simple)
    function updateRelayer(address newRelayer) external {
        require(msg.sender == _relayer, "Only current relayer can update");
        require(newRelayer != address(0), "New relayer cannot be zero address");
        _relayer = newRelayer;
    }
    
    // Function to increment the token ID counter
    function incrementTokenId() external {
        _tokenIdCounter++;
    }
    
    // Function to generate the next available token ID
    function generateNextTokenId() external returns (uint256) {
        return _tokenIdCounter++;
    }
}