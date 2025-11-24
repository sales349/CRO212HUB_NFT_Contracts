// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * LaunchpadCollection
 *
 * Per-collection ERC721 contract for the CRO212 NFT Launchpad.
 * - Public mint (mintPublic)
 * - Whitelist mint (mintWhitelist) using Merkle root
 * - Max supply & per-wallet limits
 * - Revenue split: treasury / platform / optional community
 */

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract LaunchpadCollection is ERC721Enumerable, Ownable, ReentrancyGuard {
    // ========= Core config =========

    uint256 public immutable maxSupply;
    uint256 public mintPrice;          // in wei (CRO)
    uint256 public maxPerWallet;       // per address limit

    bool public saleActive;            // public sale flag
    bool public whitelistSaleActive;   // whitelist sale flag

    string private baseTokenURI;       // base URI for metadata

    // ========= Mint tracking =========

    mapping(address => uint256) public mintsByWallet;

    // ========= Whitelist (Merkle root) =========

    bytes32 public whitelistMerkleRoot;

    // ========= Payment split config =========

    address public treasuryWallet;     // project
    address public platformWallet;     // CRO212
    address public communityWallet;    // optional (LP / community)

    uint16 public treasuryBasisPoints;  // e.g. 9000 = 90%
    uint16 public platformBasisPoints;  // e.g. 1000 = 10%
    uint16 public communityBasisPoints; // optional

    uint16 public constant MAX_BASIS_POINTS = 10000; // 100%

    // ========= Events =========

    event PublicMint(address indexed minter, uint256 quantity, uint256 value);
    event WhitelistMint(address indexed minter, uint256 quantity, uint256 value);
    event Airdrop(address indexed recipient, uint256 quantity);
    event Withdraw(uint256 treasuryAmount, uint256 platformAmount, uint256 communityAmount);
    event BaseURISet(string newBaseURI);
    event MintPriceSet(uint256 newPrice);
    event MaxPerWalletSet(uint256 newMax);
    event SaleActiveSet(bool active);
    event WhitelistSaleActiveSet(bool active);
    event WhitelistMerkleRootSet(bytes32 newRoot);

    // ========= Constructor =========

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _maxSupply,
        uint256 _mintPrice,
        uint256 _maxPerWallet,
        address _treasuryWallet,
        address _platformWallet,
        uint16 _treasuryBasisPoints,
        uint16 _platformBasisPoints,
        address _communityWallet,
        uint16 _communityBasisPoints
    ) ERC721(_name, _symbol) Ownable(msg.sender) {
        require(_maxSupply > 0, "Max supply must be > 0");
        require(_treasuryWallet != address(0), "Treasury wallet cannot be zero");
        require(_platformWallet != address(0), "Platform wallet cannot be zero");

        uint16 totalBps = _treasuryBasisPoints + _platformBasisPoints + _communityBasisPoints;
        require(totalBps == MAX_BASIS_POINTS, "Basis points must sum to 10000");

        if (_communityBasisPoints > 0) {
            require(_communityWallet != address(0), "Community wallet required when bps > 0");
        }

        maxSupply = _maxSupply;
        mintPrice = _mintPrice;
        maxPerWallet = _maxPerWallet;

        treasuryWallet = _treasuryWallet;
        platformWallet = _platformWallet;
        communityWallet = _communityWallet;

        treasuryBasisPoints = _treasuryBasisPoints;
        platformBasisPoints = _platformBasisPoints;
        communityBasisPoints = _communityBasisPoints;
    }

    // ========= Minting =========

    function mintPublic(uint256 quantity) external payable nonReentrant {
        require(saleActive, "Public sale is not active");
        _mintChecks(msg.sender, quantity);
        _collectPayment(quantity);
        _mintTokens(msg.sender, quantity);
        emit PublicMint(msg.sender, quantity, msg.value);
    }

    function mintWhitelist(uint256 quantity, bytes32[] calldata merkleProof) external payable nonReentrant {
        require(whitelistSaleActive, "Whitelist sale is not active");
        require(whitelistMerkleRoot != bytes32(0), "Whitelist root not set");

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(MerkleProof.verify(merkleProof, whitelistMerkleRoot, leaf), "Not in whitelist");

        _mintChecks(msg.sender, quantity);
        _collectPayment(quantity);
        _mintTokens(msg.sender, quantity);
        emit WhitelistMint(msg.sender, quantity, msg.value);
    }

    function _mintChecks(address minter, uint256 quantity) internal view {
        require(quantity > 0, "Quantity must be > 0");
        require(totalSupply() + quantity <= maxSupply, "Exceeds max supply");
        require(mintsByWallet[minter] + quantity <= maxPerWallet, "Exceeds wallet limit");
    }

    function _collectPayment(uint256 quantity) internal view {
        uint256 requiredValue = mintPrice * quantity;
        require(msg.value == requiredValue, "Incorrect CRO amount sent");
    }

    function _mintTokens(address to, uint256 quantity) internal {
        uint256 currentSupply = totalSupply();
        for (uint256 i = 0; i < quantity; i++) {
            uint256 newTokenId = currentSupply + 1 + i;
            _safeMint(to, newTokenId);
        }
        mintsByWallet[to] += quantity;
    }

    // ========= Airdrop =========

    function airdrop(address[] calldata recipients, uint256 quantityEach) external onlyOwner {
        require(quantityEach > 0, "Quantity must be > 0");
        uint256 totalRecipients = recipients.length;
        uint256 totalQuantity = totalRecipients * quantityEach;
        require(totalSupply() + totalQuantity <= maxSupply, "Exceeds max supply");

        for (uint256 i = 0; i < totalRecipients; i++) {
            address recipient = recipients[i];
            for (uint256 j = 0; j < quantityEach; j++) {
                uint256 newTokenId = totalSupply() + 1;
                _safeMint(recipient, newTokenId);
                mintsByWallet[recipient] += 1;
            }
            emit Airdrop(recipient, quantityEach);
        }
    }

    // ========= Withdraw (Revenue Split) =========

    function withdraw() external nonReentrant onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        uint256 treasuryAmount = (balance * treasuryBasisPoints) / MAX_BASIS_POINTS;
        uint256 platformAmount = (balance * platformBasisPoints) / MAX_BASIS_POINTS;
        uint256 communityAmount = (balance * communityBasisPoints) / MAX_BASIS_POINTS;

        uint256 remainder = balance - treasuryAmount - platformAmount - communityAmount;
        treasuryAmount += remainder;

        payable(treasuryWallet).transfer(treasuryAmount);
        payable(platformWallet).transfer(platformAmount);

        if (communityBasisPoints > 0 && communityWallet != address(0) && communityAmount > 0) {
            payable(communityWallet).transfer(communityAmount);
        }

        emit Withdraw(treasuryAmount, platformAmount, communityAmount);
    }

    // ========= Admin setters =========

    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        baseTokenURI = newBaseURI;
        emit BaseURISet(newBaseURI);
    }

    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
        emit MintPriceSet(newPrice);
    }

    function setMaxPerWallet(uint256 newMax) external onlyOwner {
        maxPerWallet = newMax;
        emit MaxPerWalletSet(newMax);
    }

    function setSaleActive(bool active) external onlyOwner {
        saleActive = active;
        emit SaleActiveSet(active);
    }

    function setWhitelistSaleActive(bool active) external onlyOwner {
        whitelistSaleActive = active;
        emit WhitelistSaleActiveSet(active);
    }

    function setWhitelistMerkleRoot(bytes32 newRoot) external onlyOwner {
        whitelistMerkleRoot = newRoot;
        emit WhitelistMerkleRootSet(newRoot);
    }

    function setWallets(
        address _treasuryWallet,
        address _platformWallet,
        address _communityWallet
    ) external onlyOwner {
        require(_treasuryWallet != address(0), "Treasury wallet cannot be zero");
        require(_platformWallet != address(0), "Platform wallet cannot be zero");
        treasuryWallet = _treasuryWallet;
        platformWallet = _platformWallet;
        communityWallet = _communityWallet;
    }

    function setBasisPoints(
        uint16 _treasuryBasisPoints,
        uint16 _platformBasisPoints,
        uint16 _communityBasisPoints
    ) external onlyOwner {
        uint16 totalBps = _treasuryBasisPoints + _platformBasisPoints + _communityBasisPoints;
        require(totalBps == MAX_BASIS_POINTS, "Basis points must sum to 10000");

        if (_communityBasisPoints > 0) {
            require(communityWallet != address(0), "Community wallet required when bps > 0");
        }

        treasuryBasisPoints = _treasuryBasisPoints;
        platformBasisPoints = _platformBasisPoints;
        communityBasisPoints = _communityBasisPoints;
    }

    // ========= Metadata =========

    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }
}
