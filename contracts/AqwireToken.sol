pragma solidity ^0.4.23;

import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/StandardBurnableToken.sol";
import "../node_modules/openzeppelin-solidity/contracts/ownership/Whitelist.sol";


contract AqwireToken is StandardBurnableToken, Whitelist {
    string public constant name = "AqwireToken"; 
    string public constant symbol = "QEY"; 
    uint8 public constant decimals = 18; 

    uint256 public constant INITIAL_SUPPLY = 180000000 * (10 ** uint256(decimals));
    uint256 public unlockTime;

    constructor() public{
        totalSupply_ = INITIAL_SUPPLY;
        balances[msg.sender] = INITIAL_SUPPLY;
        emit Transfer(0x0, msg.sender, INITIAL_SUPPLY);

        // owner is automatically whitelisted
        addAddressToWhitelist(msg.sender);

    }

    function setUnlockTime(uint256 _unlockTime) public onlyOwner {
        unlockTime = _unlockTime;
    }

    function transfer(address _to, uint256 _value) public returns (bool) {
        // lock transfers until after ICO completes unless whitelisted
        require(block.timestamp >= unlockTime || whitelist[msg.sender], "Unable to transfer as unlock time not passed or address not whitelisted");

        return super.transfer(_to, _value);
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        // lock transfers until after ICO completes unless whitelisted
        require(block.timestamp >= unlockTime || whitelist[msg.sender], "Unable to transfer as unlock time not passed or address not whitelisted");

        return super.transferFrom(_from, _to, _value);
    }

}