// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IPancakeRouter02 {

    function WETH() external pure returns (address);

function getAmountsOut(
    uint amountIn,
    address[] calldata path
)
    external
    view
    returns (uint[] memory amounts);
    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable;

    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external;

    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external;
}

contract InvestmentPoolSwap is
    Ownable,
    Pausable,
    ReentrancyGuard
{
    using SafeERC20 for IERC20;

    // ---------------------------------------------------------
    // CONSTANTS
    // ---------------------------------------------------------

    uint256 public constant BPS = 10000;

    uint256 public constant DEFAULT_SWAP_FEE = 100; // 1%

    uint256 public constant MAX_SWAP_FEE = 500; // 5%

    // ---------------------------------------------------------
    // CORE
    // ---------------------------------------------------------

    IPancakeRouter02 public immutable router;

    IERC20 public immutable usdt;


    address public immutable wbnb;

    address public reserveWallet;

    uint256 public swapFeeBps = DEFAULT_SWAP_FEE;

    // ---------------------------------------------------------
    // WHITELIST
    // ---------------------------------------------------------

    mapping(address => bool) public supportedTokens;

    // ---------------------------------------------------------
    // STATISTICS
    // ---------------------------------------------------------

    uint256 public totalSwapVolume;

    uint256 public totalFeesCollected;

    uint256 public totalSwapCount;

    mapping(address => uint256) public userSwapVolume;

    mapping(address => uint256) public userFeesPaid;

    mapping(address => uint256) public userSwapCount;

    // ---------------------------------------------------------
    // EVENTS
    // ---------------------------------------------------------

    event SwapExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 fee,
        uint256 timestamp
    );

    event ReserveWalletChanged(
        address indexed oldWallet,
        address indexed newWallet
    );

    event SwapFeeChanged(
        uint256 oldFee,
        uint256 newFee
    );

    event SupportedTokenAdded(
        address indexed token
    );

    event SupportedTokenRemoved(
        address indexed token
    );

    // ---------------------------------------------------------
    // CONSTRUCTOR
    // ---------------------------------------------------------

    constructor(
        address routerAddress,
        address usdtAddress,
        address reserveAddress,
        address ownerAddress
    )
        Ownable(ownerAddress)
    {
        require(routerAddress != address(0), "Invalid router");
        require(usdtAddress != address(0), "Invalid USDT");
        require(reserveAddress != address(0), "Invalid reserve");

        router = IPancakeRouter02(routerAddress);

        usdt = IERC20(usdtAddress);

        wbnb = router.WETH();

        reserveWallet = reserveAddress;

        supportedTokens[wbnb] = true;

        supportedTokens[usdtAddress] = true;
    }

    receive() external payable {}

    // ---------------------------------------------------------
    // INTERNAL HELPERS
    // ---------------------------------------------------------

    function _calculateFee(
        uint256 amount
    )
        internal
        view
        returns (uint256)
    {
        return (amount * swapFeeBps) / BPS;
    }

    function _updateStatistics(
        address user,
        uint256 volume,
        uint256 fee
    )
        internal
    {
        totalSwapVolume += volume;
        totalFeesCollected += fee;
        totalSwapCount++;

        userSwapVolume[user] += volume;
        userFeesPaid[user] += fee;
        userSwapCount[user]++;
    }

    function _validatePath(
        address[] calldata path
    )
        internal
        view
    {
        require(path.length >= 2, "Invalid path");

        for (uint256 i = 0; i < path.length; i++) {
            require(
                supportedTokens[path[i]],
                "Unsupported token"
            );
        }
    }
        // ---------------------------------------------------------
    // OWNER FUNCTIONS
    // ---------------------------------------------------------

    function pause()
        external
        onlyOwner
    {
        _pause();
    }

    function unpause()
        external
        onlyOwner
    {
        _unpause();
    }

    function setSwapFee(
        uint256 newFee
    )
        external
        onlyOwner
    {
        require(newFee <= MAX_SWAP_FEE, "Fee too high");

        uint256 oldFee = swapFeeBps;

        swapFeeBps = newFee;

        emit SwapFeeChanged(oldFee, newFee);
    }

    function setReserveWallet(
        address newWallet
    )
        external
        onlyOwner
    {
        require(newWallet != address(0), "Zero address");

        address oldWallet = reserveWallet;

        reserveWallet = newWallet;

        emit ReserveWalletChanged(
            oldWallet,
            newWallet
        );
    }

    function addSupportedToken(
        address token
    )
        external
        onlyOwner
    {
        require(token != address(0), "Zero address");
        require(
    !supportedTokens[token],
    "Already supported"
);

        supportedTokens[token] = true;

        emit SupportedTokenAdded(token);
    }

    function removeSupportedToken(
        address token
    )
        external
        onlyOwner
    {
        require(
            token != wbnb,
            "Cannot remove WBNB"
        );

        require(
            token != address(usdt),
            "Cannot remove USDT"
        );
        require(
    supportedTokens[token],
    "Token not supported"
);

        supportedTokens[token] = false;

        emit SupportedTokenRemoved(token);
    }

    // ---------------------------------------------------------
    // VIEW FUNCTIONS
    // ---------------------------------------------------------

    function isSupportedToken(
        address token
    )
        external
        view
        returns (bool)
    {
        return supportedTokens[token];
    }

    function getFeeForAmount(
        uint256 amount
    )
        external
        view
        returns (uint256)
    {
        return _calculateFee(amount);
    }

    function getUserStatistics(
        address user
    )
        external
        view
        returns (
            uint256 volume,
            uint256 fees,
            uint256 swaps
        )
    {
        volume = userSwapVolume[user];
        fees = userFeesPaid[user];
        swaps = userSwapCount[user];
    }

    function getGlobalStatistics()
        external
        view
        returns (
            uint256 volume,
            uint256 fees,
            uint256 swaps
        )
    {
        volume = totalSwapVolume;
        fees = totalFeesCollected;
        swaps = totalSwapCount;
    }
    function getAmountsOut(
    uint256 amountIn,
    address[] calldata path
)
    external
    view
    returns (uint256[] memory)
{
    return router.getAmountsOut(amountIn, path);
}

    // ---------------------------------------------------------
    // BNB -> TOKEN
    // ---------------------------------------------------------
        function swapBNBToToken(
        uint256 amountOutMin,
        address[] calldata path
    )
        external
        payable
        nonReentrant
        whenNotPaused
    {
        require(msg.value > 0, "Zero amount");

        _validatePath(path);

        require(
            path[0] == wbnb,
            "Path must start with WBNB"
        );

        uint256 fee = _calculateFee(msg.value);

        uint256 swapAmount = msg.value - fee;

        (bool sent, ) = payable(reserveWallet).call{value: fee}("");

        require(sent, "Fee transfer failed");

        router.swapExactETHForTokensSupportingFeeOnTransferTokens{
            value: swapAmount
        }(
            amountOutMin,
            path,
            msg.sender,
            block.timestamp
        );

        _updateStatistics(
            msg.sender,
            msg.value,
            fee
        );

        emit SwapExecuted(
            msg.sender,
            address(0),
            path[path.length - 1],
            msg.value,
            fee,
            block.timestamp
        );
    }

    // ---------------------------------------------------------
    // TOKEN -> BNB
    // ---------------------------------------------------------

    function swapTokenToBNB(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path
    )
        external
        nonReentrant
        whenNotPaused
    {
        require(amountIn > 0, "Zero amount");

        _validatePath(path);

        require(
            path[path.length - 1] == wbnb,
            "Path must end with WBNB"
        );

        IERC20 tokenIn = IERC20(path[0]);

        tokenIn.safeTransferFrom(
            msg.sender,
            address(this),
            amountIn
        );

        uint256 fee = _calculateFee(amountIn);

        uint256 swapAmount = amountIn - fee;

        tokenIn.safeTransfer(
            reserveWallet,
            fee
        );

        tokenIn.forceApprove(
            address(router),
            0
        );

        tokenIn.forceApprove(
            address(router),
            swapAmount
        );

        router.swapExactTokensForETHSupportingFeeOnTransferTokens(
            swapAmount,
            amountOutMin,
            path,
            msg.sender,
            block.timestamp
        );

        _updateStatistics(
            msg.sender,
            amountIn,
            fee
        );

        emit SwapExecuted(
            msg.sender,
            path[0],
            address(0),
            amountIn,
            fee,
            block.timestamp
        );
    }

    // ---------------------------------------------------------
    // TOKEN -> TOKEN
    // ---------------------------------------------------------
        function swapTokenToToken(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path
    )
        external
        nonReentrant
        whenNotPaused
    {
        require(amountIn > 0, "Zero amount");

        _validatePath(path);

        require(
            path.length >= 2,
            "Invalid path"
        );

        IERC20 tokenIn = IERC20(path[0]);

        tokenIn.safeTransferFrom(
            msg.sender,
            address(this),
            amountIn
        );

        uint256 fee = _calculateFee(amountIn);

        uint256 swapAmount = amountIn - fee;

        tokenIn.safeTransfer(
            reserveWallet,
            fee
        );

        tokenIn.forceApprove(
            address(router),
            0
        );

        tokenIn.forceApprove(
            address(router),
            swapAmount
        );

        router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
            swapAmount,
            amountOutMin,
            path,
            msg.sender,
            block.timestamp
        );

        _updateStatistics(
            msg.sender,
            amountIn,
            fee
        );

        emit SwapExecuted(
            msg.sender,
            path[0],
            path[path.length - 1],
            amountIn,
            fee,
            block.timestamp
        );
    }

    // ---------------------------------------------------------
    // EMERGENCY
    // ---------------------------------------------------------

    function emergencyWithdrawToken(
        address token,
        uint256 amount
    )
        external
        onlyOwner
    {
        IERC20(token).safeTransfer(
            owner(),
            amount
        );
    }

    function emergencyWithdrawBNB(
        uint256 amount
    )
        external
        onlyOwner
    {
        payable(owner()).transfer(amount);
    }

    // ---------------------------------------------------------
    // RECEIVE
    // ---------------------------------------------------------

    fallback() external payable {}

}