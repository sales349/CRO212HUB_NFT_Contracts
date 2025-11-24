const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("LaunchpadCollection", function () {
  // Test configuration
  const NAME = "Test Collection";
  const SYMBOL = "TEST";
  const MAX_SUPPLY = 100;
  const MINT_PRICE = ethers.parseEther("10"); // 10 CRO
  const MAX_PER_WALLET = 5;
  const TREASURY_BPS = 9000; // 90%
  const PLATFORM_BPS = 1000; // 10%
  const COMMUNITY_BPS = 0;

  async function deployFixture() {
    const [owner, treasury, platform, community, user1, user2] = await ethers.getSigners();

    const LaunchpadCollection = await ethers.getContractFactory("LaunchpadCollection");
    const collection = await LaunchpadCollection.deploy(
      NAME,
      SYMBOL,
      MAX_SUPPLY,
      MINT_PRICE,
      MAX_PER_WALLET,
      treasury.address,
      platform.address,
      TREASURY_BPS,
      PLATFORM_BPS,
      community.address,
      COMMUNITY_BPS
    );

    return { collection, owner, treasury, platform, community, user1, user2 };
  }

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const { collection } = await loadFixture(deployFixture);
      expect(await collection.name()).to.equal(NAME);
      expect(await collection.symbol()).to.equal(SYMBOL);
    });

    it("Should set the correct maxSupply", async function () {
      const { collection } = await loadFixture(deployFixture);
      expect(await collection.maxSupply()).to.equal(MAX_SUPPLY);
    });

    it("Should set the correct mintPrice", async function () {
      const { collection } = await loadFixture(deployFixture);
      expect(await collection.mintPrice()).to.equal(MINT_PRICE);
    });

    it("Should set the correct maxPerWallet", async function () {
      const { collection } = await loadFixture(deployFixture);
      expect(await collection.maxPerWallet()).to.equal(MAX_PER_WALLET);
    });

    it("Should set saleActive to false by default", async function () {
      const { collection } = await loadFixture(deployFixture);
      expect(await collection.saleActive()).to.equal(false);
    });

    it("Should set whitelistSaleActive to false by default", async function () {
      const { collection } = await loadFixture(deployFixture);
      expect(await collection.whitelistSaleActive()).to.equal(false);
    });

    it("Should set correct basis points", async function () {
      const { collection } = await loadFixture(deployFixture);
      expect(await collection.treasuryBasisPoints()).to.equal(TREASURY_BPS);
      expect(await collection.platformBasisPoints()).to.equal(PLATFORM_BPS);
      expect(await collection.communityBasisPoints()).to.equal(COMMUNITY_BPS);
    });
  });

  describe("Public Mint", function () {
    it("Should fail if sale is not active", async function () {
      const { collection, user1 } = await loadFixture(deployFixture);
      await expect(
        collection.connect(user1).mintPublic(1, { value: MINT_PRICE })
      ).to.be.revertedWith("Public sale is not active");
    });

    it("Should mint successfully when sale is active", async function () {
      const { collection, owner, user1 } = await loadFixture(deployFixture);
      await collection.connect(owner).setSaleActive(true);

      await collection.connect(user1).mintPublic(1, { value: MINT_PRICE });

      expect(await collection.totalSupply()).to.equal(1);
      expect(await collection.balanceOf(user1.address)).to.equal(1);
      expect(await collection.mintsByWallet(user1.address)).to.equal(1);
    });

    it("Should fail with incorrect payment amount", async function () {
      const { collection, owner, user1 } = await loadFixture(deployFixture);
      await collection.connect(owner).setSaleActive(true);

      await expect(
        collection.connect(user1).mintPublic(1, { value: ethers.parseEther("5") })
      ).to.be.revertedWith("Incorrect CRO amount sent");
    });

    it("Should fail when exceeding wallet limit", async function () {
      const { collection, owner, user1 } = await loadFixture(deployFixture);
      await collection.connect(owner).setSaleActive(true);

      await expect(
        collection.connect(user1).mintPublic(6, { value: MINT_PRICE * BigInt(6) })
      ).to.be.revertedWith("Exceeds wallet limit");
    });

    it("Should mint multiple NFTs correctly", async function () {
      const { collection, owner, user1 } = await loadFixture(deployFixture);
      await collection.connect(owner).setSaleActive(true);

      await collection.connect(user1).mintPublic(3, { value: MINT_PRICE * BigInt(3) });

      expect(await collection.totalSupply()).to.equal(3);
      expect(await collection.balanceOf(user1.address)).to.equal(3);
      expect(await collection.mintsByWallet(user1.address)).to.equal(3);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to set sale active", async function () {
      const { collection, owner } = await loadFixture(deployFixture);
      await collection.connect(owner).setSaleActive(true);
      expect(await collection.saleActive()).to.equal(true);
    });

    it("Should allow owner to set mint price", async function () {
      const { collection, owner } = await loadFixture(deployFixture);
      const newPrice = ethers.parseEther("20");
      await collection.connect(owner).setMintPrice(newPrice);
      expect(await collection.mintPrice()).to.equal(newPrice);
    });

    it("Should allow owner to set max per wallet", async function () {
      const { collection, owner } = await loadFixture(deployFixture);
      await collection.connect(owner).setMaxPerWallet(10);
      expect(await collection.maxPerWallet()).to.equal(10);
    });

    it("Should allow owner to set base URI", async function () {
      const { collection, owner, user1 } = await loadFixture(deployFixture);
      await collection.connect(owner).setSaleActive(true);
      await collection.connect(user1).mintPublic(1, { value: MINT_PRICE });

      await collection.connect(owner).setBaseURI("ipfs://QmTest/");
      expect(await collection.tokenURI(1)).to.equal("ipfs://QmTest/1");
    });

    it("Should not allow non-owner to set sale active", async function () {
      const { collection, user1 } = await loadFixture(deployFixture);
      await expect(
        collection.connect(user1).setSaleActive(true)
      ).to.be.revertedWithCustomError(collection, "OwnableUnauthorizedAccount");
    });
  });

  describe("Withdraw", function () {
    it("Should split funds correctly on withdraw", async function () {
      const { collection, owner, treasury, platform, user1 } = await loadFixture(deployFixture);
      await collection.connect(owner).setSaleActive(true);

      // Mint 5 NFTs (50 CRO total)
      const mintValue = MINT_PRICE * BigInt(5);
      await collection.connect(user1).mintPublic(5, { value: mintValue });

      const treasuryBalanceBefore = await ethers.provider.getBalance(treasury.address);
      const platformBalanceBefore = await ethers.provider.getBalance(platform.address);

      await collection.connect(owner).withdraw();

      const treasuryBalanceAfter = await ethers.provider.getBalance(treasury.address);
      const platformBalanceAfter = await ethers.provider.getBalance(platform.address);

      // Treasury should receive 90% (45 CRO)
      const expectedTreasury = (mintValue * BigInt(TREASURY_BPS)) / BigInt(10000);
      // Platform should receive 10% (5 CRO)
      const expectedPlatform = (mintValue * BigInt(PLATFORM_BPS)) / BigInt(10000);

      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(expectedTreasury);
      expect(platformBalanceAfter - platformBalanceBefore).to.equal(expectedPlatform);
    });

    it("Should fail withdraw with no funds", async function () {
      const { collection, owner } = await loadFixture(deployFixture);
      await expect(collection.connect(owner).withdraw()).to.be.revertedWith("No funds to withdraw");
    });
  });

  describe("Airdrop", function () {
    it("Should airdrop NFTs to recipients", async function () {
      const { collection, owner, user1, user2 } = await loadFixture(deployFixture);

      await collection.connect(owner).airdrop([user1.address, user2.address], 2);

      expect(await collection.totalSupply()).to.equal(4);
      expect(await collection.balanceOf(user1.address)).to.equal(2);
      expect(await collection.balanceOf(user2.address)).to.equal(2);
    });

    it("Should fail airdrop from non-owner", async function () {
      const { collection, user1, user2 } = await loadFixture(deployFixture);
      await expect(
        collection.connect(user1).airdrop([user2.address], 1)
      ).to.be.revertedWithCustomError(collection, "OwnableUnauthorizedAccount");
    });
  });
});
