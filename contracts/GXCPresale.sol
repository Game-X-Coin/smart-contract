pragma solidity ^0.4.23;

import './GXCToken.sol';
import './GXCSaleBase.sol';

contract GXCPresale is GXCSaleBase {

  uint256 public constant PRESALE_RATE = 17143;

  constructor(
    address _wallet,
    uint256 _cap,
    uint256 _goal,
    uint256 _openingTime,
    uint256 _closingTime,
    GXCToken _token,
    GXCTokenTimelock _tokenTimelock
  ) 
    public 
    GXCSaleBase(PRESALE_RATE, _wallet, _cap, _goal, _openingTime, _closingTime, _token, _tokenTimelock)
  {
  }
}
