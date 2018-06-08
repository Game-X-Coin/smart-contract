pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol";
import './GXCSaleBase.sol';

contract GXCToken is PausableToken {
  using SafeMath for uint256;

  string public constant name = "GXCToken";
  string public constant symbol = "GXC";
  uint8 public constant decimals = 18;
  address public sale;

  uint256 private constant token_factor = 10**uint256(decimals);
  uint256 public constant INITIAL_SUPPLY = 1000000000 * token_factor;
  
  uint256 public constant MAINSALE_SUPPLY = 160000000 * token_factor;

  mapping (address => bool) public admins;

  modifier notInitialized(address saleAddress) {
    require(address(saleAddress) == address(0), "Expected address to be null");
    _;
  }

  modifier whenNotPaused() {
    require(!paused || admins[msg.sender]);
    _;
  }

  constructor () public {
    totalSupply_ = INITIAL_SUPPLY;
    mint(msg.sender, INITIAL_SUPPLY);
    pause();
    admins[msg.sender] = true;
  }

  function mint (address _to, uint256 _amount) internal {
    balances[_to] = _amount;
    emit Transfer(0x0, _to, _amount);
  }

  function isAdmin() public view returns (bool) {
    return admins[msg.sender];
  }

  function initSale (address _sale, uint256 _supply) public onlyOwner {
    require(_supply > 0);
    transfer(_sale, _supply);
    admins[_sale] = true;
  }
}
