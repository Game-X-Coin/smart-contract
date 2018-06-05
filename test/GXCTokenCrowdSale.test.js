import { advanceBlock } from 'openzeppelin-solidity/test/helpers/advanceToBlock';
import latestTime from 'openzeppelin-solidity/test/helpers/latestTime';
import { increaseTimeTo, duration } from 'openzeppelin-solidity/test/helpers/increaseTime';
import ether from 'openzeppelin-solidity/test/helpers/ether';
import EVMRevert from 'openzeppelin-solidity/test/helpers/EVMRevert';

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const BigNumber = web3.BigNumber;
const GXCToken = artifacts.require('GXCToken');
const GXCSaleBase = artifacts.require('GXCSaleBase');

const GXCTokenTimelock = artifacts.require('GXCTokenTimelock');

contract('GXCTokenCrowdSale', async ([owner, wallet, investor, purchaser]) => {
  let tokenInstance;
  let crowdsale;
  let presale;
  let tokenTimelockInstance;
  const releaseTime = latestTime() + duration.weeks(24);
  const RATE = new BigNumber(1);
  const GOAL = ether(10);
  const CAP = ether(20);

  const openingTime = latestTime() + duration.weeks(2);
  const closingTime = openingTime + duration.weeks(1);

  const afterClosingTime = closingTime + duration.seconds(60);

  beforeEach(async () => {
    await advanceBlock();
    tokenInstance = await GXCToken.new({ from: owner });
    tokenTimelockInstance = await GXCTokenTimelock.new(tokenInstance.address, releaseTime, { from: owner });
    crowdsale = await GXCSaleBase.new(RATE, wallet, CAP, GOAL, openingTime, closingTime, tokenInstance.address, tokenTimelockInstance.address, { from: owner });
    await tokenInstance.initCrowdSale(crowdsale.address, CAP.mul(RATE));
  });

  describe('constructor', () => {
    it('should create crowdsale with correct parameters', async () => {
      const openingTime = await crowdsale.openingTime();
      const closingTime = await crowdsale.closingTime();
      const rate = await crowdsale.rate();
      const walletAddress = await crowdsale.wallet();
      const goal = await crowdsale.goal();
      const cap = await crowdsale.cap();
      const token = await crowdsale.token();
      const tokenTimelock = await crowdsale.tokenTimelock();

      openingTime.should.be.bignumber.equal(openingTime);
      closingTime.should.be.bignumber.equal(closingTime);
      rate.should.be.bignumber.equal(RATE);
      walletAddress.should.be.equal(wallet);
      goal.should.be.bignumber.equal(GOAL);
      cap.should.be.bignumber.equal(CAP);
      token.should.be.equal(tokenInstance.address);
      tokenTimelock.should.be.equal(tokenTimelockInstance.address);
    });
  });

  describe('buyTokens', () => {
    it('should not accept payments before start', async () => {
      await crowdsale.send(ether(1)).should.be.rejectedWith(EVMRevert);
      await crowdsale.buyTokens(investor, { value: ether(1), from: investor })
        .should.be.rejectedWith(EVMRevert);
    });

    it('should reject payments after end', async function () {
      await increaseTimeTo(this.afterEnd);
      await crowdsale.send(ether(1)).should.be.rejectedWith(EVMRevert);
      await crowdsale.buyTokens(investor, {
        value: ether(1),
        from: investor,
      }).should.be.rejectedWith(EVMRevert);
    });

    it('should reject payments over cap', async () => {
      await increaseTimeTo(openingTime);
      await crowdsale.sendTransaction({ value: CAP, from: investor, gasPrice: 0 });
      await crowdsale.send(1).should.be.rejectedWith(EVMRevert);
    });
    
    it('should allow finalization and transfer funds to wallet if the goal is reached', async () => {
      await increaseTimeTo(openingTime);
      await crowdsale.sendTransaction({ value: GOAL, from: investor, gasPrice: 0 });
  
      const beforeFinalization = web3.eth.getBalance(wallet);
      await increaseTimeTo(afterClosingTime);
      await crowdsale.finalize({ from: owner });
      const afterFinalization = web3.eth.getBalance(wallet);
  
      afterFinalization.minus(beforeFinalization).should.be.bignumber.equal(GOAL);
    });

    it('should release token', async () => {
      await increaseTimeTo(openingTime);
      const value = ether(1);
      await crowdsale.buyTokens(investor, { from: investor, value });
      await tokenTimelockInstance.release({ from: investor });
      const investorBalance = await tokenInstance.balanceOf(investor);
      investorBalance.should.be.deep.equal(CAP);
    });
  });

  describe('claimRefund', () => {
    it('should allow refunds if the goal is not reached', async () => {
      const balanceBeforeInvestment = web3.eth.getBalance(investor);
  
      await increaseTimeTo(openingTime);
      await crowdsale.sendTransaction({ value: ether(1), gasPrice: 0 });
      await increaseTimeTo(afterClosingTime);
      await crowdsale.finalize();
      await crowdsale.claimRefund({ gasPrice: 0 })
        .should.be.fulfilled;
      const balanceAfterRefund = web3.eth.getBalance(investor);
      balanceBeforeInvestment.should.be.bignumber.equal(balanceAfterRefund);
    });
  });

  describe('setTokenRate()', () => {
    after(async function () {
      await crowdsale.setTokenRate(RATE);
    });

    it('should change token rate', async () => {
      const newRate = new BigNumber(20);
      await crowdsale.setTokenRate(newRate);
      const changedRate = await crowdsale.rate();
      changedRate.should.be.deep.equal(newRate);
    });
  });
});
