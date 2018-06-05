import decodeLogs from 'openzeppelin-solidity/test/helpers/decodeLogs';
const BigNumber = web3.BigNumber;
const GXCToken = artifacts.require('GXCToken');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('GXCToken', async ([owner]) => {
  let token;

  beforeEach(async () => {
    token = await GXCToken.new({ from: owner });
  });

  describe('constructor', () => {
    it('has a name', async function () {
      const name = await token.name();
      assert.equal(name, 'GXCToken');
    });

    it('has a symbol', async function () {
      const symbol = await token.symbol();
      assert.equal(symbol, 'GXC');
    });

    it('has 18 decimals', async function () {
      const decimals = await token.decimals();
      assert(decimals.eq(18));
    });
  
    it('has 10 billion tokens', async function () {
      const initialSupply = await token.INITIAL_SUPPLY();
      assert(initialSupply.should.be.bignumber.equal(new BigNumber(1e27)));
    });
  
    it('assigns the initial total supply to the owner', async function () {
      const totalSupply = await token.totalSupply();
      const creatorBalance = await token.balanceOf(owner);
  
      assert(creatorBalance.eq(totalSupply));
  
      const receipt = web3.eth.getTransactionReceipt(token.transactionHash);
      const logs = decodeLogs(receipt.logs, GXCToken, token.address);
      assert.equal(logs.length, 1);
      assert.equal(logs[0].event, 'Transfer');
      assert.equal(logs[0].args.from.valueOf(), 0x0);
      assert.equal(logs[0].args.to.valueOf(), owner);
      assert(logs[0].args.value.eq(totalSupply));
    });
  });
});
