
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import hre from "hardhat";
import { network } from "hardhat";
import { upgrades } from "@openzeppelin/hardhat-upgrades";

describe("InvestmentPoolV2 auto allocation", async function () {
  const connection = await network.create();
  const { ethers } = connection;
  const upgradesApi = await upgrades(hre, connection);

  const USDT = 0;
  const USDC = 1;

  const VENUS = 3;
  const AAVE = 5;
  const DFORCE = 6;

  async function deployPool() {
    const signers = await ethers.getSigners();

    const Pool = await ethers.getContractFactory(
      "InvestmentPoolV2"
    );

    const pool = await upgradesApi.deployProxy(
      Pool,
      [
        await signers[1].getAddress(),
        await signers[2].getAddress(),
      ],
      { kind: "transparent" }
    );

    await pool.waitForDeployment();

    return pool;
  }

  it("starts with auto allocation disabled", async function () {
    const pool = await deployPool();

    assert.equal(
      await pool.autoAllocationEnabled(),
      false
    );
  });

  it("accepts 40/30/30 allocation for USDT", async function () {
    const pool = await deployPool();

    await pool.setTargetAllocationForAsset(USDT, VENUS, 4000);
    await pool.setTargetAllocationForAsset(USDT, AAVE, 3000);
    await pool.setTargetAllocationForAsset(USDT, DFORCE, 3000);

    await pool.setAllocationProtocolsForAsset(
      USDT,
      [VENUS, AAVE, DFORCE]
    );

    assert.equal(
      await pool.targetAllocationBpsByAsset(USDT, VENUS),
      4000n
    );
    assert.equal(
      await pool.targetAllocationBpsByAsset(USDT, AAVE),
      3000n
    );
    assert.equal(
      await pool.targetAllocationBpsByAsset(USDT, DFORCE),
      3000n
    );

    assert.equal(
      Number(await pool.allocationProtocolsByAsset(USDT, 0)),
      VENUS
    );
    assert.equal(
      Number(await pool.allocationProtocolsByAsset(USDT, 1)),
      AAVE
    );
    assert.equal(
      Number(await pool.allocationProtocolsByAsset(USDT, 2)),
      DFORCE
    );
  });

  it("accepts only Aave and dForce for USDC", async function () {
    const pool = await deployPool();

    await pool.setTargetAllocationForAsset(USDC, AAVE, 5000);
    await pool.setTargetAllocationForAsset(USDC, DFORCE, 5000);

    await pool.setAllocationProtocolsForAsset(
      USDC,
      [AAVE, DFORCE]
    );

    assert.equal(
      await pool.targetAllocationBpsByAsset(USDC, AAVE),
      5000n
    );
    assert.equal(
      await pool.targetAllocationBpsByAsset(USDC, DFORCE),
      5000n
    );

    assert.equal(
      Number(await pool.allocationProtocolsByAsset(USDC, 0)),
      AAVE
    );
    assert.equal(
      Number(await pool.allocationProtocolsByAsset(USDC, 1)),
      DFORCE
    );
  });

  it("rejects Venus as a USDC target", async function () {
    const pool = await deployPool();

    await assert.rejects(
      pool.setTargetAllocationForAsset(USDC, VENUS, 1000)
    );
  });

  it("rejects Venus in the USDC protocol list", async function () {
    const pool = await deployPool();

    await assert.rejects(
      pool.setAllocationProtocolsForAsset(
        USDC,
        [AAVE, VENUS, DFORCE]
      )
    );
  });

  it("rejects duplicate protocols", async function () {
    const pool = await deployPool();

    await assert.rejects(
      pool.setAllocationProtocolsForAsset(
        USDT,
        [AAVE, AAVE]
      )
    );
  });

  it("rejects a total allocation greater than 100%", async function () {
    const pool = await deployPool();

    await pool.setTargetAllocationForAsset(USDT, AAVE, 6000);
    await pool.setTargetAllocationForAsset(USDT, DFORCE, 5000);

    await assert.rejects(
      pool.setAllocationProtocolsForAsset(
        USDT,
        [AAVE, DFORCE]
      )
    );
  });

  it("keeps USDT and USDC settings independent", async function () {
    const pool = await deployPool();

    await pool.setTargetAllocationForAsset(USDT, VENUS, 4000);
    await pool.setTargetAllocationForAsset(USDC, AAVE, 5000);

    assert.equal(
      await pool.targetAllocationBpsByAsset(USDT, VENUS),
      4000n
    );
    assert.equal(
      await pool.targetAllocationBpsByAsset(USDC, VENUS),
      0n
    );
    assert.equal(
      await pool.targetAllocationBpsByAsset(USDC, AAVE),
      5000n
    );
  });
});
