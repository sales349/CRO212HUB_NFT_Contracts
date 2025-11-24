// scripts/verify_metadata.js
// Quick script to verify tokenURI is correctly set

const hre = require("hardhat");

const CONTRACT_ADDRESS = "0x97A26591f2263490BfADd0EeD6651CB50B1b6D20";

async function main() {
  console.log("======================================");
  console.log("Verifying Token Metadata URIs");
  console.log("======================================\n");

  const collection = await hre.ethers.getContractAt("LaunchpadCollection", CONTRACT_ADDRESS);

  const totalSupply = await collection.totalSupply();
  console.log(`Total Minted: ${totalSupply}\n`);

  // Check first few token URIs
  const tokensToCheck = Math.min(Number(totalSupply), 5);

  for (let i = 1; i <= tokensToCheck; i++) {
    try {
      const tokenURI = await collection.tokenURI(i);
      console.log(`Token #${i}: ${tokenURI}`);
    } catch (error) {
      console.log(`Token #${i}: Error - ${error.message}`);
    }
  }

  console.log("\n======================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
