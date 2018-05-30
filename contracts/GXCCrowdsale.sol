pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/distribution/RefundableCrowdsale.sol";
import "openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol";

contract GXCCrowdsale is CappedCrowdsale, RefundableCrowdsale {
  constructor(
    uint256 _openingTime,
    uint256 _closingTime,
    uint256 _rate,
    address _wallet,
    uint256 _cap,
    PausableToken _token,
    uint256 _goal
  )
    public
    Crowdsale(_rate, _wallet, _token)
    CappedCrowdsale(_cap)
    TimedCrowdsale(_openingTime, _closingTime)
    RefundableCrowdsale(_goal)
  {
    require(_cap <= _token.totalSupply());
    require(_goal <= _cap);
  }
}
