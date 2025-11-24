// scripts/owner_controls.js
//
// Owner control scripts for LaunchpadCollection.
// Usage: npx hardhat run scripts/owner_controls.js --network <network>
//
// Before running, set the CONTRACT_ADDRESS and choose the action to perform.

const hre = require("hardhat");

// ========= CONFIGURATION =========

// Deployed contract address
const CONTRACT_ADDRESS = "0x97A26591f2263490BfADd0EeD6651CB50B1b6D20";

// Choose the action to perform (uncomment one):
// const ACTION = "setBaseURI";
// const ACTION = "setSaleActive";
// const ACTION = "setWhitelistSaleActive";
// const ACTION = "setMintPrice";
// const ACTION = "setMaxPerWallet";
// const ACTION = "setWhitelistMerkleRoot";
// const ACTION = "withdraw";
const ACTION = "getInfo";

// Action parameters (set based on your action):
const PARAMS = {
  // For setSaleActive / setWhitelistSaleActive
  active: true,

  // For setMintPrice (in CRO)
  newPrice: "1",

  // For setMaxPerWallet
  newMax: 3,

  // For setBaseURI
  baseURI: "https://metadata.liquidfi.app/hypervasion-4e4b03b4/json/",

  // For setWhitelistMerkleRoot
  merkleRoot: "0x0000000000000000000000000000000000000000000000000000000000000000",
};

// =================================

async function main() {
  const [owner] = await hre.ethers.getSigners();
  console.log("======================================");
  console.log("Owner Controls for LaunchpadCollection");
  console.log("Owner address:", owner.address);
  console.log("Contract address:", CONTRACT_ADDRESS);
  console.log("Network:", hre.network.name);
  console.log("Action:", ACTION);
  console.log("======================================\n");

  const collection = await hre.ethers.getContractAt("LaunchpadCollection", CONTRACT_ADDRESS);

  switch (ACTION) {
    case "setSaleActive":
      console.log(`Setting saleActive to ${PARAMS.active}...`);
      const tx1 = await collection.setSaleActive(PARAMS.active);
      await tx1.wait();
      console.log("Done! Sale is now:", PARAMS.active ? "ACTIVE" : "INACTIVE");
      break;

    case "setWhitelistSaleActive":
      console.log(`Setting whitelistSaleActive to ${PARAMS.active}...`);
      const tx2 = await collection.setWhitelistSaleActive(PARAMS.active);
      await tx2.wait();
      console.log("Done! Whitelist sale is now:", PARAMS.active ? "ACTIVE" : "INACTIVE");
      break;

    case "setMintPrice":
      const newPriceWei = hre.ethers.parseEther(PARAMS.newPrice);
      console.log(`Setting mint price to ${PARAMS.newPrice} CRO...`);
      const tx3 = await collection.setMintPrice(newPriceWei);
      await tx3.wait();
      console.log("Done! New mint price:", PARAMS.newPrice, "CRO");
      break;

    case "setMaxPerWallet":
      console.log(`Setting max per wallet to ${PARAMS.newMax}...`);
      const tx4 = await collection.setMaxPerWallet(PARAMS.newMax);
      await tx4.wait();
      console.log("Done! New max per wallet:", PARAMS.newMax);
      break;

    case "setBaseURI":
      console.log(`Setting base URI to ${PARAMS.baseURI}...`);
      const tx5 = await collection.setBaseURI(PARAMS.baseURI);
      await tx5.wait();
      console.log("Done! Base URI updated.");
      break;

    case "setWhitelistMerkleRoot":
      console.log(`Setting whitelist merkle root...`);
      const tx6 = await collection.setWhitelistMerkleRoot(PARAMS.merkleRoot);
      await tx6.wait();
      console.log("Done! Merkle root:", PARAMS.merkleRoot);
      break;

    case "withdraw":
      console.log("Withdrawing funds...");
      const contractBalance = await hre.ethers.provider.getBalance(CONTRACT_ADDRESS);
      console.log("Contract balance:", hre.ethers.formatEther(contractBalance), "CRO");
      const tx7 = await collection.withdraw();
      await tx7.wait();
      console.log("Done! Funds withdrawn and split to wallets.");
      break;

    case "getInfo":
      console.log("Fetching contract info...\n");
      const name = await collection.name();
      const symbol = await collection.symbol();
      const maxSupply = await collection.maxSupply();
      const totalSupply = await collection.totalSupply();
      const mintPrice = await collection.mintPrice();
      const maxPerWallet = await collection.maxPerWallet();
      const saleActive = await collection.saleActive();
      const whitelistSaleActive = await collection.whitelistSaleActive();
      const treasuryWallet = await collection.treasuryWallet();
      const platformWallet = await collection.platformWallet();
      const communityWallet = await collection.communityWallet();
      const treasuryBps = await collection.treasuryBasisPoints();
      const platformBps = await collection.platformBasisPoints();
      const communityBps = await collection.communityBasisPoints();
      const balance = await hre.ethers.provider.getBalance(CONTRACT_ADDRESS);

      console.log("Collection Name:", name);
      console.log("Symbol:", symbol);
      console.log("Max Supply:", maxSupply.toString());
      console.log("Total Minted:", totalSupply.toString());
      console.log("Mint Price:", hre.ethers.formatEther(mintPrice), "CRO");
      console.log("Max Per Wallet:", maxPerWallet.toString());
      console.log("Sale Active:", saleActive);
      console.log("Whitelist Sale Active:", whitelistSaleActive);
      console.log("Contract Balance:", hre.ethers.formatEther(balance), "CRO");
      console.log("\nRevenue Split:");
      console.log("  Treasury:", treasuryWallet, `(${Number(treasuryBps) / 100}%)`);
      console.log("  Platform:", platformWallet, `(${Number(platformBps) / 100}%)`);
      console.log("  Community:", communityWallet, `(${Number(communityBps) / 100}%)`);
      break;

    default:
      console.log("Unknown action:", ACTION);
  }

  console.log("\n======================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
