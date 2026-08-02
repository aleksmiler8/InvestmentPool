// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract InvestmentPoolV2 is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdt;

address public reserveWallet;

uint256 public totalDeposits;
uint256 public totalInvestors;

mapping(Protocol => uint256) public protocolBalance;

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
    Pancake
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
event LiquidityReturned(
    Protocol indexed from,
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

for (uint256 i = 0; i < investor.investments.length; i++) {
    Investment storage inv = investor.investments[i];

    require(
        !(inv.active && inv.period == period),
        "Active deposit for this period already exists"
    );
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
        protocolBalance[Protocol.Pool] += amount;

        emit Deposited(
            msg.sender,
            investor.investments.length - 1,
            amount,
            period
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
    }function withdraw(uint256 investmentId)
    external
    whenNotPaused
    nonReentrant
{
    Investor storage investor = investors[msg.sender];

    require(
        investmentId < investor.investments.length,
        "Invalid investment"
    );

    Investment storage inv = investor.investments[investmentId];

    require(inv.active, "Investment inactive");
    require(!inv.finished, "Already withdrawn");
    require(block.timestamp >= inv.endTime, "Investment not finished");

    inv.active = false;
    inv.finished = true;

    uint256 payout = inv.amount + inv.reward;

require(
    usdt.balanceOf(address(this)) >= payout,
    "Insufficient pool liquidity"
);

if (protocolBalance[Protocol.Pool] < payout) {
    _returnLiquidityToPool(
        payout - protocolBalance[Protocol.Pool]
    );
}

require(
    protocolBalance[Protocol.Pool] >= payout,
    "Insufficient Pool balance"
);

protocolBalance[Protocol.Pool] -= payout;

investor.totalWithdrawn += payout;
investor.totalReward += inv.reward;

usdt.safeTransfer(msg.sender, payout);
    

    emit Withdrawn(
        msg.sender,
        investmentId,
        inv.amount,
        inv.reward
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

    Investment storage inv = investor.investments[investmentId];

    require(inv.active, "Investment inactive");
    require(!inv.finished, "Already withdrawn");
    require(block.timestamp < inv.endTime, "Use normal withdraw");

    inv.active = false;
    inv.finished = true;

    uint256 fee = (inv.amount * earlyWithdrawFee) / 10000;
    uint256 payout = inv.amount - fee;
    pendingReserveFees.push(
    PendingReserveFee({
        amount: fee,
        unlockTime: inv.endTime,
        transferred: false
    })
);
    require(
    usdt.balanceOf(address(this)) >= payout,
    "Insufficient pool liquidity"
);

if (protocolBalance[Protocol.Pool] < payout) {
    _returnLiquidityToPool(
        payout - protocolBalance[Protocol.Pool]
    );
}

require(
    protocolBalance[Protocol.Pool] >= payout,
    "Insufficient Pool balance"
);

protocolBalance[Protocol.Pool] -= payout;

investor.totalWithdrawn += payout;

usdt.safeTransfer(msg.sender, payout);
    

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
function allocateToProtocol(
    Protocol protocol,
    uint256 amount
)
    external
    onlyOwner
{
    require(amount > 0, "Invalid amount");

    require(
        protocolBalance[Protocol.Pool] >= amount,
        "Insufficient pool balance"
    );

    require(protocol != Protocol.Pool, "Cannot allocate to Pool");

    protocolBalance[Protocol.Pool] -= amount;
    protocolBalance[protocol] += amount;
}
    
function transferBetweenProtocols(
    Protocol from,
    Protocol to,
    uint256 amount
)
    external
    onlyOwner
{
    require(from != to, "Same protocol");
    require(amount > 0, "Invalid amount");

    require(from != Protocol.Pool, "Invalid source protocol");
require(to != Protocol.Pool, "Invalid destination protocol");

require(
    protocolBalance[from] >= amount,
    "Insufficient protocol balance"
);

protocolBalance[from] -= amount;
protocolBalance[to] += amount;
}
function returnToPool(
    Protocol from,
    uint256 amount
)
    external
    onlyOwner
{
    require(from != Protocol.Pool, "Invalid source");
    require(amount > 0, "Invalid amount");

    require(
        protocolBalance[from] >= amount,
        "Insufficient balance"
    );

    protocolBalance[from] -= amount;
    protocolBalance[Protocol.Pool] += amount;
}
function _returnLiquidityToPool(uint256 amount)
    internal
{
    require(amount > 0, "Invalid amount");

    uint256 remaining = amount;

    Protocol[3] memory sources = [
        Protocol.Beefy,
        Protocol.Venus,
        Protocol.Pancake
    ];

    for (uint256 i = 0; i < sources.length && remaining > 0; i++) {
        uint256 balance = protocolBalance[sources[i]];

        if (balance == 0) {
            continue;
        }

        uint256 transferAmount = balance >= remaining
            ? remaining
            : balance;

        protocolBalance[sources[i]] -= transferAmount;
        protocolBalance[Protocol.Pool] += transferAmount;

        emit LiquidityReturned(
            sources[i],
            transferAmount
        );

        remaining -= transferAmount;
    }

    require(
        remaining == 0,
        "Insufficient total protocol liquidity"
    );
}
function returnLiquidityToPool(uint256 amount)
    external
    onlyOwner
{
    _returnLiquidityToPool(amount);
}

function setReserveWallet(address newWallet)
    external
    onlyOwner
{
    require(newWallet != address(0), "Invalid wallet");

    reserveWallet = newWallet;
}
}