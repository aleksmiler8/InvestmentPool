import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import hre from "hardhat";
import { network } from "hardhat";
import { upgrades } from "@openzeppelin/hardhat-upgrades";

describe("InvestmentPoolV2 auto allocation integration", function () {
  let connection: any;
  let ethers: any;
  let upgradesApi: any;

  const USDT = 0;
  const USDC = 1;

  const VENUS = 3;
  const AAVE = 5;
  const DFORCE = 6;

  const DAY = 86400;

  before(async function () {
    connection = await network.create();
    ethers = connection.ethers;
    upgradesApi = await upgrades(hre, connection);
  });

  after(async function () {
    if (connection && typeof connection.close === "function") {
      await connection.close();
    }
  });

  async function deployFixture() {
    const [owner, user, reserve] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MockERC20");

    const usdt = await Token.deploy("Mock USDT", "USDT");
    const usdc = await Token.deploy("Mock USDC", "USDC");

    await usdt.waitForDeployment();
    await usdc.waitForDeployment();

    const Pool = await ethers.getContractFactory("InvestmentPoolV2");

    const pool = (await upgradesApi.deployProxy(
      Pool,
      [await usdt.getAddress(), await reserve.getAddress()],
      { kind: "transparent" }
    )) as any;

    await pool.waitForDeployment();

    const Adapter = await ethers.getContractFactory("MockProtocolAdapter");

    const usdtAave = await Adapter.deploy(await usdt.getAddress());
    const usdtDForce = await Adapter.deploy(await usdt.getAddress());

    const usdcAave = await Adapter.deploy(await usdc.getAddress());
    const usdcDForce = await Adapter.deploy(await usdc.getAddress());

    await Promise.all([
      usdtAave.waitForDeployment(),
      usdtDForce.waitForDeployment(),
      usdcAave.waitForDeployment(),
      usdcDForce.waitForDeployment(),
    ]);

    const VToken = await ethers.getContractFactory("MockVToken");

    const vToken = await VToken.deploy(await usdt.getAddress());
    await vToken.waitForDeployment();

    await pool.setUSDC(await usdc.getAddress());
    await pool.setVenusToken(await vToken.getAddress());

    await pool.setProtocolAdapter(AAVE, await usdtAave.getAddress());
    await pool.setProtocolAdapter(DFORCE, await usdtDForce.getAddress());

    await pool.setAssetAdapter(
      USDC,
      AAVE,
      await usdcAave.getAddress()
    );

    await pool.setAssetAdapter(
      USDC,
      DFORCE,
      await usdcDForce.getAddress()
    );

    await pool.setRewardRate(await pool.DAY(), 0);

    return {
      owner,
      user,
      reserve,
      pool,
      usdt,
      usdc,
      usdtAave,
      usdtDForce,
      usdcAave,
      usdcDForce,
      vToken,
    };
  }

  async function configureUSDT(pool: any) {
  await pool.setTargetAllocationForAsset(USDT, VENUS, 4000);
  await pool.setTargetAllocationForAsset(USDT, AAVE, 3000);
  await pool.setTargetAllocationForAsset(USDT, DFORCE, 3000);

  await pool.setAllocationProtocolsForAsset(
    USDT,
    [VENUS, AAVE, DFORCE]
  );

  await pool.setAutoAllocationEnabled(true);
  await pool.setAutoAllocationMinAmount(0);
}

async function configureUSDC(pool: any) {
  await pool.setTargetAllocationForAsset(USDC, AAVE, 5000);
  await pool.setTargetAllocationForAsset(USDC, DFORCE, 5000);

  await pool.setAllocationProtocolsForAsset(USDC, [AAVE, DFORCE]);

  await pool.setAutoAllocationEnabled(true);
  await pool.setAutoAllocationMinAmount(0);
}

  async function fundAndApprove(
    token: any,
    user: any,
    pool: any,
    amount: bigint
  ) {
    await token.mint(await user.getAddress(), amount);

    await token
      .connect(user)
      .approve(await pool.getAddress(), amount);
  }

  async function advanceOneDay(ethersInstance: any) {
    await ethersInstance.provider.send("evm_increaseTime", [DAY]);
    await ethersInstance.provider.send("evm_mine", []);
  }

  it("distributes USDT 40/30/30 and returns the deposit", async function () {
    const {
      user,
      pool,
      usdt,
      usdtAave,
      usdtDForce,
      vToken,
    } = await deployFixture();

    await configureUSDT(pool);

    const amount = ethers.parseEther("1000");

    await fundAndApprove(usdt, user, pool, amount);
    await pool.connect(user).deposit(amount, DAY);
    



    assert.equal(
      await vToken.balanceOf(await pool.getAddress()),
      ethers.parseEther("400"),
      "Venus should receive 400 USDT"
    );

    assert.equal(
      await usdtAave.totalAssets(),
      ethers.parseEther("300"),
      "Aave should receive 300 USDT"
    );
    assert.equal(
      await usdtDForce.totalAssets(),
      ethers.parseEther("300"),
      "dForce should receive 300 USDT"
    );

    assert.equal(
      await usdt.balanceOf(await pool.getAddress()),
      0n,
      "Pool should have no remaining USDT"
    );

    assert.equal(
      await pool.getInvestmentPositionCount(
        await user.getAddress(),
        0
      ),
      3n,
      "Investment should have three protocol positions"
    );

    await advanceOneDay(ethers);
    await pool.connect(user).withdraw(0);

    assert.equal(
      await usdt.balanceOf(await user.getAddress()),
      amount,
      "User should receive the full USDT deposit back"
    );

    assert.equal(
      await vToken.balanceOf(await pool.getAddress()),
      0n
    );

    assert.equal(await usdtAave.totalAssets(), 0n);
    assert.equal(await usdtDForce.totalAssets(), 0n);

    const investment = await pool.getInvestment(
      await user.getAddress(),
      0
    );

    assert.equal(investment.active, false);
    assert.equal(investment.finished, true);
  });

  it("distributes USDC 50/50 between Aave and dForce only", async function () {
    const {
      user,
      pool,
      usdc,
      usdcAave,
      usdcDForce,
      vToken,
    } = await deployFixture();

    await configureUSDC(pool);

    const amount = ethers.parseEther("1000");

    await fundAndApprove(usdc, user, pool, amount);

    await pool
      .connect(user)
      .depositAsset(amount, DAY, USDC);

    assert.equal(
      await usdcAave.totalAssets(),
      ethers.parseEther("500"),
      "Aave should receive 500 USDC"
    );

    assert.equal(
      await usdcDForce.totalAssets(),
      ethers.parseEther("500"),
      "dForce should receive 500 USDC"
    );

    assert.equal(
      await usdc.balanceOf(await pool.getAddress()),
      0n,
      "Pool should have no remaining USDC"
    );

    assert.equal(
      await vToken.balanceOf(await pool.getAddress()),
      0n,
      "USDC must not be allocated to Venus"
    );

    assert.equal(
      await pool.getInvestmentPositionCount(
        await user.getAddress(),
        0
      ),
      2n,
      "Investment should have two protocol positions"
    );

    await advanceOneDay(ethers);
    await pool.connect(user).withdraw(0);

    assert.equal(
      await usdc.balanceOf(await user.getAddress()),
      amount,
      "User should receive the full USDC deposit back"
    );

    assert.equal(await usdcAave.totalAssets(), 0n);
    assert.equal(await usdcDForce.totalAssets(), 0n);
  });

  it("keeps a failed allocation slice in the pool and still allows withdrawal", async function () {
    const {
      user,
      pool,
      usdt,
      usdtAave,
      usdtDForce,
      vToken,
    } = await deployFixture();

    await configureUSDT(pool);

    // Имитируем отказ Aave при внесении средств.
    await usdtAave.setFailDeposit(true);

    const amount = ethers.parseEther("1000");

    await fundAndApprove(usdt, user, pool, amount);
    await pool.connect(user).deposit(amount, DAY);

    // Venus и dForce должны получить свои доли.
    assert.equal(
      await vToken.balanceOf(await pool.getAddress()),
      ethers.parseEther("400"),
      "Venus should receive 400 USDT"
    );

    assert.equal(
      await usdtDForce.totalAssets(),
      ethers.parseEther("300"),
      "dForce should receive 300 USDT"
    );

    // Доля Aave должна остаться в Pool после неудачного внесения.
    assert.equal(
      await usdt.balanceOf(await pool.getAddress()),
      ethers.parseEther("300"),
      "Failed Aave allocation should remain in Pool"
    );

    assert.equal(
      await pool.getInvestmentPositionCount(
        await user.getAddress(),
        0
      ),
      2n,
      "Only successful protocol investments should create positions"
    );

    const investmentBefore = await pool.getInvestment(
      await user.getAddress(),
      0
    );

    assert.equal(investmentBefore.amount, amount);

    await advanceOneDay(ethers);
    await pool.connect(user).withdraw(0);

    assert.equal(
      await usdt.balanceOf(await user.getAddress()),
      amount,
      "User should receive the full deposit back"
    );

    assert.equal(
      await usdt.balanceOf(await pool.getAddress()),
      0n
    );

    assert.equal(await usdtDForce.totalAssets(), 0n);
    assert.equal(
      await vToken.balanceOf(await pool.getAddress()),
      0n
    );

    const investmentAfter = await pool.getInvestment(
      await user.getAddress(),
      0
    );

    assert.equal(investmentAfter.active, false);
    assert.equal(investmentAfter.finished, true);
  });

  it(
    "keeps a failed USDC allocation slice in the pool and still allows withdrawal",
    async function () {
      const { user, pool, usdc, usdcAave, usdcDForce } = await deployFixture();

      await configureUSDC(pool);
      await usdcDForce.setFailDeposit(true);

      const amount = ethers.parseEther("1000");
      await fundAndApprove(usdc, user, pool, amount);

      const tx = await pool.connect(user).depositAsset(amount, DAY, USDC);
      const receipt = await tx.wait();

      assert.equal(
        await usdcAave.totalAssets(),
        ethers.parseEther("500"),
        "Aave should keep its successful 50% allocation"
      );
      assert.equal(
        await usdcDForce.totalAssets(),
        0n,
        "The failing dForce adapter should not receive USDC"
      );
      assert.equal(
        await usdc.balanceOf(await pool.getAddress()),
        ethers.parseEther("500"),
        "The failed dForce slice should remain in the pool"
      );
      assert.equal(
        await pool.getInvestmentPositionCount(await user.getAddress(), 0),
        1n,
        "Only the successful Aave allocation should create a position"
      );

        const allocationFailedTopic = pool.interface.getEvent(
        "AllocationFailed"
      ).topicHash;
      assert.ok(
        receipt.logs.some((log: any) => log.topics[0] === allocationFailedTopic),
        "The failed allocation should be visible in transaction logs"
      );

      await advanceOneDay(ethers);
      await pool.connect(user).withdraw(0);

      assert.equal(
        await usdc.balanceOf(await user.getAddress()),
        amount,
        "The user should receive the full USDC deposit back"
      );
      assert.equal(await usdc.balanceOf(await pool.getAddress()), 0n);
      assert.equal(await usdcAave.totalAssets(), 0n);
      assert.equal(await usdcDForce.totalAssets(), 0n);
    }
  );
});
