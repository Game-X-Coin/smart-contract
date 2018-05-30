pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol";


contract GameXCoin is PausableToken {
  
  string public constant name = "Game X Coin";
  string public constant symbol = "GXC";
  uint8 public constant decimals = 18;
  
  uint256 public constant INITIAL_SUPPLY = 1000000000 * (10 ** uint256(decimals));

  constructor() public {
    assert(INITIAL_SUPPLY > 0);
    totalSupply_ = INITIAL_SUPPLY;
    
    mint(msg.sender, INITIAL_SUPPLY);
    assert(totalSupply_ == INITIAL_SUPPLY);
  }

  function mint (address _to, uint256 _amount) internal {
    balances[_to] = _amount;
    emit Transfer(0x0, _to, _amount);
  }
}