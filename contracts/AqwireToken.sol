pragma solidity ^0.4.23;

import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";


contract AqwireToken is StandardToken {
    string public constant name = "AqwireToken"; 
    string public constant symbol = "QEY"; 
    uint8 public constant decimals = 18; 

    uint256 public constant INITIAL_SUPPLY = 90000000 * (10 ** uint256(decimals));

    constructor() public{
        totalSupply_ = INITIAL_SUPPLY;
        balances[msg.sender] = INITIAL_SUPPLY;
        emit Transfer(0x0, msg.sender, INITIAL_SUPPLY);
    }

}