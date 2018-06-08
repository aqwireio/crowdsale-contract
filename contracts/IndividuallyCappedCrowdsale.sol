pragma solidity ^0.4.21;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../node_modules/openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol";


/**
 * @title IndividuallyCappedCrowdsale
 * @dev Crowdsale with per-user caps.
 */
contract IndividuallyCappedCrowdsale is Crowdsale, Ownable {
  using SafeMath for uint256;

  mapping(address => uint256) public contributions;
  mapping(address => uint256) public mincaps;
  mapping(address => uint256) public maxcaps;

  /**
   * @dev Sets a specific user's maximum contribution.
   * @param _beneficiary Address to be capped
   * @param _maxcap Max Wei limit for individual contribution
   * @param _mincap Min Wei limit for individual contribution
   */
  function setUserCap(address _beneficiary, uint256 _maxcap, uint256 _mincap) external onlyOwner {
    maxcaps[_beneficiary] = _maxcap;
    mincaps[_beneficiary] = _mincap;
  }

  /**
   * @dev Sets a group of users' maximum contribution.
   * @param _beneficiaries List of addresses to be capped
   * @param _maxcap Max Wei limit for individual contribution
   * @param _mincap Min Wei limit for individual contribution
   */
  function setGroupCap(address[] _beneficiaries, uint256 _maxcap, uint256 _mincap ) external onlyOwner {
    for (uint256 i = 0; i < _beneficiaries.length; i++) {
      maxcaps[_beneficiaries[i]] = _maxcap;
      mincaps[_beneficiaries[i]] = _mincap;
    }
  }

  /**
   * @dev Returns the cap of a specific user.
   * @param _beneficiary Address whose cap is to be checked
   * @return Current cap for individual user
   */
  function getUserCap(address _beneficiary) public view returns (uint256) {
    return maxcaps[_beneficiary];
  }

  /**
   * @dev Returns the cap of a specific user.
   * @param _beneficiary Address whose cap is to be checked
   * @return Current Max cap for individual user
   */
  function getUserMaxCap(address _beneficiary) public view returns (uint256) {
    return maxcaps[_beneficiary];
  }

  
  /**
   * @dev Returns the cap of a specific user.
   * @param _beneficiary Address whose cap is to be checked
   * @return Current Max cap for individual user
   */
  function getUserMinCap(address _beneficiary) public view returns (uint256) {
    return mincaps[_beneficiary];
  }

  /**
   * @dev Returns the amount contributed so far by a sepecific user.
   * @param _beneficiary Address of contributor
   * @return User contribution so far
   */
  function getUserContribution(address _beneficiary) public view returns (uint256) {
    return contributions[_beneficiary];
  }

  /**
   * @dev Extend parent behavior requiring purchase to respect the user's funding cap.
   * @param _beneficiary Token purchaser
   * @param _weiAmount Amount of wei contributed
   */
  function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
    super._preValidatePurchase(_beneficiary, _weiAmount);
    require(_weiAmount >= mincaps[_beneficiary]);
    require(contributions[_beneficiary].add(_weiAmount) <= maxcaps[_beneficiary]);
  }

  /**
   * @dev Extend parent behavior to update user contributions
   * @param _beneficiary Token purchaser
   * @param _weiAmount Amount of wei contributed
   */
  function _updatePurchasingState(address _beneficiary, uint256 _weiAmount) internal {
    super._updatePurchasingState(_beneficiary, _weiAmount);
    contributions[_beneficiary] = contributions[_beneficiary].add(_weiAmount);
  }

}
