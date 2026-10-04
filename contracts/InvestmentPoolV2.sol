// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "./ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IProtocolAdapter {
    function deposit(
        uint256 amount
    ) external;

    function withdraw(
        uint256 amount
    ) external returns (uint256);

    function totalAssets()
        external
        view
        returns (uint256);
}
interface IVToken {
    function mint(uint256 mintAmount) external returns (uint256);

    function redeemUnderlying(
        uint256 redeemAmount
    ) external returns (uint256);

    function balanceOfUnderlying(
        address owner
    ) external returns (uint256);

    function balanceOf(
        address owner
    ) external view returns (uint256);

    function exchangeRateStored()
        external
        view
        returns (uint256);
}
contract InvestmentPoolV2 is
    Initializable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    /*
     * Merged candidate:
     * current InvestmentPoolV2 + proven Venus withdrawal mechanics
     * + current Aave adapter architecture.
     */
    using SafeERC20 for IERC20;

IERC20 public usdt;
    
    address public constant VUSDT =
    0xfD5840Cd36d94D7229439859C0112a4185BC0255;
    address public venusToken;

   address public reserveWallet; 
    

    function _vUSDT() internal view returns (IVToken) {
        return IVToken(venusToken);
    }

IProtocolAdapter public beefyAdapter;
IProtocolAdapter public venusAdapter;
IProtocolAdapter public pancakeAdapter;
IProtocolAdapter public aaveAdapter;
 IProtocolAdapter public dforceAdapter;

uint256 public totalDeposits;
uint256 public totalInvestors;

mapping(Protocol => uint256) public protocolBalance;
    mapping(Protocol => uint256) public totalProtocolShares;
// Общая сумма прибыли, уже обещанной активным инвесторам,
// но ещё не выплаченной.
uint256 public totalPendingRewards;
uint256 public totalActiveDeposits;

    uint256 public constant DAY = 1 days;
    uint256 public constant WEEK = 7 days;
    uint256 public constant MONTH = 30 days;
    uint256 public constant THREE_MONTHS = 90 days;
    uint256 public constant SIX_MONTHS = 180 days;
    uint256 public constant YEAR = 365 days;

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

    mapping(address => Investor) private investors;
    PendingReserveFee[] public pendingReserveFees;
    mapping(uint256 => uint256) public rewardRate;
    uint256 public earlyWithdrawFee; // 15%
    uint256 public minimumInvestment;

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

    event RewardRateChanged(
        uint256 period,
        uint256 reward
    );

    event EmergencyPaused();

    event EmergencyUnpaused();
    event FeesWithdrawn(
    address indexed owner,
    uint256 amount
);
event ReserveFeeLocked(
    address indexed user,
    uint256 indexed investmentId,
    uint256 indexed feeId,
    uint256 amount,
    uint256 unlockTime
);
event LiquidityInvested(
    Protocol indexed protocol,
    uint256 amount
);
event ProfitHarvested(
    Protocol indexed protocol,
    uint256 amount
);

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

    function initialize(
        address usdtAddress,
        address reserveAddress
    )
        external
        initializer
    {
        require(
            usdtAddress != address(0),
            "Invalid USDT"
        );

        require(
            reserveAddress != address(0),
            "Invalid reserve"
        );

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
    }
    function deposit(
    uint256 amount,
    uint256 period
)
    external
    whenNotPaused
    nonReentrant
    validPeriod(period)
{
    _depositAsset(amount, period, Asset.USDT);
}


function depositAsset(
    uint256 amount,
    uint256 period,
    Asset asset
)
    external
    whenNotPaused
    nonReentrant
    validPeriod(period)
{
    _depositAsset(amount, period, asset);
}
function _depositAsset(
    uint256 amount,
    uint256 period,
    Asset asset
)
    internal
{
    require(
        amount > 0,
        "Amount must be greater than zero"
    );

    IERC20 assetToken;

    if (asset == Asset.USDT) {
        assetToken = usdt;
    } else {
        require(
            address(usdc) != address(0),
            "USDC not set"
        );

        assetToken = usdc;
    }

    require(
        address(assetToken) != address(0),
        "Asset token not set"
    );

    if (msg.sender != owner()) {
    uint256 minimumForAsset;

    if (asset == Asset.USDT) {
        minimumForAsset = minimumInvestment;
     } else {
    // USDC on BNB Smart Chain uses 18 decimals.
    minimumForAsset = 25e18;
}

    require(
        amount >= minimumForAsset,
        "Minimum investment is 25"
    );
}

    Investor storage investor =
        investors[msg.sender];

    /*
     * Один актив + один период = одна активная инвестиция.
     * USDT и USDC друг другу не мешают.
     */
    if (msg.sender != owner()) {
        for (
            uint256 i = 0;
            i < investor.investments.length;
            i++
        ) {
            Investment storage inv =
                investor.investments[i];

            if (
                inv.active &&
                inv.period == period &&
                investmentAsset[msg.sender][i] == asset
            ) {
                revert(
                    "Active deposit for this period already exists"
                );
            }
        }
    }

    assetToken.safeTransferFrom(
        msg.sender,
        address(this),
        amount
    );

    if (!investor.exists) {
        investor.exists = true;
        totalInvestors++;
    }

    uint256 reward =
        (amount * rewardRate[period]) / 10000;

    totalPendingRewards += reward;

    uint256 investmentId =
        investor.investments.length;

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

    /*
     * Старые инвестиции автоматически являются USDT.
     * Новые инвестиции явно записываем с выбранным Asset.
     */
    investmentAsset[msg.sender][investmentId] =
        asset;

    investor.totalInvested += amount;

    /*
     * Новая multi-asset бухгалтерия.
     */
    totalDepositsByAsset[asset] += amount;

    totalActiveDepositsByAsset[asset] += amount;

    protocolBalanceByAsset[asset][Protocol.Pool] +=
        amount;

    /*
     * Старые глобальные счётчики сохраняем
     * синхронизированными только для USDT.
     *
     * Они относятся к старой USDT-архитектуре.
     */
    if (asset == Asset.USDT) {
        totalDeposits += amount;
        totalActiveDeposits += amount;
        protocolBalance[Protocol.Pool] += amount;
    }

    emit Deposited(
        msg.sender,
        investmentId,
        amount,
        period
    );
}


    /*
     * ============================================================
     * PROTOCOL ADAPTERS
     * ============================================================
     */

    function setProtocolAdapter(
        Protocol protocol,
        address adapter
    )
        external
        onlyOwner
    {
        require(
            adapter != address(0),
            "Invalid adapter"
        );

        if (protocol == Protocol.Beefy) {
            beefyAdapter =
                IProtocolAdapter(adapter);

        } else if (protocol == Protocol.Venus) {
            venusAdapter =
                IProtocolAdapter(adapter);

        } else if (protocol == Protocol.Pancake) {
            pancakeAdapter =
                IProtocolAdapter(adapter);

        } else if (protocol == Protocol.Aave) {
            aaveAdapter =
                IProtocolAdapter(adapter);

        } else if (protocol == Protocol.DForce) {
            dforceAdapter =
                IProtocolAdapter(adapter);

        } else {
            revert(
                "Invalid adapter protocol"
            );
        }
    }
    function _adapterFor(Protocol protocol) internal view returns (IProtocolAdapter adapter) {
        if (protocol == Protocol.Aave) return aaveAdapter;
        if (protocol == Protocol.DForce) return dforceAdapter;
        if (protocol == Protocol.Beefy) return beefyAdapter;
        if (protocol == Protocol.Pancake) return pancakeAdapter;
    }

    function _protocolAssets(
    Protocol protocol,
    Asset asset
) internal view returns (uint256) {
    if (protocol == Protocol.Venus) {
        uint256 shares = _vUSDT().balanceOf(address(this));
        if (shares == 0) return 0;

        uint256 exchangeRate = _vUSDT().exchangeRateStored();
        return (shares * exchangeRate) / 1e18;
    }
    IProtocolAdapter adapter;

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
    uint256 supply =
    totalProtocolSharesByAsset[asset][protocol];

    uint256 shares =
        (supply == 0 || assetsBefore == 0)
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

    function investIntoProtocol(
        address user,
        uint256 investmentId,
        Protocol protocol,
        uint256 amount
    ) external onlyOwner nonReentrant {
        require(user != address(0), "Invalid user");
        require(investmentId < investors[user].investments.length, "Invalid investment");
        require(amount > 0, "Invalid amount");
        require(protocol != Protocol.Pool && protocol != Protocol.Reserve, "Invalid protocol");

        Investment storage inv = investors[user].investments[investmentId];
        Asset asset = investmentAsset[user][investmentId];
        require(inv.active && !inv.finished, "Investment inactive");
        require(inv.allocatedAmount + amount <= inv.amount, "Amount exceeds investment");

        uint256 assetsBefore =
    _protocolAssets(protocol, asset);
        IERC20 assetToken =
    asset == Asset.USDC ? usdc : usdt;
    require(
    address(assetToken) != address(0),
    "Asset token not set"
    );

    if (protocol == Protocol.Venus) {    
        require(
            asset == Asset.USDT,
            "Venus supports USDT only"
            );
            uint256 beforeShares = _vUSDT().balanceOf(address(this));
            usdt.forceApprove(venusToken, amount);
            require(_vUSDT().mint(amount) == 0, "Venus mint failed");
            uint256 minted = _vUSDT().balanceOf(address(this)) - beforeShares;
            require(minted > 0, "Zero Venus shares");
            uint256 supply =
            totalProtocolSharesByAsset[asset][protocol];
            uint256 shares = (supply == 0 || assetsBefore == 0) ? amount : (amount * supply) / assetsBefore;
            inv.positions.push(Position({protocol: protocol, shares: shares, principal: amount, active: true}));
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
        require(poolBefore - assetToken.balanceOf(address(this))  == amount, "Adapter deposited wrong amount");
        _addPosition(inv, protocol,amount,assetsBefore,asset);
        emit LiquidityInvested(protocol, amount);
    }

    function getInvestmentCount(address user)
        external
        view
        returns (uint256)
    {
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

    function getInvestmentPositionCount(address user, uint256 investmentId)
        external
        view
        returns (uint256)
    {
        require(investmentId < investors[user].investments.length, "Invalid investment");
        return investors[user].investments[investmentId].positions.length;
    }

    function getInvestmentPosition(address user, uint256 investmentId, uint256 positionId)
        external
        view
        returns (uint8 protocol, uint256 shares, uint256 principal, bool active)
    {
        require(investmentId < investors[user].investments.length, "Invalid investment");
        Position storage p = investors[user].investments[investmentId].positions[positionId];
        return (uint8(p.protocol), p.shares, p.principal, p.active);
    }

    function getPendingReserveFeePositionCount(uint256 feeId) external view returns (uint256) {
        return pendingReserveFees[feeId].positions.length;
    }

    /*
     * ============================================================
     * REAL LIQUIDITY RECOVERY
     * ============================================================
     *
     * Automatic recovery on user withdrawal.
     *
     * Currently supported:
     *   Venus -> direct vUSDT redeemUnderlying()
     *   Aave  -> AaveAdapter.withdraw()
     *
     * Beefy/Pancake are intentionally NOT used here until their
     * real adapters/addresses are configured.
     *
     * There is no hard-coded Venus -> Aave -> Beefy -> Pancake
     * business route. The helper only attempts protocols that are
     * currently supported and configured.
     */

    function _protocolAvailableAssets(
    Protocol protocol,
    Asset asset
)
        internal
        returns (uint256)
    {
        if (protocol == Protocol.Venus) {
    if (asset != Asset.USDT) {
        return 0;
    }

    try _vUSDT().balanceOfUnderlying(address(this))
        returns (uint256 assets)
    {
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

    if (address(adapter) == address(0)) {
        return 0;
    }

    try adapter.totalAssets()
        returns (uint256 assets)
    {
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

    if (address(adapter) == address(0)) {
        return 0;
    }

    try adapter.totalAssets()
        returns (uint256 assets)
    {
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
        IERC20 assetToken =
    asset == Asset.USDC ? usdc : usdt;

require(
    address(assetToken) != address(0),
    "Asset token not set"
);

uint256 beforeBalance =
    assetToken.balanceOf(address(this));

    if (protocol == Protocol.Venus) {    
        require(
    asset == Asset.USDT,
    "Venus supports USDT only"
    );
            uint256 available =
    _protocolAvailableAssets(
        Protocol.Venus,
        asset
    );
            uint256 request = available < amount ? available : amount;
            if (request == 0) return 0;
            uint256 exchangeRate = _vUSDT().exchangeRateStored();
            if (exchangeRate == 0) return 0;
            uint256 redeemTokens = (request * 1e18) / exchangeRate;
            if (redeemTokens == 0) return 0;
            try _vUSDT().redeemUnderlying(request) returns (uint256 result) {
                if (result != 0) return 0;
            } catch { return 0; }
        } else if (protocol == Protocol.Aave) {
    IProtocolAdapter adapter;

    if (asset == Asset.USDC) {
        adapter = assetAdapters[Asset.USDC][Protocol.Aave];
    } else {
        adapter = aaveAdapter;
    }

    if (address(adapter) == address(0)) return 0;

    uint256 available =
        _protocolAvailableAssets(
            Protocol.Aave,
            asset
        );

    uint256 request =
        available < amount ? available : amount;

    if (request == 0) return 0;

    try adapter.withdraw(request)
        returns (uint256)
    {} catch {
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

    uint256 available =
        _protocolAvailableAssets(
            Protocol.DForce,
            asset
        );

    uint256 request =
        available < amount ? available : amount;

    if (request == 0) return 0;

    try adapter.withdraw(request)
        returns (uint256)
    {} catch {
        return 0;
    }
}

        uint256 afterBalance =
    assetToken.balanceOf(address(this));

if (afterBalance <= beforeBalance) return 0;

return afterBalance - beforeBalance;
    }

    /*
     * ------------------------------------------------------------
     * Withdrawal helpers
     * ------------------------------------------------------------
     *
     * Venus uses the proven Compound/Venus vUSDT mechanics:
     * balanceOfUnderlying() -> exchangeRateStored() ->
     * redeemUnderlying().
     *
     * Aave uses the existing adapter.
     *
     * Principal is never treated as profit.  Any real profit above
     * the current investment's promised reward is sent to Reserve.
     */

    function _positionValue(
    Position storage position,
    Asset asset
) internal view returns (uint256) {
    if (!position.active || position.shares == 0) {
        return 0;
    }

    uint256 supply =
        totalProtocolSharesByAsset[asset][position.protocol];

    if (supply == 0) {
        return 0;
    }

    uint256 assets =
        _protocolAssets(position.protocol, asset);

    return (assets * position.shares) / supply;
}

    function _recordProtocolWithdrawal(
    Protocol protocol,
    uint256 principal,
    uint256 shares,
    Asset asset
) internal {
        if (
    shares >
    totalProtocolSharesByAsset[asset][protocol]
) {
    totalProtocolSharesByAsset[asset][protocol] = 0;
} else {
    totalProtocolSharesByAsset[asset][protocol] -= shares;
}
        uint256 recorded =
    protocolBalanceByAsset[asset][protocol];

protocolBalanceByAsset[asset][protocol] =
    recorded > principal
        ? recorded - principal
        : 0;
        // The returned amount is already earmarked for the current withdrawal
        // (user payout or Reserve), so it must not be counted as idle Pool funds.
    }

    function _withdrawPositionFull(
    Position storage position,
    Asset asset
    )
    internal
    returns (uint256 actual)
    {
    if (!position.active || position.shares == 0) {
        return 0;
    }

    uint256 value = _positionValue(
    position,
    asset
);

    if (value == 0) {
        return 0;
    }

    actual = _withdrawFromProtocolRaw(
    position.protocol,
    value,
    asset
    );

    require(
        actual > 0,
        "Position withdrawal failed"
    );

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

    function withdraw(uint256 investmentId)
        external
        whenNotPaused
        nonReentrant
    {
        Investor storage investor = investors[msg.sender];
        require(investmentId < investor.investments.length, "Invalid investment");
        Investment storage inv =
    investor.investments[investmentId];

        Asset asset = investmentAsset[msg.sender][investmentId];
        require(inv.active && !inv.finished, "Investment inactive");
        require(block.timestamp >= inv.endTime, "Investment not finished");

        uint256 allocatedPrincipal = inv.allocatedAmount;
        uint256 unallocatedPrincipal = inv.amount - allocatedPrincipal;
        
        IERC20 assetToken =
    asset == Asset.USDC ? usdc : usdt;

require(
    address(assetToken) != address(0),
    "Asset token not set"
);

        // The unallocated part belongs to this investment's Pool balance.
        // It is never recovered from another investment's protocol position.
        if (unallocatedPrincipal > 0) {
            require(
        protocolBalanceByAsset[asset][Protocol.Pool] >= unallocatedPrincipal,
        "Insufficient Pool balance"
        );
        }

        // Recover only this investment's positions.
        // Never use another investment's protocol position.
        uint256 recovered;
        for (uint256 i = 0; i < inv.positions.length; i++) {
            recovered += _withdrawPositionFull(
                inv.positions[i],
                asset
                );
        }

        // Calculate the amount that was really recovered.
        //
        // IMPORTANT:
        // The Pool NEVER covers a protocol shortfall.
        // If the protocol returns less than the original investment,
        // the user receives only what was actually recovered.
        uint256 available =
            recovered + unallocatedPrincipal;

        uint256 actualReward = 0;

        // Profit exists only when the recovered amount is
        // greater than the original investment amount.
        if (available > inv.amount) {
            actualReward =
                available - inv.amount;

            // Never pay more than the promised reward.
            if (actualReward > inv.reward) {
                actualReward = inv.reward;
            }
        }

        // If there is a protocol shortfall, pay only the real
        // amount recovered. Do NOT take the difference from Pool.
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

        assetToken.safeTransfer(
            msg.sender,
            payout
            );

        // Only real profit above the promised reward goes to Reserve.
        uint256 reserveProfit = 0;

        if (available > inv.amount + inv.reward) {
            reserveProfit =
                available - inv.amount - inv.reward;
        }

        if (reserveProfit > 0) {
            require(
    assetToken.balanceOf(address(this)) >= reserveProfit,
    "Insufficient reserve liquidity"
);

assetToken.safeTransfer(
    reserveWallet,
    reserveProfit
);

            emit ProfitHarvested(
                Protocol.Pool,
                reserveProfit
            );
        }

        emit Withdrawn(
            msg.sender,
            investmentId,
            payout,
            actualReward
        );
    }

function earlyWithdraw(uint256 investmentId)
    external
    whenNotPaused
    nonReentrant
{
    Investor storage investor = investors[msg.sender];

    require(
        investmentId < investor.investments.length,
        "Invalid investment"
    );

    Investment storage inv =
        investor.investments[investmentId];
        Asset asset =
    investmentAsset[msg.sender][investmentId];
    IERC20 assetToken =
    asset == Asset.USDC ? usdc : usdt;

require(
    address(assetToken) != address(0),
    "Asset token not set"
);

    require(
        inv.active && !inv.finished,
        "Investment inactive"
    );

    require(
        block.timestamp < inv.endTime,
        "Use normal withdraw"
    );

    // ============================================================
    // EARLY WITHDRAWAL
    //
    // User receives exactly 85% of principal.
    // User receives ZERO profit.
    //
    // Everything else remains attached to this exact investment:
    //   - 15% of principal
    //   - all profit already earned
    //   - all future profit until original endTime
    //
    // At maturity the complete remaining position goes to Reserve.
    // ============================================================

    uint256 fee =
        (inv.amount * earlyWithdrawFee) / 10000;

    uint256 payout =
        inv.amount - fee;

    uint256 allocatedPrincipal =
        inv.allocatedAmount;

    uint256 unallocatedPrincipal =
        inv.amount - allocatedPrincipal;

    // ============================================================
    // UNALLOCATED PART
    // ============================================================

    uint256 unallocatedFee = 0;
    uint256 unallocatedPayout = 0;

    if (unallocatedPrincipal > 0) {

        unallocatedFee =
            (unallocatedPrincipal * earlyWithdrawFee) / 10000;

        unallocatedPayout =
            unallocatedPrincipal - unallocatedFee;


require(
    protocolBalanceByAsset[asset][Protocol.Pool] >= unallocatedPayout,
    "Insufficient Pool balance"
);

protocolBalanceByAsset[asset][Protocol.Pool] -=
    unallocatedPayout;
    }

    // ============================================================
    // PRIVATE RESERVE RECORD FOR THIS INVESTMENT
    // ============================================================

    PendingReserveFee storage pending =
        pendingReserveFees.push();

    pending.amount =
    unallocatedFee;

pending.unlockTime =
    inv.endTime;

pending.transferred =
    false;

uint256 feeId =
    pendingReserveFees.length - 1;

pendingReserveFeeAsset[feeId] =
    investmentAsset[msg.sender][investmentId];

    emit ReserveFeeLocked(
        msg.sender,
        investmentId,
        feeId,
        fee,
        inv.endTime
    );

    // Amount still required from protocol positions
    // for the user's 85% payout.
    uint256 remainingUserPayout =
        payout - unallocatedPayout;

    // ============================================================
    // PROCESS ONLY THIS INVESTMENT'S POSITIONS
    // ============================================================

    for (
        uint256 i = 0;
        i < inv.positions.length;
        i++
    ) {

        Position storage p =
            inv.positions[i];

        if (!p.active || p.shares == 0) {
            continue;
        }

        uint256 supplyBefore = totalProtocolSharesByAsset[asset][p.protocol];

        uint256 assetsBefore =
    _protocolAssets(
        p.protocol,
        investmentAsset[msg.sender][investmentId]
    );

        require(
            supplyBefore > 0 &&
            assetsBefore > 0,
            "Insufficient position liquidity"
        );

        // ========================================================
        // THIS POSITION'S PRINCIPAL SPLIT
        // ========================================================

        uint256 userPrincipal =
            (p.principal * (10000 - earlyWithdrawFee)) / 10000;

        uint256 reservePrincipal =
            p.principal - userPrincipal;

        require(
            assetsBefore >= userPrincipal,
            "Insufficient position liquidity"
        );

        // ========================================================
        // USER GETS ONLY 85% PRINCIPAL
        //
        // The protocol withdrawal is value-based.
        // We do NOT withdraw the user's "profit".
        //
        // Shares are reduced proportionally so that other
        // investments using the same protocol remain isolated.
        // ========================================================

        uint256 sharesToWithdraw =
            (userPrincipal * supplyBefore) / assetsBefore;

        if (
            sharesToWithdraw == 0 &&
            userPrincipal > 0
        ) {
            sharesToWithdraw = 1;
        }

        require(
            sharesToWithdraw < p.shares ||
            userPrincipal == assetsBefore,
            "Insufficient position liquidity"
        );

        uint256 actual =
    _withdrawFromProtocolRaw(
        p.protocol,
        userPrincipal,
        investmentAsset[msg.sender][investmentId]
    );

        require(
            actual == userPrincipal,
            "Early withdrawal amount mismatch"
        );

        _recordProtocolWithdrawal(
    p.protocol,
    userPrincipal,
    sharesToWithdraw,
    investmentAsset[msg.sender][investmentId]
);

        // ========================================================
        // EVERYTHING LEFT IN THIS POSITION BELONGS TO RESERVE
        //
        // The remaining shares represent:
        //   15% principal
        //   + already earned profit
        //   + future profit
        // ========================================================

        uint256 reserveShares =
            p.shares - sharesToWithdraw;

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

        // ========================================================
        // ACCOUNT FOR USER PAYOUT
        // ========================================================

        if (actual >= remainingUserPayout) {
            remainingUserPayout = 0;
        } else {
            remainingUserPayout -= actual;
        }

        // Close original investment position.
        p.shares = 0;
        p.principal = 0;
        p.active = false;
    }

    // ============================================================
    // USER MUST RECEIVE EXACTLY 85% OF PRINCIPAL
    // ============================================================

    require(
        remainingUserPayout == 0,
        "Insufficient investment liquidity"
    );

    // Zero reward on early withdrawal.
    
_finishInvestmentAccounting(
    investor,
    inv,
    payout,
    0,
    asset
);
    assetToken.safeTransfer(
    msg.sender,
    payout
    );

    emit EarlyWithdraw(
        msg.sender,
        investmentId,
        payout
    );
}
function setAssetAdapter(
    Asset asset,
    Protocol protocol,
    address adapter
)
    external
    onlyOwner
{
    require(asset == Asset.USDC, "Only USDC adapters");
    require(
        protocol != Protocol.Pool &&
        protocol != Protocol.Reserve,
        "Invalid protocol"
    );
    require(adapter != address(0), "Invalid adapter");

    assetAdapters[asset][protocol] =
        IProtocolAdapter(adapter);
}
function setUSDC(address token) external onlyOwner {
    require(token != address(0), "Invalid USDC token");
    usdc = IERC20(token);
}
function setVenusToken(address token) external onlyOwner {
    require(token != address(0), "Invalid Venus token");
    venusToken = token;
}

function setEarlyWithdrawFee(uint256 fee)
    external
    onlyOwner
{
    require(fee <= 3000, "Fee too high"); // максимум 30%
    earlyWithdrawFee = fee;
}

function setRewardRate(
    uint256 period,
    uint256 reward
)
    external
    onlyOwner
    validPeriod(period)
{
    rewardRate[period] = reward;

    emit RewardRateChanged(
        period,
        reward
    );
}
function setMinimumInvestment(uint256 amount)
    external
    onlyOwner
{
    require(amount > 0, "Invalid amount");
    minimumInvestment = amount;
}
function pause()
    external
    onlyOwner
{
    _pause();

    emit EmergencyPaused();
}function unpause()
    external
    onlyOwner
{
    _unpause();

    emit EmergencyUnpaused();
}
function processPendingReserveFees()
    public
    nonReentrant
{
    uint256 processed;
    Asset processedAsset;
    bool hasProcessedAsset;
    for (uint256 i = 0; i < pendingReserveFees.length; i++) {
        PendingReserveFee storage fee = pendingReserveFees[i];
        if (fee.transferred || block.timestamp < fee.unlockTime) continue;
        if (!hasProcessedAsset) {
    processedAsset = pendingReserveFeeAsset[i];
    hasProcessedAsset = true;
} else {
    require(
        pendingReserveFeeAsset[i] == processedAsset,
        "Mixed reserve assets"
    );
}

        uint256 totalReturned;
        for (uint256 j = 0; j < fee.positions.length; j++) {
           totalReturned += _withdrawPositionFull(
            fee.positions[j],
            pendingReserveFeeAsset[i]
            ); 
        }

        // fee.amount is the part that was still in Pool because it had not
        // been allocated. Position returns contain the allocated fee share
        // plus any yield earned by that fee share.
        uint256 reserveAmount = fee.amount + totalReturned;
        require(
            reserveAmount > 0,
            "Reserve fee has no liquidity"
        );
        IERC20 feeToken =
   pendingReserveFeeAsset[i] == Asset.USDC
    ? usdc
    : usdt; 

require(
    address(feeToken) != address(0),
    "Asset token not set"
);

require(
    feeToken.balanceOf(address(this)) >= reserveAmount,
    "Reserve liquidity missing"
);

        fee.transferred = true;
        processed += reserveAmount;
    }

    require(processed > 0, "No fees available");
    IERC20 processedToken =
    processedAsset == Asset.USDC ? usdc : usdt;

require(
    address(processedToken) != address(0),
    "Asset token not set"
);

processedToken.safeTransfer(
    reserveWallet,
    processed
);
    emit FeesWithdrawn(reserveWallet, processed);
}

function processReserveFees()
    external
    onlyOwner
{
    processPendingReserveFees();
}
function getInvestor(address user)
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
function migrateLegacyUSDTState()
    external
    reinitializer(2)
    onlyOwner
{
    // Старые глобальные USDT-счётчики
    // переносим в новую multi-asset бухгалтерию.
    totalDepositsByAsset[Asset.USDT] = totalDeposits;
    totalActiveDepositsByAsset[Asset.USDT] = totalActiveDeposits;

    // Старые балансы протоколов были только USDT.
    for (
        uint256 i = uint256(Protocol.Pool);
        i <= uint256(Protocol.DForce);
        i++
    ) {
        Protocol protocol = Protocol(i);

        protocolBalanceByAsset[Asset.USDT][protocol] =
            protocolBalance[protocol];

        totalProtocolSharesByAsset[Asset.USDT][protocol] =
            totalProtocolShares[protocol];
    }

    // Все существующие инвестиции старой версии
    // автоматически считаются USDT.
    //
    // В старом контракте Asset не существовал,
    // поэтому mapping имеет значение 0 по умолчанию,
    // а Asset.USDT == 0.
    //
    // Поэтому отдельно записывать каждую старую инвестицию
    // НЕ требуется.

    // Все существующие pendingReserveFees старой версии
    // также относятся к USDT.
    //
    // pendingReserveFeeAsset[...] по умолчанию == Asset.USDT,
    // потому что Asset.USDT == 0.
}
IERC20 public usdc;
mapping(address => mapping(uint256 => Asset)) private investmentAsset;
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
mapping(Asset => uint256) public totalDepositsByAsset;
mapping(Asset => uint256) public totalActiveDepositsByAsset;
mapping(Asset => mapping(Protocol => uint256)) public protocolBalanceByAsset;
mapping(Asset => mapping(Protocol => uint256))
    public totalProtocolSharesByAsset;
mapping(Asset => mapping(Protocol => IProtocolAdapter))
    public assetAdapters;
mapping(uint256 => Asset) private pendingReserveFeeAsset;    

/*
 * Reserved storage for future upgrades.
 * Do not insert variables into the existing storage layout.
 */
uint256[42] private __gap;
}