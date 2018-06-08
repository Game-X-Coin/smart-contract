pragma solidity ^0.4.23;

import './GXCToken.sol';
import './GXCSaleBase.sol';

contract GXCPresale is GXCSaleBase {

  uint256 public constant PRESALE_RATE = 15;

  constructor(
    address _wallet,
    uint256 _cap,
    uint256 _goal,
    uint256 _openingTime,
    uint256 _closingTime,
    uint256 _releaseTime,
    GXCToken _token
  ) 
    public 
    GXCSaleBase(PRESALE_RATE, _wallet, _cap, _goal, _openingTime, _closingTime, _releaseTime, _token)
  {
  }
}
