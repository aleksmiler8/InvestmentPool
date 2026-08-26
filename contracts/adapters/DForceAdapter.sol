// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);

    function transfer(
        address to,
        uint256 amount
    ) external returns (bool);

    function transferFrom(
    address from,
    address to,
    uint256 amount
) external returns (bool);

    function approve(
        address spender,
        uint256 amount
    ) external returns (bool);
}

interface IProtocolAdapter {
    function deposit(uint256 amount) external;

    function withdraw(uint256 amount)
        external
        returns (uint256);

    function totalAssets()
        external
        view
        returns (uint256);
}

interface IDForceIToken {
    function mint(
        address recipient,
        uint256 mintAmount
    ) external;

    function redeemUnderlying(
        address from,
        uint256 redeemAmount
    ) external;

    function exchangeRateStored()
        external
        view
        returns (uint256);

    function balanceOf(address account)
        external
        view
        returns (uint256);
}

contract DForceAdapter is IProtocolAdapter {

    IERC20 public immutable usdt;

    IDForceIToken public immutable iUSDT;

    address public immutable pool;

    uint256 private constant BASE = 1e18;

    modifier onlyPool() {
        require(
            msg.sender == pool,
            "DForceAdapter: only pool"
        );
        _;
    }

    constructor(
        address _usdt,
        address _iUSDT,
        address _pool
    ) {
        require(
            _usdt != address(0),
            "DForceAdapter: zero USDT"
        );

        require(
            _iUSDT != address(0),
            "DForceAdapter: zero iUSDT"
        );

        require(
            _pool != address(0),
            "DForceAdapter: zero pool"
        );

        usdt = IERC20(_usdt);
        iUSDT = IDForceIToken(_iUSDT);
        pool = _pool;

        require(
            usdt.approve(
                _iUSDT,
                type(uint256).max
            ),
            "DForceAdapter: approve failed"
        );
    }

    function deposit(
        uint256 amount
    )
        external
        override
        onlyPool
    {
        require(
            amount > 0,
            "DForceAdapter: zero amount"
        );

        uint256 beforeBalance =
            usdt.balanceOf(address(this));

        require(
            usdt.transferFrom(
                msg.sender,
                address(this),
                amount
            ),
            "DForceAdapter: transferFrom failed"
        );

        uint256 received =
            usdt.balanceOf(address(this))
            - beforeBalance;

        require(
            received > 0,
            "DForceAdapter: no USDT received"
        );

        iUSDT.mint(
            address(this),
            received
        );

        require(
            usdt.balanceOf(address(this)) == 0,
            "DForceAdapter: idle USDT"
        );
    }

    function withdraw(
        uint256 amount
    )
        external
        override
        onlyPool
        returns (uint256)
    {
        require(
            amount > 0,
            "DForceAdapter: zero amount"
        );

        uint256 beforeBalance =
            usdt.balanceOf(address(this));

        iUSDT.redeemUnderlying(
            address(this),
            amount
        );

        uint256 received =
            usdt.balanceOf(address(this))
            - beforeBalance;

        require(
            received > 0,
            "DForceAdapter: no USDT received"
        );

        require(
            usdt.transfer(
                pool,
                received
            ),
            "DForceAdapter: transfer failed"
        );

        return received;
    }

    function totalAssets()
        external
        view
        override
        returns (uint256)
    {
        uint256 iBalance =
            iUSDT.balanceOf(address(this));

        if (iBalance == 0) {
            return usdt.balanceOf(address(this));
        }

        uint256 exchangeRate =
            iUSDT.exchangeRateStored();

        uint256 underlying =
            (iBalance * exchangeRate) / BASE;

        return
            underlying
            + usdt.balanceOf(address(this));
    }
}