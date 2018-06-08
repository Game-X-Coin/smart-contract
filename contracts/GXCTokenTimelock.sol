pragma solidity ^0.4.23;

import './GXCToken.sol';

contract GXCTokenTimelock {
  
  GXCToken public token;
  uint256 public releaseTime;
  mapping (address => uint256) public balance;

  constructor (GXCToken _token, uint256 _releaseTime) public {
    require(_releaseTime > now, "release time should be in the future");
    token = _token;
    releaseTime = _releaseTime;
  }

  function deposit(address _beneficiary, uint256 _amount) public {
    balance[_beneficiary] += _amount;
  }

  function getAmount (address _beneficiary) public view returns (uint256) {
    return balance[_beneficiary];
  }

  function release () public {
    token.transfer(msg.sender, balance[msg.sender]);
  }
}
