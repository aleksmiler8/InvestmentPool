// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "./ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IProtocolAdapter {
    function deposit(uint256 amount) external;

    function withdraw(uint256 amount) external returns (uint256);

    function totalAssets() external view returns (uint256);
}

interface IVToken {
    function mint(uint256 mintAmount) external returns (uint256);

    function redeemUnderlying(uint256 redeemAmount) external returns (uint256);

    function balanceOfUnderlying(address owner) external returns (uint256);

    function balanceOf(address owner) external view returns (uint256);

    function exchangeRateStored() external view returns (uint256);
}

contract InvestmentPoolV2 is
    Initializable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20 for IERC20;
        /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // ============================================================
    // CONSTANTS
    // ============================================================

    uint256 public constant DAY = 1 days;
    uint256 public constant WEEK = 7 days;
    uint256 public constant MONTH = 30 days;
    uint256 public constant THREE_MONTHS = 90 days;
    uint256 public constant SIX_MONTHS = 180 days;
    uint256 public constant YEAR = 365 days;

    uint256 public constant MAX_REWARD_BPS = 2000; // 20% РјР°РєСЃРёРјСѓРј
    uint256 public constant BPS_DENOMINATOR = 10000;

    // ============================================================
    // ENUMS
    // ============================================================

    enum Protocol {
        Pool,
        Reserve,
        Beefy,
        Venus,
        Pancake,
        Aave,
        DForce
    }

    enum Asset {
        USDT,
        USDC
    }

    // ============================================================
    // STRUCTS
    // ============================================================

    struct Position {
        Protocol protocol;
        uint256 shares;
        uint256 principal;
        bool active;
    }

    struct Investment {
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
        uint256 period;
        uint256 reward;
        uint256 allocatedAmount;
        bool active;
        bool finished;
        Position[] positions;
    }

    struct PendingReserveFee {
        uint256 amount;
        uint256 unlockTime;
        bool transferred;
        Position[] positions;
    }

    struct Investor {
        bool exists;
        uint256 totalInvested;
        uint256 totalWithdrawn;
        uint256 totalReward;
        Investment[] investments;
    }


    // ============================================================
    // STORAGE вЂ” CORE AND ADAPTERS
    // РџРѕСЂСЏРґРѕРє СЃСѓС‰РµСЃС‚РІСѓСЋС‰РёС… РїРµСЂРµРјРµРЅРЅС‹С… РґРѕР»Р¶РµРЅ СЃРѕС…СЂР°РЅСЏС‚СЊСЃСЏ
    // ============================================================

    IERC20 public usdt;

    address public constant VUSDT =
        0xfD5840Cd36d94D7229439859C0112a4185BC0255;
    address public venusToken;
    address public reserveWallet;

    IProtocolAdapter public beefyAdapter;
    IProtocolAdapter public venusAdapter;
    IProtocolAdapter public pancakeAdapter;
    IProtocolAdapter public aaveAdapter;
    IProtocolAdapter public dforceAdapter;

    uint256 public totalDeposits;
    uint256 public totalInvestors;

    mapping(Protocol => uint256) public protocolBalance;
    mapping(Protocol => uint256) public totalProtocolShares;

    uint256 public totalPendingRewards;
    uint256 public totalActiveDeposits;

    mapping(address => Investor) private investors;
    PendingReserveFee[] public pendingReserveFees;
    mapping(uint256 => uint256) public rewardRate;
    uint256 public earlyWithdrawFee;
    uint256 public minimumInvestment;

    // РЎСѓС‰РµСЃС‚РІСѓСЋС‰РёРµ РїРѕР»СЏ РјСѓР»СЊС‚РёР°РєС‚РёРІРЅРѕРіРѕ СѓС‡С‘С‚Р° вЂ” СЃС‚СЂРѕРіРѕ РїРѕСЃР»Рµ slot 19
    IERC20 public usdc;
    mapping(address => mapping(uint256 => Asset)) private investmentAsset;

    mapping(Asset => uint256) public totalDepositsByAsset;
    mapping(Asset => uint256) public totalActiveDepositsByAsset;

    mapping(Asset => mapping(Protocol => uint256))
        public protocolBalanceByAsset;

    mapping(Asset => mapping(Protocol => uint256))
        public totalProtocolSharesByAsset;

    mapping(Asset => mapping(Protocol => IProtocolAdapter))
        public assetAdapters;

    mapping(uint256 => Asset) private pendingReserveFeeAsset;

    // РќРѕРІС‹Рµ РїРѕР»СЏ Р°РІС‚РѕСЂР°СЃРїСЂРµРґРµР»РµРЅРёСЏ
    mapping(Protocol => uint256) public targetAllocationBps;
    bool public autoAllocationEnabled;
    uint256 public autoAllocationMinAmount;
    Protocol[] public allocationProtocols;

    // РќРѕРІС‹Р№ РїРѕСЂСЏРґРѕРє РІС‹РІРѕРґР°
    Protocol[] public withdrawOrder;

    // РќРѕРІС‹Рµ РЅР°СЃС‚СЂРѕР№РєРё Р°РІС‚РѕР°Р»Р»РѕРєР°С‚РѕСЂР° РѕС‚РґРµР»СЊРЅРѕ РґР»СЏ РєР°Р¶РґРѕРіРѕ Р°РєС‚РёРІР°.
// Р”РѕР±Р°РІР»РµРЅС‹ РІ Р·Р°СЂРµР·РµСЂРІРёСЂРѕРІР°РЅРЅСѓСЋ РѕР±Р»Р°СЃС‚СЊ storage.
mapping(Asset => mapping(Protocol => uint256))
    public targetAllocationBpsByAsset;

mapping(Asset => Protocol[]) public allocationProtocolsByAsset;

    function _vUSDT() internal view returns (IVToken) {
        return IVToken(venusToken);
    }

    // ============================================================
    // EVENTS
    // ============================================================

    event Deposited(
        address indexed user,
        uint256 indexed investmentId,
        uint256 amount,
        uint256 period
    );

    event Withdrawn(
        address indexed user,
        uint256 indexed investmentId,
        uint256 amount,
        uint256 reward
    );

    event EarlyWithdraw(
        address indexed user,
        uint256 indexed investmentId,
        uint256 amount
    );

    event AllocationFailed(
    Protocol indexed protocol,
    uint256 amount,
    string reason
);

    event RewardRateChanged(uint256 period, uint256 reward);

    event EmergencyPaused();
    event EmergencyUnpaused();

    event FeesWithdrawn(address indexed owner, uint256 amount);

    event ReserveFeeLocked(
        address indexed user,
        uint256 indexed investmentId,
        uint256 indexed feeId,
        uint256 amount,
        uint256 unlockTime
    );

    event LiquidityInvested(Protocol indexed protocol, uint256 amount);
    event ProfitHarvested(Protocol indexed protocol, uint256 amount);
    event AutoAllocationConfiguredForAsset(
    Asset indexed asset,
    Protocol indexed protocol,
    uint256 bps
);
    event AutoAllocationToggled(bool enabled);
    event AutoAllocated(Protocol indexed protocol, uint256 amount);

    // ============================================================
    // MODIFIERS
    // ============================================================

    modifier validPeriod(uint256 period) {
        require(
            period == DAY ||
                period == WEEK ||
                period == MONTH ||
                period == THREE_MONTHS ||
                period == SIX_MONTHS ||
                period == YEAR,
            "Invalid period"
        );
        _;
    }

    // ============================================================
    // INITIALIZER
    // ============================================================

    function initialize(
        address usdtAddress,
        address reserveAddress
    ) external initializer {
        require(usdtAddress != address(0), "Invalid USDT");
        require(reserveAddress != address(0), "Invalid reserve");

        __Ownable_init(msg.sender);
        __Pausable_init();
        __ReentrancyGuard_init();

        usdt = IERC20(usdtAddress);
        reserveWallet = reserveAddress;

        rewardRate[DAY] = 1;
        rewardRate[WEEK] = 10;
        rewardRate[MONTH] = 50;
        rewardRate[THREE_MONTHS] = 150;
        rewardRate[SIX_MONTHS] = 400;
        rewardRate[YEAR] = 800;

        earlyWithdrawFee = 1500;
        minimumInvestment = 25e18;

        // autoAllocationEnabled РѕСЃС‚Р°С‘С‚СЃСЏ false РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ
        // venusToken РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ СѓСЃС‚Р°РЅРѕРІР»РµРЅ С‡РµСЂРµР· setVenusToken
        // Р”Рћ РїРµСЂРІРѕРіРѕ РґРµРїРѕР·РёС‚Р° РІ Venus
    }

    // ============================================================
    // DEPOSIT
    // ============================================================

    function deposit(
        uint256 amount,
        uint256 period
    ) external whenNotPaused nonReentrant validPeriod(period) {
        _depositAsset(amount, period, Asset.USDT);
    }

    function depositAsset(
        uint256 amount,
        uint256 period,
        Asset asset
    ) external whenNotPaused nonReentrant validPeriod(period) {
        _depositAsset(amount, period, asset);
    }

    function _depositAsset(
        uint256 amount,
        uint256 period,
        Asset asset
    ) internal {
        require(amount > 0, "Amount must be greater than zero");

        IERC20 assetToken;

        if (asset == Asset.USDT) {
            assetToken = usdt;
        } else {
            require(address(usdc) != address(0), "USDC not set");
            assetToken = usdc;
        }

        require(address(assetToken) != address(0), "Asset token not set");

        if (msg.sender != owner()) {
            uint256 minimumForAsset;

            if (asset == Asset.USDT) {
                minimumForAsset = minimumInvestment;
            } else {
                // USDC on BNB Smart Chain uses 18 decimals.
                minimumForAsset = 25e18;
            }

            require(amount >= minimumForAsset, "Minimum investment is 25");
        }

        Investor storage investor = investors[msg.sender];

        /*
         * РћРґРёРЅ Р°РєС‚РёРІ + РѕРґРёРЅ РїРµСЂРёРѕРґ = РѕРґРЅР° Р°РєС‚РёРІРЅР°СЏ РёРЅРІРµСЃС‚РёС†РёСЏ.
         * USDT Рё USDC РґСЂСѓРі РґСЂСѓРіСѓ РЅРµ РјРµС€Р°СЋС‚.
         */
        if (msg.sender != owner()) {
            for (uint256 i = 0; i < investor.investments.length; i++) {
                Investment storage inv = investor.investments[i];

                if (
                    inv.active &&
                    inv.period == period &&
                    investmentAsset[msg.sender][i] == asset
                ) {
                    revert("Active deposit for this period already exists");
                }
            }
        }

        assetToken.safeTransferFrom(msg.sender, address(this), amount);

        if (!investor.exists) {
            investor.exists = true;
            totalInvestors++;
        }

        uint256 reward = (amount * rewardRate[period]) / BPS_DENOMINATOR;
        totalPendingRewards += reward;

        uint256 investmentId = investor.investments.length;

        investor.investments.push(
            Investment({
                amount: amount,
                startTime: block.timestamp,
                endTime: block.timestamp + period,
                period: period,
                reward: reward,
                allocatedAmount: 0,
                active: true,
                finished: false,
                positions: new Position[](0)
            })
        );

        investmentAsset[msg.sender][investmentId] = asset;

        investor.totalInvested += amount;

        /*
         * РќРѕРІР°СЏ multi-asset Р±СѓС…РіР°Р»С‚РµСЂРёСЏ.
         */
        totalDepositsByAsset[asset] += amount;
        totalActiveDepositsByAsset[asset] += amount;
        protocolBalanceByAsset[asset][Protocol.Pool] += amount;

        /*
         * РЎС‚Р°СЂС‹Рµ РіР»РѕР±Р°Р»СЊРЅС‹Рµ СЃС‡С‘С‚С‡РёРєРё (legacy USDT).
         *
         * Р’РђР–РќРћ: РѕР±РЅРѕРІР»СЏСЋС‚СЃСЏ Р”Рћ _autoAllocate, РїРѕС‚РѕРјСѓ С‡С‚Рѕ
         * _autoAllocate СѓРјРµРЅСЊС€РёС‚ protocolBalanceByAsset[Pool],
         * Рё СЃС‚Р°СЂР°СЏ РїРµСЂРµРјРµРЅРЅР°СЏ protocolBalance[Pool] РґРѕР»Р¶РЅР°
         * Р±С‹С‚СЊ СѓР¶Рµ СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅР°.
         */
        if (asset == Asset.USDT) {
            totalDeposits += amount;
            totalActiveDeposits += amount;
            protocolBalance[Protocol.Pool] += amount;
        }

        /*
         * РђР’РўРћ-Р РђРЎРџР Р•Р”Р•Р›Р•РќРР•.
         * РЎСЂРµРґСЃС‚РІР° СѓР¶Рµ РІ Pool. РџС‹С‚Р°РµРјСЃСЏ СЂР°Р·Р»РѕР¶РёС‚СЊ
         * РїРѕ targetAllocationBps.
         */
        _autoAllocate(msg.sender, investmentId, asset, amount);

        emit Deposited(msg.sender, investmentId, amount, period);
    }

    // ============================================================
    // PROTOCOL ADAPTERS
    // ============================================================

    function setProtocolAdapter(
        Protocol protocol,
        address adapter
    ) external onlyOwner {
        require(adapter != address(0), "Invalid adapter");

        if (protocol == Protocol.Beefy) {
            beefyAdapter = IProtocolAdapter(adapter);
        } else if (protocol == Protocol.Venus) {
            venusAdapter = IProtocolAdapter(adapter);
        } else if (protocol == Protocol.Pancake) {
            pancakeAdapter = IProtocolAdapter(adapter);
        } else if (protocol == Protocol.Aave) {
            aaveAdapter = IProtocolAdapter(adapter);
        } else if (protocol == Protocol.DForce) {
            dforceAdapter = IProtocolAdapter(adapter);
        } else {
            revert("Invalid adapter protocol");
        }
    }

    function _adapterFor(
        Protocol protocol
    ) internal view returns (IProtocolAdapter adapter) {
        if (protocol == Protocol.Aave) return aaveAdapter;
        if (protocol == Protocol.DForce) return dforceAdapter;
        if (protocol == Protocol.Beefy) return beefyAdapter;
        if (protocol == Protocol.Pancake) return pancakeAdapter;

        revert("Unsupported protocol");
    }


function _protocolAssets(
    Protocol protocol,
    Asset asset
) internal view returns (uint256) {
    IProtocolAdapter adapter;

    if (protocol == Protocol.Venus) {
        if (asset == Asset.USDC) {
            adapter = assetAdapters[Asset.USDC][Protocol.Venus];

            if (address(adapter) == address(0)) return 0;

            try adapter.totalAssets() returns (uint256 assets) {
                return assets;
            } catch {
                return 0;
            }
        }

        uint256 shares = _vUSDT().balanceOf(address(this));
        if (shares == 0) return 0;

        uint256 exchangeRate = _vUSDT().exchangeRateStored();
        return (shares * exchangeRate) / 1e18;
    }

    if (asset == Asset.USDC) {
        adapter = assetAdapters[Asset.USDC][protocol];
    } else {
        adapter = _adapterFor(protocol);
    }

    if (address(adapter) == address(0)) return 0;

    try adapter.totalAssets() returns (uint256 assets) {
        return assets;
    } catch {
        return 0;
    }
}

    function _addPosition(
        Investment storage inv,
        Protocol protocol,
        uint256 amount,
        uint256 assetsBefore,
        Asset asset
    ) internal {
        uint256 supply = totalProtocolSharesByAsset[asset][protocol];

        uint256 shares = (supply == 0 || assetsBefore == 0)
            ? amount
            : (amount * supply) / assetsBefore;

        require(shares > 0, "Zero shares");

        inv.positions.push(
            Position({
                protocol: protocol,
                shares: shares,
                principal: amount,
                active: true
            })
        );

        totalProtocolSharesByAsset[asset][protocol] += shares;
        inv.allocatedAmount += amount;

        protocolBalanceByAsset[asset][Protocol.Pool] -= amount;
        protocolBalanceByAsset[asset][protocol] += amount;
    }

    // ============================================================
    // INVEST INTO PROTOCOL (OWNER + INTERNAL)
    // ============================================================

    function investIntoProtocol(
        address user,
        uint256 investmentId,
        Protocol protocol,
        uint256 amount
    ) external onlyOwner nonReentrant {
        _investIntoProtocolInternal(user, investmentId, protocol, amount);
    }

    function _investIntoProtocolInternal(
        address user,
        uint256 investmentId,
        Protocol protocol,
        uint256 amount
    ) internal {
        require(user != address(0), "Invalid user");
        require(
            investmentId < investors[user].investments.length,
            "Invalid investment"
        );
        require(amount > 0, "Invalid amount");
        require(
            protocol != Protocol.Pool && protocol != Protocol.Reserve,
            "Invalid protocol"
        );

        Investment storage inv = investors[user].investments[investmentId];
        Asset asset = investmentAsset[user][investmentId];

        require(inv.active && !inv.finished, "Investment inactive");
        require(
            inv.allocatedAmount + amount <= inv.amount,
            "Amount exceeds investment"
        );

        uint256 assetsBefore = _protocolAssets(protocol, asset);
        IERC20 assetToken = asset == Asset.USDC ? usdc : usdt;
        require(address(assetToken) != address(0), "Asset token not set");


        if (protocol == Protocol.Venus) {
    if (asset == Asset.USDC) {
        IProtocolAdapter venusUsdcAdapter =
            assetAdapters[Asset.USDC][Protocol.Venus];

        require(
            address(venusUsdcAdapter) != address(0),
            "Venus USDC adapter not set"
        );

        assetToken.forceApprove(address(venusUsdcAdapter), amount);

        uint256 poolBeforeVenus = assetToken.balanceOf(address(this));
        venusUsdcAdapter.deposit(amount);

        require(
            poolBeforeVenus - assetToken.balanceOf(address(this)) == amount,
            "Venus USDC deposited wrong amount"
        );

        _addPosition(inv, protocol, amount, assetsBefore, asset);
        emit LiquidityInvested(protocol, amount);
        return;
    }

            require(venusToken != address(0), "Venus token not set");

            uint256 beforeShares = _vUSDT().balanceOf(address(this));
            usdt.forceApprove(venusToken, amount);
            require(_vUSDT().mint(amount) == 0, "Venus mint failed");

            uint256 minted =
                _vUSDT().balanceOf(address(this)) - beforeShares;
            require(minted > 0, "Zero Venus shares");

            uint256 supply = totalProtocolSharesByAsset[asset][protocol];
            uint256 shares = (supply == 0 || assetsBefore == 0)
                ? amount
                : (amount * supply) / assetsBefore;

            inv.positions.push(
                Position({
                    protocol: protocol,
                    shares: shares,
                    principal: amount,
                    active: true
                })
            );

            totalProtocolSharesByAsset[asset][protocol] += shares;
            inv.allocatedAmount += amount;
            protocolBalanceByAsset[asset][Protocol.Pool] -= amount;
            protocolBalanceByAsset[asset][protocol] += amount;

            emit LiquidityInvested(protocol, amount);
            return;
        }

        IProtocolAdapter adapter;

        if (asset == Asset.USDC) {
            adapter = assetAdapters[Asset.USDC][protocol];
        } else {
            adapter = _adapterFor(protocol);
        }

        require(address(adapter) != address(0), "Adapter not set");

        assetToken.forceApprove(address(adapter), amount);
        uint256 poolBefore = assetToken.balanceOf(address(this));
        adapter.deposit(amount);
        require(
            poolBefore - assetToken.balanceOf(address(this)) == amount,
            "Adapter deposited wrong amount"
        );

        _addPosition(inv, protocol, amount, assetsBefore, asset);
        emit LiquidityInvested(protocol, amount);
    }

    // ============================================================
    // AUTO ALLOCATION
    // ============================================================

    /*
     * Р’С‹Р·С‹РІР°РµС‚СЃСЏ РёР· _depositAsset РџРћРЎР›Р• Р·Р°С‡РёСЃР»РµРЅРёСЏ СЃСЂРµРґСЃС‚РІ.
     *
     * Р›РѕРіРёРєР°:
     *   - РµСЃР»Рё РІС‹РєР»СЋС‡РµРЅРѕ РёР»Рё СЃСѓРјРјР° РјР°Р»Р° вЂ” СЃСЂРµРґСЃС‚РІР° РѕСЃС‚Р°СЋС‚СЃСЏ РІ Pool
     *   - РµСЃР»Рё СЃСѓРјРјР° targetAllocationBps > 10000 вЂ” РІС‹С…РѕРґРёРј (Р·Р°С‰РёС‚Р°)
     *   - РµСЃР»Рё СЃСѓРјРјР° < 10000 вЂ” РѕСЃС‚Р°С‚РѕРє РѕСЃС‚Р°С‘С‚СЃСЏ РІ Pool
     *   - РєР°Р¶РґС‹Р№ slice СЃС‡РёС‚Р°РµС‚СЃСЏ С‡РµСЃС‚РЅРѕ, РїС‹Р»СЊ РѕСЃС‚Р°С‘С‚СЃСЏ РІ Pool
     *   - Venus РїСЂРѕРїСѓСЃРєР°РµС‚СЃСЏ РґР»СЏ USDC
     *   - РµСЃР»Рё Р°РґР°РїС‚РµСЂ СѓРїР°Р» вЂ” slice РѕСЃС‚Р°С‘С‚СЃСЏ РІ Pool, РґРµРїРѕР·РёС‚ РЅРµ СЂРѕРЅСЏРµС‚СЃСЏ
     */
    function _autoAllocate(
    address user,
    uint256 investmentId,
    Asset asset,
    uint256 amount
) internal {
    if (!autoAllocationEnabled) return;
    if (amount < autoAllocationMinAmount) return;

    Protocol[] storage protocols = allocationProtocolsByAsset[asset];

    if (protocols.length == 0) return;

    uint256 totalBps;

    for (uint256 i = 0; i < protocols.length; i++) {
        Protocol p = protocols[i];

        // Venus СЂР°Р·СЂРµС€С‘РЅ С‚РѕР»СЊРєРѕ РґР»СЏ USDT.
        if (asset == Asset.USDC && p == Protocol.Venus) {
            return;
        }

        totalBps += targetAllocationBpsByAsset[asset][p];
    }

    if (totalBps == 0 || totalBps > BPS_DENOMINATOR) {
        return;
    }

    for (uint256 i = 0; i < protocols.length; i++) {
        Protocol p = protocols[i];
        uint256 bps = targetAllocationBpsByAsset[asset][p];

        if (bps == 0) continue;

                uint256 slice = (amount * bps) / BPS_DENOMINATOR;
        if (slice == 0) continue;

try this._externalInvest(user, investmentId, p, slice) {
    emit AutoAllocated(p, slice);
} catch Error(string memory reason) {
    if (asset == Asset.USDC) {
        revert(reason);
    }
    emit AllocationFailed(p, slice, reason);
} catch {
    if (asset == Asset.USDC) {
        revert("USDC_AUTO_ALLOCATION_FAILED");
    }
    emit AllocationFailed(p, slice, "unknown");
}

    }
}
/*
     * Р’РЅРµС€РЅСЏСЏ РѕР±С‘СЂС‚РєР° РґР»СЏ try/catch.
     * РњРѕР¶РµС‚ РІС‹Р·С‹РІР°С‚СЊСЃСЏ РўРћР›Р¬РљРћ СЃР°РјРёРј РєРѕРЅС‚СЂР°РєС‚РѕРј.
     *
     * Р’РђР–РќРћ: РќР• РґРѕР±Р°РІР»СЏС‚СЊ nonReentrant вЂ” РёРЅР°С‡Рµ СЃР»РѕРјР°РµС‚СЃСЏ
     * Р°РІС‚Рѕ-СЂР°СЃРїСЂРµРґРµР»РµРЅРёРµ, РїРѕС‚РѕРјСѓ С‡С‚Рѕ _depositAsset СѓР¶Рµ РІР·СЏР» guard.
     */
    function _externalInvest(
        address user,
        uint256 investmentId,
        Protocol protocol,
        uint256 amount
    ) external {
        require(msg.sender == address(this), "Only self");
        _investIntoProtocolInternal(user, investmentId, protocol, amount);
    }

    // ============================================================
    // VIEW FUNCTIONS
    // ============================================================

    function getInvestmentCount(
        address user
    ) external view returns (uint256) {
        return investors[user].investments.length;
    }

    function getInvestment(
        address user,
        uint256 id
    )
        external
        view
        returns (
            uint256 amount,
            uint256 startTime,
            uint256 endTime,
            uint256 period,
            uint256 reward,
            bool active,
            bool finished
        )
    {
        Investment storage inv = investors[user].investments[id];

        return (
            inv.amount,
            inv.startTime,
            inv.endTime,
            inv.period,
            inv.reward,
            inv.active,
            inv.finished
        );
    }

    function getInvestmentPositionCount(
        address user,
        uint256 investmentId
    ) external view returns (uint256) {
        require(
            investmentId < investors[user].investments.length,
            "Invalid investment"
        );
        return investors[user].investments[investmentId].positions.length;
    }

    function getInvestmentPosition(
        address user,
        uint256 investmentId,
        uint256 positionId
    )
        external
        view
        returns (
            uint8 protocol,
            uint256 shares,
            uint256 principal,
            bool active
        )
    {
        require(
            investmentId < investors[user].investments.length,
            "Invalid investment"
        );
        Position storage p = investors[user]
            .investments[investmentId]
            .positions[positionId];
        return (uint8(p.protocol), p.shares, p.principal, p.active);
    }

    function getPendingReserveFeePositionCount(
        uint256 feeId
    ) external view returns (uint256) {
        return pendingReserveFees[feeId].positions.length;
    }

    function getInvestmentAsset(
        address user,
        uint256 investmentId
    ) external view returns (Asset) {
        require(
            investmentId < investors[user].investments.length,
            "Invalid investment"
        );
        return investmentAsset[user][investmentId];
    }

    function getInvestor(
        address user
    )
        external
        view
        returns (
            bool exists,
            uint256 totalInvested,
            uint256 totalWithdrawn,
            uint256 totalReward,
            uint256 investmentCount
        )
    {
        Investor storage investor = investors[user];

        return (
            investor.exists,
            investor.totalInvested,
            investor.totalWithdrawn,
            investor.totalReward,
            investor.investments.length
        );
    }

    /*
     * Р’РѕР·РІСЂР°С‰Р°РµС‚ С‚РµРєСѓС‰РµРµ СЂР°СЃРїСЂРµРґРµР»РµРЅРёРµ РїРѕ РїСЂРѕС‚РѕРєРѕР»Р°Рј
     * РґР»СЏ РѕС‚РѕР±СЂР°Р¶РµРЅРёСЏ РІ Р°РґРјРёРЅРєРµ.
     */

function getAllocationSnapshot(
    Asset asset
)
    external
    view
    returns (
        Protocol[] memory protocols,
        uint256[] memory currentBps,
        uint256[] memory targetBps,
        uint256[] memory assets
    )
{
    Protocol[] storage configuredProtocols =
        allocationProtocolsByAsset[asset];

    uint256 len = configuredProtocols.length;

    protocols = new Protocol[](len);
    currentBps = new uint256[](len);
    targetBps = new uint256[](len);
    assets = new uint256[](len);

    uint256 total;

    for (uint256 i = 0; i < len; i++) {
        Protocol p = configuredProtocols[i];

        protocols[i] = p;
        targetBps[i] = targetAllocationBpsByAsset[asset][p];

        uint256 protocolAssetAmount = _protocolAssets(p, asset);
        assets[i] = protocolAssetAmount;
        total += protocolAssetAmount;
    }

    for (uint256 i = 0; i < len; i++) {
        currentBps[i] = total == 0
            ? 0
            : (assets[i] * BPS_DENOMINATOR) / total;
    }
}


    // ============================================================
    // LIQUIDITY RECOVERY (WITHDRAW PATH)
    // ============================================================


function _protocolAvailableAssets(
    Protocol protocol,
    Asset asset
) internal returns (uint256) {
    if (protocol == Protocol.Venus) {
        if (asset == Asset.USDC) {
            IProtocolAdapter adapter =
                assetAdapters[Asset.USDC][Protocol.Venus];

            if (address(adapter) == address(0)) return 0;

            try adapter.totalAssets() returns (uint256 assets) {
                return assets;
            } catch {
                return 0;
            }
        }

        try _vUSDT().balanceOfUnderlying(address(this)) returns (
            uint256 assets
        ) {
            return assets;
        } catch {
            return 0;
        }
    }

    if (protocol == Protocol.Aave) {
        IProtocolAdapter adapter;

        if (asset == Asset.USDC) {
            adapter = assetAdapters[Asset.USDC][Protocol.Aave];
        } else {
            adapter = aaveAdapter;
        }

        if (address(adapter) == address(0)) return 0;

        try adapter.totalAssets() returns (uint256 assets) {
            return assets;
        } catch {
            return 0;
        }
    }

    if (protocol == Protocol.DForce) {
        IProtocolAdapter adapter;

        if (asset == Asset.USDC) {
            adapter = assetAdapters[Asset.USDC][Protocol.DForce];
        } else {
            adapter = dforceAdapter;
        }

        if (address(adapter) == address(0)) return 0;

        try adapter.totalAssets() returns (uint256 assets) {
            return assets;
        } catch {
            return 0;
        }
    }

    return 0;
}

    function _withdrawFromProtocolRaw(
        Protocol protocol,
        uint256 amount,
        Asset asset
    ) internal returns (uint256 actual) {
        if (amount == 0) return 0;

        IERC20 assetToken = asset == Asset.USDC ? usdc : usdt;
        require(address(assetToken) != address(0), "Asset token not set");

        uint256 beforeBalance = assetToken.balanceOf(address(this));


        if (protocol == Protocol.Venus) {
            if (asset == Asset.USDC) {
                IProtocolAdapter adapter =
                    assetAdapters[Asset.USDC][Protocol.Venus];

                if (address(adapter) == address(0)) return 0;

                uint256 available = _protocolAvailableAssets(
                    Protocol.Venus,
                    Asset.USDC
                );
                uint256 request = available < amount ? available : amount;
                if (request == 0) return 0;

                try adapter.withdraw(request) returns (uint256) {
                } catch {
                    return 0;
                }
            } else {
                require(asset == Asset.USDT, "Venus supports USDT only");

                uint256 available = _protocolAvailableAssets(
                    Protocol.Venus,
                    asset
                );
                uint256 request = available < amount ? available : amount;
                if (request == 0) return 0;

                uint256 exchangeRate = _vUSDT().exchangeRateStored();
                if (exchangeRate == 0) return 0;

                uint256 redeemTokens = (request * 1e18) / exchangeRate;
                if (redeemTokens == 0) return 0;

                try _vUSDT().redeemUnderlying(request) returns (
    uint256 result
) {
    if (result != 0) return 0;
} catch {
    return 0;
}
            }
        } else if (protocol == Protocol.Aave) {
            IProtocolAdapter adapter;

            if (asset == Asset.USDC) {
                adapter = assetAdapters[Asset.USDC][Protocol.Aave];
            } else {
                adapter = aaveAdapter;
            }

            if (address(adapter) == address(0)) return 0;

            uint256 available = _protocolAvailableAssets(
                Protocol.Aave,
                asset
            );
            uint256 request = available < amount ? available : amount;
            if (request == 0) return 0;

            try adapter.withdraw(request) returns (uint256) {} catch {
                return 0;
            }
        } else if (protocol == Protocol.DForce) {
            IProtocolAdapter adapter;

            if (asset == Asset.USDC) {
                adapter = assetAdapters[Asset.USDC][Protocol.DForce];
            } else {
                adapter = dforceAdapter;
            }

            if (address(adapter) == address(0)) return 0;

            uint256 available = _protocolAvailableAssets(
                Protocol.DForce,
                asset
            );
            uint256 request = available < amount ? available : amount;
            if (request == 0) return 0;

            try adapter.withdraw(request) returns (uint256) {} catch {
                return 0;
            }
        }

        uint256 afterBalance = assetToken.balanceOf(address(this));
        if (afterBalance <= beforeBalance) return 0;
        return afterBalance - beforeBalance;
    }

    function _positionValue(
        Position storage position,
        Asset asset
    ) internal view returns (uint256) {
        if (!position.active || position.shares == 0) return 0;

        uint256 supply = totalProtocolSharesByAsset[asset][position.protocol];
        if (supply == 0) return 0;

        uint256 assets = _protocolAssets(position.protocol, asset);
        return (assets * position.shares) / supply;
    }

    function _recordProtocolWithdrawal(
        Protocol protocol,
        uint256 principal,
        uint256 shares,
        Asset asset
    ) internal {
        if (shares > totalProtocolSharesByAsset[asset][protocol]) {
            totalProtocolSharesByAsset[asset][protocol] = 0;
        } else {
            totalProtocolSharesByAsset[asset][protocol] -= shares;
        }

        uint256 recorded = protocolBalanceByAsset[asset][protocol];
        protocolBalanceByAsset[asset][protocol] = recorded > principal
            ? recorded - principal
            : 0;
    }

    function _withdrawPositionFull(
        Position storage position,
        Asset asset
    ) internal returns (uint256 actual) {
        if (!position.active || position.shares == 0) return 0;

        uint256 value = _positionValue(position, asset);
        if (value == 0) return 0;

        actual = _withdrawFromProtocolRaw(position.protocol, value, asset);

        require(actual > 0, "Position withdrawal failed");

        _recordProtocolWithdrawal(
            position.protocol,
            position.principal,
            position.shares,
            asset
        );

        position.shares = 0;
        position.principal = 0;
        position.active = false;
    }

    function _finishInvestmentAccounting(
        Investor storage investor,
        Investment storage inv,
        uint256 actualPayout,
        uint256 actualReward,
        Asset asset
    ) internal {
        investor.totalWithdrawn += actualPayout;
        investor.totalReward += actualReward;

        if (asset == Asset.USDT) {
            if (totalActiveDeposits >= inv.amount) {
                totalActiveDeposits -= inv.amount;
            } else {
                totalActiveDeposits = 0;
            }
        }

        if (totalActiveDepositsByAsset[asset] >= inv.amount) {
            totalActiveDepositsByAsset[asset] -= inv.amount;
        } else {
            totalActiveDepositsByAsset[asset] = 0;
        }

        if (totalPendingRewards >= inv.reward) {
            totalPendingRewards -= inv.reward;
        } else {
            totalPendingRewards = 0;
        }

        inv.active = false;
        inv.finished = true;
    }

    // ============================================================
    // WITHDRAW
    // ============================================================

    function withdraw(
        uint256 investmentId
    ) external whenNotPaused nonReentrant {
        Investor storage investor = investors[msg.sender];
        require(
            investmentId < investor.investments.length,
            "Invalid investment"
        );
        Investment storage inv = investor.investments[investmentId];

        Asset asset = investmentAsset[msg.sender][investmentId];
        require(inv.active && !inv.finished, "Investment inactive");
        require(block.timestamp >= inv.endTime, "Investment not finished");

        uint256 allocatedPrincipal = inv.allocatedAmount;
        uint256 unallocatedPrincipal = inv.amount - allocatedPrincipal;

        IERC20 assetToken = asset == Asset.USDC ? usdc : usdt;
        require(address(assetToken) != address(0), "Asset token not set");

        if (unallocatedPrincipal > 0) {
            require(
                protocolBalanceByAsset[asset][Protocol.Pool] >=
                    unallocatedPrincipal,
                "Insufficient Pool balance"
            );
        }

        uint256 recovered;
        for (uint256 i = 0; i < inv.positions.length; i++) {
            recovered += _withdrawPositionFull(inv.positions[i], asset);
        }

        uint256 available = recovered + unallocatedPrincipal;

        uint256 actualReward = 0;

        if (available > inv.amount) {
            actualReward = available - inv.amount;

            if (actualReward > inv.reward) {
                actualReward = inv.reward;
            }
        }

        uint256 payout;

        if (available < inv.amount) {
            payout = available;
            actualReward = 0;
        } else {
            payout = inv.amount + actualReward;
        }

        if (unallocatedPrincipal > 0) {
            protocolBalanceByAsset[asset][Protocol.Pool] -= unallocatedPrincipal;
        }

        _finishInvestmentAccounting(
            investor,
            inv,
            payout,
            actualReward,
            asset
        );

        assetToken.safeTransfer(msg.sender, payout);

        uint256 reserveProfit = 0;

        if (available > inv.amount + inv.reward) {
            reserveProfit = available - inv.amount - inv.reward;
        }

        if (reserveProfit > 0) {
            require(
                assetToken.balanceOf(address(this)) >= reserveProfit,
                "Insufficient reserve liquidity"
            );

            assetToken.safeTransfer(reserveWallet, reserveProfit);

            emit ProfitHarvested(Protocol.Pool, reserveProfit);
        }

        emit Withdrawn(msg.sender, investmentId, payout, actualReward);
    }

    // ============================================================
    // EARLY WITHDRAW
    // ============================================================

    function earlyWithdraw(
        uint256 investmentId
    ) external whenNotPaused nonReentrant {
        Investor storage investor = investors[msg.sender];

        require(
            investmentId < investor.investments.length,
            "Invalid investment"
        );

        Investment storage inv = investor.investments[investmentId];
        Asset asset = investmentAsset[msg.sender][investmentId];

        IERC20 assetToken = asset == Asset.USDC ? usdc : usdt;
        require(address(assetToken) != address(0), "Asset token not set");

        require(inv.active && !inv.finished, "Investment inactive");
        require(block.timestamp < inv.endTime, "Use normal withdraw");

        uint256 fee = (inv.amount * earlyWithdrawFee) / BPS_DENOMINATOR;
        uint256 payout = inv.amount - fee;

        uint256 allocatedPrincipal = inv.allocatedAmount;
        uint256 unallocatedPrincipal = inv.amount - allocatedPrincipal;

        uint256 unallocatedFee = 0;
        uint256 unallocatedPayout = 0;

        if (unallocatedPrincipal > 0) {
            unallocatedFee =
                (unallocatedPrincipal * earlyWithdrawFee) /
                BPS_DENOMINATOR;

            unallocatedPayout = unallocatedPrincipal - unallocatedFee;

            require(
                protocolBalanceByAsset[asset][Protocol.Pool] >=
                    unallocatedPayout,
                "Insufficient Pool balance"
            );

            protocolBalanceByAsset[asset][Protocol.Pool] -= unallocatedPayout;
        }

        PendingReserveFee storage pending = pendingReserveFees.push();

        pending.amount = unallocatedFee;
        pending.unlockTime = inv.endTime;
        pending.transferred = false;

        uint256 feeId = pendingReserveFees.length - 1;
        pendingReserveFeeAsset[feeId] = investmentAsset[msg.sender][
            investmentId
        ];

        emit ReserveFeeLocked(
            msg.sender,
            investmentId,
            feeId,
            fee,
            inv.endTime
        );

        uint256 remainingUserPayout = payout - unallocatedPayout;

        for (uint256 i = 0; i < inv.positions.length; i++) {
            Position storage p = inv.positions[i];

            if (!p.active || p.shares == 0) continue;

            uint256 supplyBefore = totalProtocolSharesByAsset[asset][
                p.protocol
            ];

            uint256 assetsBefore = _protocolAssets(p.protocol, asset);

            require(
                supplyBefore > 0 && assetsBefore > 0,
                "Insufficient position liquidity"
            );

            uint256 userPrincipal = (p.principal *
                (BPS_DENOMINATOR - earlyWithdrawFee)) / BPS_DENOMINATOR;

            uint256 reservePrincipal = p.principal - userPrincipal;

            require(
                assetsBefore >= userPrincipal,
                "Insufficient position liquidity"
            );

            uint256 sharesToWithdraw = (userPrincipal * supplyBefore) /
                assetsBefore;

            if (sharesToWithdraw == 0 && userPrincipal > 0) {
                sharesToWithdraw = 1;
            }

            require(
                sharesToWithdraw < p.shares || userPrincipal == assetsBefore,
                "Insufficient position liquidity"
            );

            uint256 actual = _withdrawFromProtocolRaw(
                p.protocol,
                userPrincipal,
                asset
            );

            require(
                actual == userPrincipal,
                "Early withdrawal amount mismatch"
            );

            _recordProtocolWithdrawal(
                p.protocol,
                userPrincipal,
                sharesToWithdraw,
                asset
            );

            uint256 reserveShares = p.shares - sharesToWithdraw;

            if (reserveShares > 0) {
                pending.positions.push(
                    Position({
                        protocol: p.protocol,
                        shares: reserveShares,
                        principal: reservePrincipal,
                        active: true
                    })
                );
            }

            if (actual >= remainingUserPayout) {
                remainingUserPayout = 0;
            } else {
                remainingUserPayout -= actual;
            }

            p.shares = 0;
            p.principal = 0;
            p.active = false;
        }

        require(
            remainingUserPayout == 0,
            "Insufficient investment liquidity"
        );

        _finishInvestmentAccounting(investor, inv, payout, 0, asset);

        assetToken.safeTransfer(msg.sender, payout);

        emit EarlyWithdraw(msg.sender, investmentId, payout);
    }

    // ============================================================
    // ADMIN CONFIG
    // ============================================================

    function setAssetAdapter(
        Asset asset,
        Protocol protocol,
        address adapter
    ) external onlyOwner {
        require(asset == Asset.USDC, "Only USDC adapters");
        require(
            protocol != Protocol.Pool && protocol != Protocol.Reserve,
            "Invalid protocol"
        );
        require(adapter != address(0), "Invalid adapter");

        assetAdapters[asset][protocol] = IProtocolAdapter(adapter);
    }

    function setUSDC(address token) external onlyOwner {
        require(token != address(0), "Invalid USDC token");
        usdc = IERC20(token);
    }

    function setVenusToken(address token) external onlyOwner {
        require(token != address(0), "Invalid Venus token");
        venusToken = token;
    }

    function setEarlyWithdrawFee(uint256 fee) external onlyOwner {
        require(fee <= 3000, "Fee too high");
        earlyWithdrawFee = fee;
    }

    function setRewardRate(
        uint256 period,
        uint256 reward
    ) external onlyOwner validPeriod(period) {
        require(reward <= MAX_REWARD_BPS, "Reward too high");
        rewardRate[period] = reward;

        emit RewardRateChanged(period, reward);
    }

    function setMinimumInvestment(uint256 amount) external onlyOwner {
        require(amount > 0, "Invalid amount");
        minimumInvestment = amount;
    }

    function pause() external onlyOwner {
        _pause();
        emit EmergencyPaused();
    }

    function unpause() external onlyOwner {
        _unpause();
        emit EmergencyUnpaused();
    }

    // ============================================================
    // AUTO ALLOCATION CONFIG (OWNER ONLY)
    // ============================================================

    function setAutoAllocationEnabled(bool enabled) external onlyOwner {
        autoAllocationEnabled = enabled;
        emit AutoAllocationToggled(enabled);
    }

    function setAutoAllocationMinAmount(uint256 amount) external onlyOwner {
        autoAllocationMinAmount = amount;
    }

function setTargetAllocationForAsset(
    Asset asset,
    Protocol protocol,
    uint256 bps
) external onlyOwner {
    require(
        protocol != Protocol.Pool &&
        protocol != Protocol.Reserve,
        "Invalid protocol"
    );
    require(bps <= BPS_DENOMINATOR, "bps > 100%");

    // Venus Р·Р°РїСЂРµС‰С‘РЅ РІ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРѕРј СЂР°СЃРїСЂРµРґРµР»РµРЅРёРё USDC.
    if (asset == Asset.USDC) {
      require(protocol != Protocol.Venus, "VENUS_USDC");
    }

    targetAllocationBpsByAsset[asset][protocol] = bps;

    Protocol[] storage protocols = allocationProtocolsByAsset[asset];
    uint256 total;

    for (uint256 i = 0; i < protocols.length; i++) {
        total += targetAllocationBpsByAsset[asset][protocols[i]];
    }

    require(total <= BPS_DENOMINATOR, "Total allocation > 100%");

    emit AutoAllocationConfiguredForAsset(asset, protocol, bps);
}

function setAllocationProtocolsForAsset(
    Asset asset,
    Protocol[] calldata protocols
) external onlyOwner {
    uint256 total;

    // РџСЂРѕРІРµСЂСЏРµРј РІРµСЃСЊ СЃРїРёСЃРѕРє РґРѕ РµРіРѕ СЃРѕС…СЂР°РЅРµРЅРёСЏ.
    for (uint256 i = 0; i < protocols.length; i++) {
        Protocol p = protocols[i];

        require(
            p != Protocol.Pool && p != Protocol.Reserve,
            "Invalid protocol"
        );

        if (asset == Asset.USDC) {
          require(p != Protocol.Venus, "VENUS_USDC");
        }

        // РќРµ РґРѕРїСѓСЃРєР°РµРј РїРѕРІС‚РѕСЂРµРЅРёСЏ РїСЂРѕС‚РѕРєРѕР»РѕРІ.
        for (uint256 j = 0; j < i; j++) {
            require(protocols[j] != p, "DUP");
        }

        total += targetAllocationBpsByAsset[asset][p];
    }

    require(total <= BPS_DENOMINATOR, "Total allocation > 100%");

    delete allocationProtocolsByAsset[asset];

    for (uint256 i = 0; i < protocols.length; i++) {
        allocationProtocolsByAsset[asset].push(protocols[i]);
    }
}
    // ============================================================
    // RESERVE FEES PROCESSING
    // ============================================================

    /*
     * РћР±СЂР°Р±Р°С‚С‹РІР°РµС‚ pendingReserveFees РўРћР›Р¬РљРћ РѕРґРЅРѕРіРѕ Р°РєС‚РёРІР° Р·Р° РІС‹Р·РѕРІ.
     * Р§СѓР¶РёРµ Р°РєС‚РёРІС‹ РїСЂРѕРїСѓСЃРєР°СЋС‚СЃСЏ С‡РµСЂРµР· continue, Р° РЅРµ СЂРѕРЅСЏСЋС‚ РІС‹Р·РѕРІ.
     */
    function processPendingReserveFees() public nonReentrant {
        uint256 processed;
        Asset targetAsset;
        bool hasTarget;

        for (uint256 i = 0; i < pendingReserveFees.length; i++) {
            PendingReserveFee storage fee = pendingReserveFees[i];

            if (fee.transferred) continue;
            if (block.timestamp < fee.unlockTime) continue;

            Asset feeAsset = pendingReserveFeeAsset[i];

            if (!hasTarget) {
                targetAsset = feeAsset;
                hasTarget = true;
            }

            // РџСЂРѕРїСѓСЃРєР°РµРј С‡СѓР¶РёРµ Р°РєС‚РёРІС‹ РІРјРµСЃС‚Рѕ revert.
            if (feeAsset != targetAsset) continue;

            uint256 totalReturned;
            for (uint256 j = 0; j < fee.positions.length; j++) {
                totalReturned += _withdrawPositionFull(
                    fee.positions[j],
                    feeAsset
                );
            }

            uint256 reserveAmount = fee.amount + totalReturned;
            require(reserveAmount > 0, "Reserve fee has no liquidity");

            IERC20 feeToken = feeAsset == Asset.USDC ? usdc : usdt;
            require(address(feeToken) != address(0), "Asset token not set");
            require(
                feeToken.balanceOf(address(this)) >= reserveAmount,
                "Reserve liquidity missing"
            );

            fee.transferred = true;
            processed += reserveAmount;
        }

        require(processed > 0, "No fees available");

        IERC20 processedToken = targetAsset == Asset.USDC ? usdc : usdt;
        require(address(processedToken) != address(0), "Asset token not set");

        processedToken.safeTransfer(reserveWallet, processed);

        emit FeesWithdrawn(reserveWallet, processed);
    }

    function processReserveFees() external onlyOwner {
        processPendingReserveFees();
    }



    // ============================================================
    // MIGRATION
    // ============================================================
    /// @custom:oz-upgrades-unsafe-allow missing-initializer-call
    function migrateLegacyUSDTState()
        external
        reinitializer(2)
        onlyOwner
    {
        totalDepositsByAsset[Asset.USDT] = totalDeposits;
        totalActiveDepositsByAsset[Asset.USDT] = totalActiveDeposits;

        for (
            uint256 i = uint256(Protocol.Pool);
            i <= uint256(Protocol.DForce);
            i++
        ) {
            Protocol protocol = Protocol(i);

            protocolBalanceByAsset[Asset.USDT][protocol] = protocolBalance[
                protocol
            ];

            totalProtocolSharesByAsset[Asset.USDT][protocol] =
                totalProtocolShares[protocol];
        }

        // РЎС‚Р°СЂС‹Рµ РёРЅРІРµСЃС‚РёС†РёРё Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё USDT (Asset.USDT == 0).
        // РЎС‚Р°СЂС‹Рµ pendingReserveFees Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё USDT (Asset.USDT == 0).
    }

    // ============================================================
    // RESERVED STORAGE
    // ============================================================

    /*
     * Reserved storage for future upgrades.
     * Do not insert variables into the existing storage layout.
     */
    uint256[35] private __gap;
}
