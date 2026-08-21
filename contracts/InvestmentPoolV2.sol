// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
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
contract InvestmentPoolV2 is Ownable, Pausable, ReentrancyGuard {
    /*
     * Merged candidate:
     * current InvestmentPoolV2 + proven Venus withdrawal mechanics
     * + current Aave adapter architecture.
     */
    using SafeERC20 for IERC20;

IERC20 public immutable usdt;
    
    address public constant VUSDT =
    0xfD5840Cd36d94D7229439859C0112a4185BC0255;

IVToken public constant vUSDT =
    IVToken(VUSDT);

address public reserveWallet;
IProtocolAdapter public beefyAdapter;
IProtocolAdapter public venusAdapter;
IProtocolAdapter public pancakeAdapter;
IProtocolAdapter public aaveAdapter;

uint256 public totalDeposits;
uint256 public totalInvestors;

mapping(Protocol => uint256) public protocolBalance;
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
     Aave
}

    struct Investment {
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
        uint256 period;
        uint256 reward;
        bool active;
        bool finished;
    }
    struct PendingReserveFee {
    uint256 amount;
    uint256 unlockTime;
    bool transferred;
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
    uint256 public earlyWithdrawFee = 1500; // 15%
    uint256 public minimumInvestment = 100e18;

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

    constructor(
    address usdtAddress,
    address reserveAddress
)
    Ownable(msg.sender)
{
        require(usdtAddress != address(0), "Invalid USDT");

        usdt = IERC20(usdtAddress);

require(reserveAddress != address(0), "Invalid reserve");
reserveWallet = reserveAddress;
        rewardRate[DAY] = 10;
        rewardRate[WEEK] = 80;
        rewardRate[MONTH] = 350;
        rewardRate[THREE_MONTHS] = 1200;
        rewardRate[SIX_MONTHS] = 2800;
        rewardRate[YEAR] = 7000;
    }    function deposit(
        uint256 amount,
        uint256 period
    )
        external
        whenNotPaused
        nonReentrant
        validPeriod(period)
    {
        require(amount > 0, "Amount must be greater than zero");
        if (msg.sender != owner()) {
    require(
        amount >= minimumInvestment,
        "Minimum investment is 100 USDT"
    );
        }

Investor storage investor = investors[msg.sender];

if (msg.sender != owner()) {

    for (
        uint256 i = 0;
        i < investor.investments.length;
        i++
    ) {
        Investment storage inv =
            investor.investments[i];

        require(
            !(inv.active && inv.period == period),
            "Active deposit for this period already exists"
        );
    }
}
        usdt.safeTransferFrom(
    msg.sender,
    address(this),
    amount
);

        if (!investor.exists) {
            investor.exists = true;
            totalInvestors++;
        }

        uint256 reward = (amount * rewardRate[period]) / 10000;
        // Учитываем прибыль, уже обещанную пользователям
totalPendingRewards += reward;

        investor.investments.push(
            Investment({
                amount: amount,
                startTime: block.timestamp,
                endTime: block.timestamp + period,
                period: period,
                reward: reward,
                active: true,
                finished: false
            })
        );

        investor.totalInvested += amount;
        totalDeposits += amount;
        totalActiveDeposits += amount;
        protocolBalance[Protocol.Pool] += amount;

        emit Deposited(
            msg.sender,
            investor.investments.length - 1,
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

        } else {
            revert(
                "Invalid adapter protocol"
            );
        }
    }
    function investIntoProtocol(
    Protocol protocol,
    uint256 amount
)
    external
    onlyOwner
    nonReentrant
{
    require(
        amount > 0,
        "Invalid amount"
    );

    require(
        protocol != Protocol.Pool &&
        protocol != Protocol.Reserve,
        "Invalid protocol"
    );

    require(
        protocolBalance[Protocol.Pool] >= amount,
        "Insufficient Pool balance"
    );

    IProtocolAdapter adapter;

    if (protocol == Protocol.Aave) {

        adapter = aaveAdapter;

    } else if (protocol == Protocol.Beefy) {

        adapter = beefyAdapter;

    } else if (protocol == Protocol.Pancake) {

        adapter = pancakeAdapter;

    } else if (protocol == Protocol.Venus) {

        /*
         * Venus пока работает через существующую
         * прямую vUSDT-логику.
         *
         * Не используем venusAdapter здесь,
         * пока не сделан отдельный рабочий VenusAdapter.
         */

        uint256 venusPoolBefore =
    usdt.balanceOf(address(this));

        usdt.forceApprove(
            VUSDT,
            amount
        );

        uint256 result =
            vUSDT.mint(amount);

        require(
            result == 0,
            "Venus mint failed"
        );

        uint256 venusPoolAfter =
    usdt.balanceOf(address(this));

        uint256 venusActualDeposited =
    venusPoolBefore - venusPoolAfter;

        require(
    venusActualDeposited == amount,
    "Venus deposited wrong amount"
    );

        protocolBalance[Protocol.Pool] -=
            amount;

        protocolBalance[Protocol.Venus] +=
            amount;

        return;

    } else {

        revert(
            "Invalid protocol"
        );
    }

    require(
        address(adapter) != address(0),
        "Adapter not set"
    );

    /*
     * Adapter.deposit() uses transferFrom(),
     * therefore InvestmentPool must approve it.
     */

    usdt.forceApprove(
        address(adapter),
        amount
    );

    uint256 poolBefore =
        usdt.balanceOf(address(this));

    adapter.deposit(amount);

    uint256 poolAfter =
        usdt.balanceOf(address(this));

    uint256 actualDeposited =
        poolBefore - poolAfter;

    require(
        actualDeposited == amount,
        "Adapter deposited wrong amount"
    );

    protocolBalance[Protocol.Pool] -=
        amount;

    /*
     * Do NOT invent profit here.
     *
     * Principal accounting only.
     */

    protocolBalance[protocol] +=
        amount;

    emit LiquidityInvested(
    protocol,
    amount
);

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
        Protocol protocol
    )
        internal
        returns (uint256)
    {
        if (protocol == Protocol.Venus) {
            try vUSDT.balanceOfUnderlying(address(this))
                returns (uint256 assets)
            {
                return assets;
            } catch {
                return 0;
            }
        }

        if (protocol == Protocol.Aave) {
            if (address(aaveAdapter) == address(0)) {
                return 0;
            }

            try aaveAdapter.totalAssets()
                returns (uint256 assets)
            {
                return assets;
            } catch {
                return 0;
            }
        }

        return 0;
    }

    function _withdrawFromProtocol(
        Protocol protocol,
        uint256 amount
    )
        internal
        returns (uint256 actual)
    {
        if (amount == 0) {
            return 0;
        }

        uint256 beforeBalance =
            usdt.balanceOf(address(this));

        if (protocol == Protocol.Venus) {
            uint256 available =
                _protocolAvailableAssets(Protocol.Venus);

            uint256 request =
                available < amount
                ? available
                : amount;

            if (request == 0) {
                return 0;
            }

            /*
             * Use the proven Venus guard from the old working
             * contract.  Do not call redeemUnderlying() when the
             * requested underlying amount rounds to zero vUSDT.
             */
            uint256 exchangeRate =
                vUSDT.exchangeRateStored();

            if (exchangeRate == 0) {
                return 0;
            }

            uint256 redeemTokens =
                (request * 1e18) /
                exchangeRate;

            if (redeemTokens == 0) {
                return 0;
            }

            try vUSDT.redeemUnderlying(
                request
            )
                returns (uint256 result)
            {
                if (result != 0) {
                    return 0;
                }
            } catch {
                return 0;
            }

        } else if (protocol == Protocol.Aave) {
            if (address(aaveAdapter) == address(0)) {
                return 0;
            }

            uint256 available =
                _protocolAvailableAssets(Protocol.Aave);

            uint256 request =
                available < amount
                ? available
                : amount;

            if (request == 0) {
                return 0;
            }

            try aaveAdapter.withdraw(request)
                returns (uint256)
            {
            } catch {
                return 0;
            }

        } else {
            return 0;
        }

        uint256 afterBalance =
            usdt.balanceOf(address(this));

        if (afterBalance <= beforeBalance) {
            return 0;
        }

        return afterBalance - beforeBalance;
    }

    function _accountRecoveredLiquidity(
        Protocol protocol,
        uint256 amount
    )
        internal
    {
        if (amount == 0) {
            return;
        }

        uint256 recordedPrincipal =
            protocolBalance[protocol];

        uint256 principalReturned =
            amount < recordedPrincipal
            ? amount
            : recordedPrincipal;

        if (principalReturned > 0) {
            protocolBalance[protocol] -=
                principalReturned;
        }

        /*
         * Any USDT that physically returned to Pool is real Pool
         * liquidity. We do not invent protocol profit here.
         */
        protocolBalance[Protocol.Pool] +=
            amount;
    }

    function _recoverLiquidity(
        uint256 required
    )
        internal
        returns (uint256 recovered)
    {
        if (required == 0) {
            return 0;
        }

        /*
         * Only Venus and Aave are currently real/usable.
         * This is not a business priority order; it is simply the
         * current list of implemented recovery sources.
         */
        Protocol[2] memory protocols = [
            Protocol.Venus,
            Protocol.Aave
        ];

        for (uint256 i = 0; i < protocols.length; i++) {
            if (recovered >= required) {
                break;
            }

            Protocol protocol =
                protocols[i];

            uint256 available =
                _protocolAvailableAssets(protocol);

            if (available == 0) {
                continue;
            }

            uint256 remaining =
                required - recovered;

            uint256 request =
                available < remaining
                ? available
                : remaining;

            uint256 actual =
                _withdrawFromProtocol(
                    protocol,
                    request
                );

            if (actual == 0) {
                continue;
            }

            _accountRecoveredLiquidity(
                protocol,
                actual
            );

            recovered += actual;
        }

        return recovered;
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

    function _ensurePrincipalLiquidity(
        uint256 principal
    )
        internal
    {
        uint256 poolBalance =
            usdt.balanceOf(address(this));

        if (poolBalance < principal) {
            _recoverLiquidity(
                principal - poolBalance
            );
        }

        require(
            usdt.balanceOf(address(this)) >= principal,
            "Insufficient principal liquidity"
        );
    }

    function _venusRealProfit()
        internal
        returns (uint256 profit)
    {
        uint256 assets =
            vUSDT.balanceOfUnderlying(
                address(this)
            );

        uint256 principal =
            protocolBalance[Protocol.Venus];

        if (assets > principal) {
            profit =
                assets - principal;
        }

        return profit;
    }

    function _aaveRealProfit()
        internal
         view
        returns (uint256 profit)
    {
        IProtocolAdapter adapter =
            aaveAdapter;

        if (address(adapter) == address(0)) {
            return 0;
        }

        uint256 assets;

        try adapter.totalAssets()
            returns (uint256 value)
        {
            assets = value;
        } catch {
            return 0;
        }

        uint256 principal =
            protocolBalance[Protocol.Aave];

        if (assets > principal) {
            profit =
                assets - principal;
        }

        return profit;
    }

    function _poolRealProfit()
        internal
        view
        returns (uint256 profit)
    {
        uint256 activePrincipal =
            totalActiveDeposits;

        uint256 poolAssets =
            usdt.balanceOf(address(this));

        if (poolAssets > activePrincipal) {
            profit =
                poolAssets - activePrincipal;
        }

        return profit;
    }

    function _realProtocolProfit()
        internal
        returns (uint256 profit)
    {
        profit +=
            _venusRealProfit();

        profit +=
            _aaveRealProfit();

        profit +=
            _poolRealProfit();

        return profit;
    }

    function _recoverWithdrawalLiquidity(
        uint256 payout,
        uint256 reserveProfit
    )
        internal
        returns (uint256 recovered)
    {
        uint256 available =
            usdt.balanceOf(address(this));

        uint256 required =
            payout + reserveProfit;

        if (available >= required) {
            return 0;
        }

        return _recoverLiquidity(
            required - available
        );
    }

    function _finishWithdrawalAccounting(
        Investor storage investor,
        Investment storage inv,
        uint256 actualPayout,
        uint256 actualReward
    )
        internal
    {
        uint256 poolRecorded =
            protocolBalance[Protocol.Pool];

        if (poolRecorded >= actualPayout) {
            protocolBalance[Protocol.Pool] -=
                actualPayout;
        } else {
            protocolBalance[Protocol.Pool] = 0;
        }

        investor.totalWithdrawn +=
            actualPayout;

        investor.totalReward +=
            actualReward;

        totalActiveDeposits -=
            inv.amount;

        if (totalPendingRewards >= inv.reward) {
            totalPendingRewards -=
                inv.reward;
        } else {
            totalPendingRewards = 0;
        }

        inv.active = false;
        inv.finished = true;
    }

    function _sendReserveProfit(
        uint256 reserveProfit
    )
        internal
    {
        if (reserveProfit == 0) {
            return;
        }

        require(
            usdt.balanceOf(address(this)) >=
            reserveProfit,
            "Insufficient reserve liquidity"
        );

        usdt.safeTransfer(
            reserveWallet,
            reserveProfit
        );

        emit ProfitHarvested(
            Protocol.Pool,
            reserveProfit
        );
    }

    function withdraw(uint256 investmentId)
        external
        whenNotPaused
        nonReentrant
    {
        Investor storage investor =
            investors[msg.sender];

        require(
            investmentId < investor.investments.length,
            "Invalid investment"
        );

        Investment storage inv =
            investor.investments[investmentId];

        require(
            inv.active,
            "Investment inactive"
        );

        require(
            !inv.finished,
            "Already withdrawn"
        );

        require(
            block.timestamp >= inv.endTime,
            "Investment not finished"
        );

        uint256 principal =
            inv.amount;

        uint256 promisedReward =
            inv.reward;

        /*
         * Measure real profit BEFORE moving liquidity.
         * This is the proven Venus behavior: real protocol
         * assets minus recorded principal.
         */
        uint256 realProfit =
            _realProtocolProfit();

        uint256 actualReward =
            realProfit < promisedReward
            ? realProfit
            : promisedReward;

        uint256 reserveProfit = 0;

        if (realProfit > promisedReward) {
            reserveProfit =
                realProfit -
                promisedReward;
        }

        uint256 payout =
            principal +
            actualReward;

        /*
         * Principal + user's real reward + Reserve surplus must
         * become real USDT in the Pool before transfers.
         *
         * Recovery uses the actual Venus/Aave positions.  If the
         * real profit is insufficient, Reserve receives zero.
         */
        _recoverWithdrawalLiquidity(
            payout,
            reserveProfit
        );

        require(
            usdt.balanceOf(address(this)) >= payout,
            "Insufficient real liquidity"
        );

        _finishWithdrawalAccounting(
            investor,
            inv,
            payout,
            actualReward
        );

        /*
         * User is paid first.
         */
        usdt.safeTransfer(
            msg.sender,
            payout
        );

        /*
         * Only genuine surplus above this investment's promised
         * reward goes to Reserve.  Reserve never covers a shortfall.
         */
        _sendReserveProfit(
            reserveProfit
        );

        emit Withdrawn(
            msg.sender,
            investmentId,
            inv.amount,
            actualReward
        );
    }


    function earlyWithdraw(uint256 investmentId)
        external
        whenNotPaused
        nonReentrant
    {
        Investor storage investor =
            investors[msg.sender];

        require(
            investmentId < investor.investments.length,
            "Invalid investment"
        );

        Investment storage inv =
            investor.investments[investmentId];

        require(
            inv.active,
            "Investment inactive"
        );

        require(
            !inv.finished,
            "Already withdrawn"
        );

        require(
            block.timestamp < inv.endTime,
            "Use normal withdraw"
        );

        uint256 fee =
            (inv.amount * earlyWithdrawFee) /
            10000;

        uint256 payout =
            inv.amount - fee;

        /*
         * Early withdrawal uses the same real-liquidity recovery.
         * The fee stays locked until the original end time.
         */
        uint256 realBalance =
            usdt.balanceOf(address(this));

        if (realBalance < payout) {
            _recoverLiquidity(
                payout - realBalance
            );
        }

        require(
            usdt.balanceOf(address(this)) >= payout,
            "Insufficient real liquidity"
        );

        inv.active = false;
        inv.finished = true;

        pendingReserveFees.push(
            PendingReserveFee({
                amount: fee,
                unlockTime: inv.endTime,
                transferred: false
            })
        );

        uint256 poolRecorded =
            protocolBalance[Protocol.Pool];

        if (poolRecorded >= payout) {
            protocolBalance[Protocol.Pool] -=
                payout;
        } else {
            protocolBalance[Protocol.Pool] = 0;
        }

        totalActiveDeposits -=
            inv.amount;

        if (totalPendingRewards >= inv.reward) {
            totalPendingRewards -=
                inv.reward;
        } else {
            totalPendingRewards = 0;
        }

        investor.totalWithdrawn +=
            payout;

        usdt.safeTransfer(
            msg.sender,
            payout
        );

        emit EarlyWithdraw(
            msg.sender,
            investmentId,
            payout
        );
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
{
    uint256 totalAmount = 0;
    uint256 length = pendingReserveFees.length;

    for (uint256 i = 0; i < length; i++) {

        PendingReserveFee storage fee = pendingReserveFees[i];

        if (
            !fee.transferred &&
            block.timestamp >= fee.unlockTime
        ) {
            totalAmount += fee.amount;
            fee.transferred = true;
        }
    }
    require(totalAmount > 0, "No fees available");
require(
    protocolBalance[Protocol.Pool] >= totalAmount,
    "Insufficient pool balance"
);

protocolBalance[Protocol.Pool] -= totalAmount;

usdt.safeTransfer(
    reserveWallet,
    totalAmount
);

emit FeesWithdrawn(
    reserveWallet,
    totalAmount
);
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
}