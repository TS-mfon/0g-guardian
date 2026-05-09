// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract MockAgentId {
    uint256 public nextTokenId = 1;
    mapping(uint256 => address) public ownerOf;
    mapping(uint256 => string) public encryptedURI;
    mapping(uint256 => bytes32) public metadataHash;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event AgentMetadataUpdated(uint256 indexed tokenId, string encryptedURI, bytes32 metadataHash);

    function mint(address to, string calldata uri, bytes32 hash) external returns (uint256 tokenId) {
        require(to != address(0), "invalid owner");
        require(hash != bytes32(0), "invalid metadata");
        tokenId = nextTokenId++;
        ownerOf[tokenId] = to;
        encryptedURI[tokenId] = uri;
        metadataHash[tokenId] = hash;
        emit Transfer(address(0), to, tokenId);
        emit AgentMetadataUpdated(tokenId, uri, hash);
    }
}
