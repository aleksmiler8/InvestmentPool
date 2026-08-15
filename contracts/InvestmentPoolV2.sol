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

    /*
     * ============================================================
     * 1. REAL VENUS STATE
     * ============================================================
     */

    uint256 venusUnderlying =
        vUSDT.balanceOfUnderlying(
            address(this)
        );

    uint256 venusPrincipal =
        protocolBalance[Protocol.Venus];

    uint256 venusProfit = 0;

    if (
        venusUnderlying >
        venusPrincipal
    ) {
        venusProfit =
            venusUnderlying -
            venusPrincipal;
    }

    /*
     * ============================================================
     * 2. REAL USER PROFIT
     * ============================================================
     *
     * User receives:
     *
     * min(real protocol profit, promised reward)
     *
     * Reserve receives excess real profit.
     */

    uint256 investorProfit;

    if (
        venusProfit <
        inv.reward
    ) {
        investorProfit =
            venusProfit;
    } else {
        investorProfit =
            inv.reward;
    }

    uint256 payout =
        inv.amount +
        investorProfit;

    /*
     * ============================================================
     * 3. REAL EXCESS PROFIT
     * ============================================================
     */

    uint256 reserveProfit = 0;

    if (
        venusProfit >
        inv.reward
    ) {
        reserveProfit =
            venusProfit -
            inv.reward;
    }

    /*
     * ============================================================
     * 4. HOW MUCH MUST COME FROM VENUS?
     * ============================================================
     */

    uint256 poolBalance =
        protocolBalance[Protocol.Pool];

    uint256 neededFromVenus = 0;

    if (
        poolBalance <
        payout
    ) {
        neededFromVenus =
            payout -
            poolBalance;
    }

    /*
     * Reserve profit must also become REAL USDT.
     *
     * Therefore it is included in the real Venus withdrawal.
     */

    uint256 totalVenusRedeem =
        neededFromVenus +
        reserveProfit;

    /*
     * ============================================================
     * 5. REAL VENUS WITHDRAW
     * ============================================================
     *
     * IMPORTANT:
     *
     * We NEVER call redeemUnderlying() for an amount whose
     * corresponding vToken amount rounds to zero.
     *
     * This prevents:
     *
     *     redeemTokens zero
     */

    uint256 actualVenusReturned = 0;

    if (
        totalVenusRedeem >
        0
    ) {

        require(
            venusUnderlying >=
                totalVenusRedeem,
            "Insufficient Venus liquidity"
        );

        uint256 exchangeRate =
            vUSDT.exchangeRateStored();

        require(
            exchangeRate > 0,
            "Invalid Venus exchange rate"
        );

        uint256 redeemTokens =
            (
                totalVenusRedeem *
                1e18
            ) /
            exchangeRate;

        /*
         * Microscopic amount.
         *
         * Do NOT call Venus.
         */
        require(
            redeemTokens > 0,
            "Venus amount too small"
        );

        uint256 usdtBefore =
            usdt.balanceOf(
                address(this)
            );

        uint256 result =
            vUSDT.redeemUnderlying(
                totalVenusRedeem
            );

        require(
            result == 0,
            "Venus redeem failed"
        );

        uint256 usdtAfter =
            usdt.balanceOf(
                address(this)
            );

        actualVenusReturned =
            usdtAfter -
            usdtBefore;

        require(
            actualVenusReturned > 0,
            "Venus returned zero"
        );

        /*
         * ========================================================
         * 6. UPDATE VENUS ACCOUNTING
         * ========================================================
         *
         * Only principal leaves Venus accounting.
         *
         * Profit is NOT principal.
         */

        uint256 principalReturned;

        if (
            totalVenusRedeem <=
            venusPrincipal
        ) {
            principalReturned =
                totalVenusRedeem;
        } else {
            principalReturned =
                venusPrincipal;
        }

        if (
            principalReturned > 0
        ) {
            protocolBalance[
                Protocol.Venus
            ] -= principalReturned;
        }

        /*
         * Only the amount required for the user's payout
         * becomes Pool liquidity.
         *
         * Reserve profit is handled separately below.
         */

        if (
            neededFromVenus > 0
        ) {
            protocolBalance[
                Protocol.Pool
            ] += neededFromVenus;
        }

        poolBalance =
            protocolBalance[
                Protocol.Pool
            ];
    }

    /*
     * ============================================================
     * 7. REAL POOL LIQUIDITY CHECK
     * ============================================================
     */

    require(
        poolBalance >=
            payout,
        "Insufficient Pool balance"
    );

    require(
        usdt.balanceOf(
            address(this)
        ) >= payout,
        "Insufficient real liquidity"
    );

    /*
     * ============================================================
     * 8. ACCOUNTING
     * ============================================================
     */

    protocolBalance[
        Protocol.Pool
    ] -= payout;

    investor.totalWithdrawn +=
        payout;

    investor.totalReward +=
        investorProfit;

    totalActiveDeposits -=
        inv.amount;

    if (
        totalPendingRewards >=
        inv.reward
    ) {
        totalPendingRewards -=
            inv.reward;
    } else {
        totalPendingRewards = 0;
    }

    inv.active = false;
    inv.finished = true;

    /*
     * ============================================================
     * 9. USER GETS REAL USDT
     * ============================================================
     */

    usdt.safeTransfer(
        msg.sender,
        payout
    );

    /*
     * ============================================================
     * 10. REAL EXCESS PROFIT -> REAL RESERVE
     * ============================================================
     *
     * IMPORTANT:
     *
     * We do NOT do:
     *
     * protocolBalance[Protocol.Reserve] += reserveProfit;
     *
     * Instead the actual USDT is transferred.
     */

    if (
        reserveProfit > 0
    ) {

        require(
            actualVenusReturned >=
                neededFromVenus +
                reserveProfit,
            "Insufficient harvested profit"
        );

        /*
         * The payout was already sent to the user.
         *
         * The remaining real profit belongs to Reserve.
         */

        uint256 reserveAvailable =
            usdt.balanceOf(
                address(this)
            );

        require(
            reserveAvailable >=
                reserveProfit,
            "Insufficient Reserve liquidity"
        );

        usdt.safeTransfer(
            reserveWallet,
            reserveProfit
        );

        emit ProfitHarvested(
            Protocol.Venus,
            reserveProfit
        );
    }

    emit Withdrawn(
        msg.sender,
        investmentId,
        inv.amount,
        investorProfit
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
        (inv.amount * earlyWithdrawFee) / 10000;

    uint256 payout =
        inv.amount - fee;

    /*
     * ============================================================
     * 1. CLOSE INVESTMENT
     * ============================================================
     */

    inv.active = false;
    inv.finished = true;

    /*
     * ============================================================
     * 2. RESERVE FEE
     * ============================================================
     *
     * The 15% fee becomes available to Reserve only after
     * the original investment end time.
     */

    pendingReserveFees.push(
        PendingReserveFee({
            amount: fee,
            unlockTime: inv.endTime,
            transferred: false
        })
    );

    /*
     * ============================================================
     * 3. FIND REAL LIQUIDITY
     * ============================================================
     *
     * First use Pool liquidity.
     *
     * If Pool does not have enough USDT, try to recover
     * the required principal from Venus.
     *
     * Beefy / Pancake / Aave will be handled by the real
     * adapters added later. We DO NOT fake their balances here.
     */

    uint256 poolBalance =
        protocolBalance[Protocol.Pool];

    if (poolBalance < payout) {

        uint256 needed =
            payout - poolBalance;

        uint256 venusUnderlying =
            vUSDT.balanceOfUnderlying(
                address(this)
            );

        if (venusUnderlying > 0) {

            uint256 redeemAmount;

            if (venusUnderlying >= needed) {
                redeemAmount = needed;
            } else {
                redeemAmount = venusUnderlying;
            }

            /*
             * Avoid Venus "redeemTokens zero".
             */

            uint256 exchangeRate =
                vUSDT.exchangeRateStored();

            require(
                exchangeRate > 0,
                "Invalid Venus exchange rate"
            );

            uint256 redeemTokens =
                (redeemAmount * 1e18) /
                exchangeRate;

            if (redeemTokens > 0) {

                uint256 result =
                    vUSDT.redeemUnderlying(
                        redeemAmount
                    );

                require(
                    result == 0,
                    "Venus redeem failed"
                );

                uint256 venusPrincipal =
                    protocolBalance[Protocol.Venus];

                uint256 principalReturned;

                if (
                    redeemAmount <=
                    venusPrincipal
                ) {
                    principalReturned =
                        redeemAmount;
                } else {
                    principalReturned =
                        venusPrincipal;
                }

                if (principalReturned > 0) {
                    protocolBalance[Protocol.Venus] -=
                        principalReturned;
                }

                protocolBalance[Protocol.Pool] +=
                    redeemAmount;
            }
        }
    }

    /*
     * ============================================================
     * 4. FINAL LIQUIDITY CHECK
     * ============================================================
     */

    require(
        protocolBalance[Protocol.Pool] >= payout,
        "Insufficient Pool liquidity"
    );

    require(
        usdt.balanceOf(address(this)) >= payout,
        "Insufficient real liquidity"
    );

    /*
     * ============================================================
     * 5. ACCOUNTING
     * ============================================================
     */

    protocolBalance[Protocol.Pool] -=
        payout;

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

    /*
     * ============================================================
     * 6. REAL USDT -> USER
     * ============================================================
     */

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