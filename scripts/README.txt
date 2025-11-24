THIS FOLDER IS A TEMPLATE. 
→ Make a copy and rename it for each real project. 
→ Don’t build directly in this one.


CRO212HUB NFT Generator + Launchpad
- contracts/  = smart contracts (Solidity)
- scripts/    = deploy and helper scripts
- generator/  = NFT generator traits + outputs
- frontend/   = Launchpad mint website (UI)


CRO212 NFT Generator + Launchpad – V1

Overview:
This project is for a public NFT platform on Cronos where:
- Projects can mint NFT collections using a shared Launchpad contract template.
- Buyers pay mint price + gas.
- Revenue is split between the project, CRO212 platform, and (optionally) a community/LP wallet.

Folder structure:
- contracts/
  - LaunchpadCollection.sol   ← main ERC-721 mint contract (per collection)
- scripts/
  - (later) deploy scripts for LaunchpadCollection
- generator/
  - traits/    ← input art layers for the NFT generator
  - output/
    - images/   ← final NFT images
    - metadata/ ← metadata JSON files
    - reports/  ← rarity_report.csv, holder cheat sheets, etc.
- frontend/
  - src/       ← Launchpad mint website (UI) files go here later

Contract: LaunchpadCollection.sol
- Location: contracts/LaunchpadCollection.sol
- Purpose:
  - An ERC-721 contract for a single NFT collection (e.g. "Blood Oracles Genesis").
  - Supports:
    - Public mint (mintPublic)
    - Whitelist mint with Merkle proof (mintWhitelist)
    - Max supply and max mints per wallet
    - Airdrops
    - Revenue splitting on withdraw:
      - treasuryWallet (project)
      - platformWallet (CRO212)
      - optional communityWallet (LP/community)
- Key settings:
  - maxSupply (immutable)
  - mintPrice (in wei / CRO)
  - maxPerWallet
  - saleActive (public sale on/off)
  - whitelistSaleActive (WL sale on/off)
  - whitelistMerkleRoot (for WL wallets)
  - baseTokenURI (for metadata)

What a dev should do next:
1) Set up a standard Hardhat (or Foundry) project.
2) Install OpenZeppelin contracts (for ERC721Enumerable, Ownable, ReentrancyGuard, MerkleProof).
3) Place LaunchpadCollection.sol into the /contracts folder.
4) Compile the contracts.
5) Create a deploy script (e.g. scripts/deploy_launchpad.js) that:
   - Deploys LaunchpadCollection with the right constructor values:
     - name, symbol
     - maxSupply
     - mintPrice
     - maxPerWallet
     - treasuryWallet (project)
     - platformWallet (CRO212)
     - treasuryBasisPoints, platformBasisPoints, communityBasisPoints
     - communityWallet (if community bps > 0)
6) Deploy first to Cronos testnet, then to Cronos mainnet.
7) Connect the frontend mint page to:
   - mintPublic(quantity)
   - mintWhitelist(quantity, proof)
   - read totalSupply(), maxSupply, mintPrice, saleActive, etc.

Note:
Danny (project owner) does NOT handle code changes directly; this file + README are for a developer to plug into their normal EVM workflow.
