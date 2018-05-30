pragma solidity ^0.4.23;

import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";

contract AqwireToken is StandardToken {
    string public constant name = "AqwireToken"; // solium-disable-line uppercase
    string public constant symbol = "QEY"; // solium-disable-line uppercase
    uint8 public constant decimals = 18; // solium-disable-line uppercase

    uint256 public constant INITIAL_SUPPLY = 90000000 * (10 ** uint256(decimals));

    constructor() public{
        totalSupply_ = INITIAL_SUPPLY;
        balances[msg.sender] = INITIAL_SUPPLY;
        emit Transfer(0x0, msg.sender, INITIAL_SUPPLY);
    }

}