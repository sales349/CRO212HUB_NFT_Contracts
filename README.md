# CRO212HUB NFT Launchpad - Smart Contracts

Solidity smart contracts for the CRO212HUB NFT Launchpad on Cronos blockchain.

## Tech Stack

- Solidity ^0.8.20
- Hardhat
- OpenZeppelin Contracts
- Cronos Blockchain (Testnet & Mainnet)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your values:
```
PRIVATE_KEY=your_private_key_without_0x_prefix
CRONOSCAN_API_KEY=your_cronoscan_api_key
```

## Smart Contract

### LaunchpadCollection.sol

ERC-721 NFT contract with:
- Public mint (`mintPublic`)
- Whitelist mint (`mintWhitelist`) with Merkle proof
- Max supply & per-wallet limits
- Revenue split (treasury/platform/community)
- Owner controls (price, supply, sale status, etc.)

## Commands

### Compile Contracts

```bash
npx hardhat compile
```

### Run Tests

```bash
npx hardhat test
```

### Deploy to Testnet

1. Edit `scripts/deploy_launchpad.js` with your collection details:
   - NAME, SYMBOL
   - MAX_SUPPLY, MINT_PRICE, MAX_PER_WALLET
   - TREASURY_WALLET, PLATFORM_WALLET, COMMUNITY_WALLET
   - Basis points (must sum to 10000)

2. Deploy:
```bash
npx hardhat run scripts/deploy_launchpad.js --network cronosTestnet
```

3. Save the deployed contract address!

### Deploy to Mainnet

```bash
npx hardhat run scripts/deploy_launchpad.js --network cronos
```

## Owner Controls

Use `scripts/owner_controls.js` to manage your deployed contract:

1. Edit script and set `CONTRACT_ADDRESS`
2. Choose action (setSaleActive, setMintPrice, withdraw, etc.)
3. Run:
```bash
npx hardhat run scripts/owner_controls.js --network cronosTestnet
```

## Networks

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Cronos Testnet | 338 | https://evm-t3.cronos.org |
| Cronos Mainnet | 25 | https://evm.cronos.org |

## Contract Functions

### Public Functions
- `mintPublic(quantity)` - Mint NFTs during public sale
- `mintWhitelist(quantity, proof)` - Mint with whitelist proof

### Owner Functions
- `setSaleActive(bool)` - Toggle public sale
- `setWhitelistSaleActive(bool)` - Toggle whitelist sale
- `setMintPrice(uint256)` - Update price
- `setMaxPerWallet(uint256)` - Update wallet limit
- `setBaseURI(string)` - Set metadata URI
- `setWhitelistMerkleRoot(bytes32)` - Set whitelist root
- `withdraw()` - Withdraw and split funds
- `airdrop(recipients[], quantity)` - Free mint to addresses

## License

MIT
