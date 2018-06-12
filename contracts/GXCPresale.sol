pragma solidity ^0.4.23;

import './GXCToken.sol';
import './GXCSaleBase.sol';

contract GXCPresale is GXCSaleBase {

  uint256 public constant PRESALE_RATE = 15;
  uint256 public userCappedMinLimit;
  uint256 public userCappedMaxLimit;

  constructor(
    address _wallet,
    uint256 _cap,
    uint256 _goal,
    uint256 _openingTime,
    uint256 _closingTime,
    uint256 _releaseTime,
    GXCToken _token,
    uint256 _userCappedMinLimit,
    uint256 _userCappedMaxLimit
  ) 
    public 
    GXCSaleBase(PRESALE_RATE, _wallet, _cap, _goal, _openingTime, _closingTime, _releaseTime, _token, _userCappedMinLimit, _userCappedMaxLimit)
  {
  }
}
