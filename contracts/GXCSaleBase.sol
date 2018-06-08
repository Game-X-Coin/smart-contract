pragma solidity ^0.4.23;

import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import 'openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol';
import 'openzeppelin-solidity/contracts/crowdsale/distribution/RefundableCrowdsale.sol';
import 'openzeppelin-solidity/contracts/crowdsale/distribution/PostDeliveryCrowdsale.sol';

import './GXCToken.sol';

contract GXCSaleBase is CappedCrowdsale, RefundableCrowdsale {
  using SafeMath for uint256;

  mapping (address => uint256) public lockedBonusTokens;
  address[] public buyers;
  uint256 releaseTime;
  uint8 public constant decimals = 18;
  uint256 private constant token_factor = 10**uint256(decimals);
  uint256 public constant PRESALE_SUPPLY = 140000000 * token_factor;

  uint public BONUS_RATE = 30;

  constructor(
    uint256 _rate,
    address _wallet,
    uint256 _cap,
    uint256 _goal,
    uint256 _openingTime,
    uint256 _closingTime,
    uint256 _releaseTime,
    GXCToken _token
  ) 
    public 
    Crowdsale(_rate, _wallet, _token)
    CappedCrowdsale(_cap)
    TimedCrowdsale(_openingTime, _closingTime)
    RefundableCrowdsale(_goal)
  {
    require(_releaseTime > _closingTime);
    releaseTime = _releaseTime;
  }

  modifier canRelease () {
    require(now >= releaseTime);
    _;
  }

  modifier notUnderZero (uint256 _value) {
    require(_value > 0);
    _;
  }

  function setTokenRate (uint256 _rate) onlyOwner notUnderZero(_rate) public {
    rate = _rate;
  }

  function getLockedToken () public view returns (uint256) {
    return lockedBonusTokens[msg.sender];
  }

  function getBonusAmount()
    internal view returns (uint256)
  {
    uint256 weiAmount = msg.value;
    uint256 bonusRate = getBonusRate();

    if (bonusRate == 0) {
      return 0;
    }
    uint256 bonusAmount = weiAmount * bonusRate / 100; 
    
    if (bonusAmount / bonusRate == weiAmount) {
      return 0;
    }

    return bonusAmount;
  }

  function getBonusRate() internal returns (uint256) {
    return rate.mul(BONUS_RATE);
  }

  function _deliverTokens(
    address _beneficiary,
    uint256 _tokenAmount
  )
    internal
  {
    token.transfer(_beneficiary, _tokenAmount);
    uint256 bonusAmount = getBonusAmount();
    if (bonusAmount > 0) {
      lockedBonusTokens[msg.sender] += bonusAmount;
      buyers.push(msg.sender);
    }
  }

  function release () onlyOwner canRelease public {
    for (uint256 i = 0; i < buyers.length; i++) {
      address buyer = buyers[i];
      uint256 amount = lockedBonusTokens[buyer];
      if (amount > 0) {
        token.transfer(buyer, amount);
      }
    }
  }
}
