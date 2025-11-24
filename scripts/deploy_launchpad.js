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

  // ========= TODO: FILL THESE VALUES =========

  // Collection info
  const NAME = "YOUR_COLLECTION_NAME";        // e.g. "Blood Oracles Genesis"
  const SYMBOL = "YOUR_SYMBOL";               // e.g. "ORACLE"

  // Supply and minting settings
  const MAX_SUPPLY = 3500;                    // e.g. 3500
  const MINT_PRICE_WEI = hre.ethers.parseEther("30"); // e.g. 30 CRO
  const MAX_PER_WALLET = 5;                   // per wallet cap

  // Wallets (must be valid EVM addresses)
  const TREASURY_WALLET = "0xYourProjectTreasuryWalletHere";
  const PLATFORM_WALLET = "0xYourCRO212PlatformWalletHere";
  const COMMUNITY_WALLET = "0x0000000000000000000000000000000000000000"; // or a real address

  // Basis points for revenue split (must sum to 10000)
  const TREASURY_BPS = 9000;   // 90%
  const PLATFORM_BPS = 1000;   // 10%
  const COMMUNITY_BPS = 0;     // 0% for now

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
