pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol";
import './GXCSaleBase.sol';

contract GXCToken is PausableToken {
  string public constant name = "GXCToken";
  string public constant symbol = "GXC";
  uint8 public constant decimals = 18;
  address public mainSale;
  address public presale;

  uint256 private constant token_factor = 10**uint256(decimals);
  uint256 public constant INITIAL_SUPPLY = 1000000000 * token_factor;

  uint256 public constant PRESALE_SUPPLY = 140000000 * token_factor;
  uint256 public constant MAINSALE_SUPPLY = 160000000 * token_factor;

  modifier notInitialized(address saleAddress) {
    require(address(saleAddress) == address(0), "Expected address to be null");
    _;
  }

  constructor () public {
    totalSupply_ = INITIAL_SUPPLY;
    mint(msg.sender, INITIAL_SUPPLY);
  }

  function mint (address _to, uint256 _amount) internal {
    balances[_to] = _amount;
    emit Transfer(0x0, _to, _amount);
  }

  function initSale (GXCSaleBase _sale, uint256 _supply) internal onlyOwner {
    require(_supply > 0);
    transfer(_sale, _supply);
    transferOwnership(_sale);
  }

  function initPresale (GXCSaleBase _presale) public onlyOwner notInitialized(presale) {
    initSale(_presale, PRESALE_SUPPLY);
    presale = _presale;
  }

  function initMainsale (GXCSaleBase _mainSale) public onlyOwner notInitialized(mainSale) {
    initSale(_mainSale, MAINSALE_SUPPLY);
    mainSale = _mainSale;
  }
}
