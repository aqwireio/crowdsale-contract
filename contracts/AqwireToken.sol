pragma solidity ^0.4.23;

import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "../node_modules/openzeppelin-solidity/contracts/ownership/Whitelist.sol";


contract AqwireToken is StandardToken, Whitelist {
    string public constant name = "AqwireToken"; 
    string public constant symbol = "QEY"; 
    uint8 public constant decimals = 18; 

    uint256 public constant INITIAL_SUPPLY = 90000000 * (10 ** uint256(decimals));
    uint256 public constant unlockTime = now.add(4 weeks);

    constructor() public{
        totalSupply_ = INITIAL_SUPPLY;
        balances[msg.sender] = INITIAL_SUPPLY;
        emit Transfer(0x0, msg.sender, INITIAL_SUPPLY);

        // owner is automatically whitelisted
        addAddressToWhitelist(msg.sender);

    }

}