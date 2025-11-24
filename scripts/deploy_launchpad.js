// scripts/deploy_launchpad.js
//
// Deploy script for LaunchpadCollection on Cronos using Hardhat.
// Run: npx hardhat run scripts/deploy_launchpad.js --network <network>

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("======================================");
  console.log("Deploying LaunchpadCollection with:");
  console.log("Deployer address:", deployer.address);
  console.log("Network:", hre.network.name);
  console.log("======================================");

  // ========= DEPLOYMENT CONFIGURATION =========

  // Collection info
  const NAME = "TEST COLLECTION";
  const SYMBOL = "TEST";

  // Supply and minting settings
  const MAX_SUPPLY = 100;
  const MINT_PRICE_WEI = hre.ethers.parseEther("1"); // 1 CRO
  const MAX_PER_WALLET = 3;

  // Wallets (must be valid EVM addresses)
  const TREASURY_WALLET = "0xda539ce323cfdbe92937197d3364d288bf0ae5a7";
  const PLATFORM_WALLET = "0xda539ce323cfdbe92937197d3364d288bf0ae5a7";
  const COMMUNITY_WALLET = "0x0000000000000000000000000000000000000000";

  // Basis points for revenue split (must sum to 10000)
  const TREASURY_BPS = 9500;   // 95%
  const PLATFORM_BPS = 500;    // 5%
  const COMMUNITY_BPS = 0;     // 0%

  // ===========================================

  // Sanity check
  if (TREASURY_BPS + PLATFORM_BPS + COMMUNITY_BPS !== 10000) {
    throw new Error("Basis points must sum to 10000");
  }

  const LaunchpadCollection = await hre.ethers.getContractFactory("LaunchpadCollection");

  console.log("Deploying LaunchpadCollection...");
  const collection = await LaunchpadCollection.deploy(
    NAME,
    SYMBOL,
    MAX_SUPPLY,
    MINT_PRICE_WEI,
    MAX_PER_WALLET,
    TREASURY_WALLET,
    PLATFORM_WALLET,
    TREASURY_BPS,
    PLATFORM_BPS,
    COMMUNITY_WALLET,
    COMMUNITY_BPS
  );

  await collection.waitForDeployment();

  const deployedAddress = await collection.getAddress();
  console.log("======================================");
  console.log("LaunchpadCollection deployed!");
  console.log("Contract address:", deployedAddress);
  console.log("======================================");

  // Verify contract on Cronoscan (if not on localhost)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30s

    console.log("Verifying contract on Cronoscan...");
    try {
      await hre.run("verify:verify", {
        address: deployedAddress,
        constructorArguments: [
          NAME,
          SYMBOL,
          MAX_SUPPLY,
          MINT_PRICE_WEI,
          MAX_PER_WALLET,
          TREASURY_WALLET,
          PLATFORM_WALLET,
          TREASURY_BPS,
          PLATFORM_BPS,
          COMMUNITY_WALLET,
          COMMUNITY_BPS,
        ],
      });
      console.log("Contract verified!");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  });
