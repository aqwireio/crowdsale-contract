pragma solidity ^0.4.23;

import "./AqwireToken.sol";
import "../node_modules/openzeppelin-solidity/contracts/crowdsale/distribution/RefundableCrowdsale.sol";
import "../node_modules/openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "../node_modules/openzeppelin-solidity/contracts/crowdsale/emission/AllowanceCrowdsale.sol";
import "../node_modules/openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "../node_modules/openzeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol";


contract AqwireContract is RefundableCrowdsale, CappedCrowdsale, Pausable, AllowanceCrowdsale, WhitelistedCrowdsale {

    /**
    * @param _rate Number of token units a buyer gets per wei
    * @param _wallet Address where collected funds will be forwarded to
    * @param _token Address of the token being sold
    * @param _openingTime Crowdsale opening time
    * @param _closingTime Crowdsale closing time
    * @param _hardCap Max amount of wei to be contributed
    * @param _softCap Funding goal
    * @param _tokenWallet Address holding the tokens, which has approved allowance to the crowdsale
    */


    constructor(
        uint256 _openingTime,
        uint256 _closingTime,
        uint256 _rate,
        address _wallet,
        uint256 _hardCap,
        address _tokenWallet,
        uint256 _softCap,
        ERC20 _token
    )
        public
        Crowdsale(_rate, _wallet, _token)
        CappedCrowdsale(_hardCap)
        AllowanceCrowdsale(_tokenWallet)
        TimedCrowdsale(_openingTime, _closingTime)
        RefundableCrowdsale(_softCap)
    {
        //As goal needs to be met for a successful crowdsale
        //the value needs to less or equal than a cap which is limit for accepted funds
        require(_softCap <= _hardCap);
    }

}