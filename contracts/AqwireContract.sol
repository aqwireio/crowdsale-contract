pragma solidity ^0.4.23;

import "./AqwireToken.sol";
import "../node_modules/openzeppelin-solidity/contracts/crowdsale/distribution/RefundableCrowdsale.sol";
import "../node_modules/openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "../node_modules/openzeppelin-solidity/contracts/crowdsale/emission/AllowanceCrowdsale.sol";
import "../node_modules/openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "../node_modules/openzeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol";
import "./IndividuallyCappedCrowdsale.sol";

contract AqwireContract is CappedCrowdsale, AllowanceCrowdsale, RefundableCrowdsale, IndividuallyCappedCrowdsale, Pausable, WhitelistedCrowdsale {

    /**
    * @param _rate Number of token units a buyer gets per wei
    * @param _wallet Address where collected funds will be forwarded to
    * @param _token Address of the token being sold
    * @param _openingTime Crowdsale opening time
    * @param _closingTime Crowdsale closing time 
    * @param _hardCap Max amount of wei to be contributed 
    * @param _softCap Funding goal
    * @param _tokenWallet Address holding the tokens, which has approved allowance to the crowdsale
    * @param _minContribution Min amount of wei that must be contributed
    * @param _maxContribution Max amount of wei that can be contributed per address
    */

    constructor(
        uint256 _openingTime,
        uint256 _closingTime,
        uint256 _rate,
        address _wallet,
        uint256 _hardCap,
        address _tokenWallet,
        uint256 _softCap,
        uint256 _minContribution,
        uint256 _maxContribution,
        ERC20 _token
    )
        public
        Crowdsale(_rate, _wallet, _token)
        CappedCrowdsale(_hardCap)
        AllowanceCrowdsale(_tokenWallet)
        TimedCrowdsale(_openingTime, _closingTime)
        RefundableCrowdsale(_softCap)
        IndividuallyCappedCrowdsale(_minContribution, _maxContribution)
        Pausable()
        WhitelistedCrowdsale()
    {
        //As goal needs to be met for a successful crowdsale
        //the value needs to less or equal than a cap which is limit for accepted funds
        require(_softCap <= _hardCap);
    }

    uint256 public firstBonus;

    uint256 public secondBonus;

    uint256 public finalRate;

    uint256 public startTime;

    uint256 public firstTimeBonusChange;

    uint256 public secondTimeBonusChange;

    function setCurrentRate(
        uint256 _firstBonus, 
        uint256 _secondBonus, 
        uint256 _finalRate, 
        uint256 _startTime,
        uint256 _firstTimeBonusChange,
        uint256 _secondTimeBonusChange
        )
    public
    onlyOwner {
        require(_firstBonus >= _secondBonus);
        require(_secondBonus >= _finalRate);
        require(_finalRate > 0);
        
        firstBonus = _firstBonus;
        secondBonus = _secondBonus;
        finalRate = _finalRate;

        startTime = _startTime;
        firstTimeBonusChange = _firstTimeBonusChange;
        secondTimeBonusChange = _secondTimeBonusChange;

    }


    /**
     * @dev Override to extend the way in which ether is converted to tokens.
     * @param _weiAmount Value in wei to be converted into tokens
     * @return Number of tokens that can be purchased with the specified _weiAmount
     */
    function _getTokenAmount(uint256 _weiAmount) internal view returns (uint256) {

        if (now < firstTimeBonusChange) {
            return _weiAmount.mul(firstBonus);
        }

        if (now < secondTimeBonusChange) {
            return _weiAmount.mul(secondBonus);
        }

        return _weiAmount.mul(finalRate);
    }

}