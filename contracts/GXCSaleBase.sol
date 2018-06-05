pragma solidity ^0.4.23;

import 'openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol';
import 'openzeppelin-solidity/contracts/crowdsale/distribution/RefundableCrowdsale.sol';

import './GXCToken.sol';
import './GXCTokenTimelock.sol';

contract GXCSaleBase is CappedCrowdsale, RefundableCrowdsale {
  GXCTokenTimelock public tokenTimelock;

  event deliverTokensEvent (GXCTokenTimelock _tokenTimelock, uint256 _tokenAmount);

  constructor(
    uint256 _rate,
    address _wallet,
    uint256 _cap,
    uint256 _goal,
    uint256 _openingTime,
    uint256 _closingTime,
    GXCToken _token,
    GXCTokenTimelock _tokenTimelock
  ) 
    public 
    Crowdsale(_rate, _wallet, _token)
    CappedCrowdsale(_cap)
    TimedCrowdsale(_openingTime, _closingTime)
    RefundableCrowdsale(_goal)
  {
    tokenTimelock = _tokenTimelock;
  }

  function setTokenRate (uint256 _rate) public {
    rate = _rate;
  }

  function _deliverTokens(
    address _beneficiary,
    uint256 _tokenAmount
  )
    internal
  {
    emit deliverTokensEvent(tokenTimelock, _tokenAmount);
    token.transfer(tokenTimelock, _tokenAmount);
    tokenTimelock.deposit(_beneficiary, _tokenAmount);
  }
}

