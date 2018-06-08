import decodeLogs from 'openzeppelin-solidity/test/helpers/decodeLogs';
import ether from 'openzeppelin-solidity/test/helpers/ether';
import EVMRevert from 'openzeppelin-solidity/test/helpers/EVMRevert';

const BigNumber = web3.BigNumber;
const GXCToken = artifacts.require('GXCToken');


require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('GXCToken', function ([owner, investor, another]) {
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
      assert.equal(logs.length, 2);
      assert.equal(logs[0].event, 'Transfer');
      assert.equal(logs[0].args.from.valueOf(), 0x0);
      assert.equal(logs[0].args.to.valueOf(), owner);
      assert(logs[0].args.value.eq(totalSupply));

      assert.equal(logs[1].event, 'Pause');
    });
  });

  describe('transfer', function () {
    it('should not transfer when msg sender is not owner', async () => {
      const value = ether(1);
      await token.transfer(investor, value, { from: investor }).should.be.rejectedWith(EVMRevert);
    });

    describe('unpaused', () => {
      beforeEach(async () => {
        await token.unpause({ from: owner });
      });

      afterEach(async () => {
        await token.pause({ from: owner });
      });

      it('should not transfer over total supply', async () => {
        const totalSupply = await token.totalSupply();
        const value = ether(totalSupply);
        await token.transfer(investor, value, { from: owner }).should.rejectedWith(EVMRevert);
      });

      it('should be able to transfer token from owner', async () => {
        const value = ether(1);
        await token.transfer(investor, value, { from: owner });
        const balance = await token.balanceOf(investor);
        balance.should.be.deep.equal(value);
      });
  
      it('should be able to transfer token from investor to another', async () => {
        const value = ether(2);
        const valueToAnother = ether(1);
        await token.transfer(investor, value, { from: owner });
        const balance = await token.balanceOf(investor);
        balance.should.be.deep.equal(value);
        await token.transfer(another, valueToAnother, { from: investor });
        const leftBalance = await token.balanceOf(investor);
        leftBalance.should.be.deep.equal(ether(1));
        const addBalance = await token.balanceOf(another);
        addBalance.should.be.deep.equal(valueToAnother);
      });
    });
  });
});
