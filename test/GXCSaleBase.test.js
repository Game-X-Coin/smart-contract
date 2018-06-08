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

contract('GXCSaleBase', async function ([tokenOwner, saleOwner, wallet, investor, purchaser, another]) {

  const RATE = new BigNumber(1);
  const GOAL = ether(1500);
  const CAP = ether(2000);

  before(async function () {
    await advanceBlock();
  });

  beforeEach(async function () {
    this.openingTime = latestTime() + duration.weeks(2);
    this.closingTime = this.openingTime + duration.weeks(1);
    this.afterClosingTime = this.closingTime + duration.seconds(60);
    this.releaseTime = this.closingTime + duration.weeks(1);
    this.afterReleaseTime = this.releaseTime + duration.seconds(1);
    this.token = await GXCToken.new({ from: tokenOwner });
    this.saleBase = await GXCSaleBase.new(RATE, wallet, CAP, GOAL, this.openingTime, this.closingTime, this.releaseTime, this.token.address, { from: saleOwner });
    const PRESALE_SUPPLY = await this.saleBase.PRESALE_SUPPLY();
    await this.token.initSale(this.saleBase.address, PRESALE_SUPPLY, { from: tokenOwner });
  });

  describe('constructor', function () {
    it('should create crowdsale with correct parameters', async function () {
      const openingTime = await this.saleBase.openingTime();
      const closingTime = await this.saleBase.closingTime();
      const rate = await this.saleBase.rate();
      const walletAddress = await this.saleBase.wallet();
      const goal = await this.saleBase.goal();
      const cap = await this.saleBase.cap();
      const token = await this.saleBase.token();

      openingTime.should.be.bignumber.equal(openingTime);
      closingTime.should.be.bignumber.equal(closingTime);
      rate.should.be.bignumber.equal(RATE);
      walletAddress.should.be.equal(wallet);
      goal.should.be.bignumber.equal(GOAL);
      cap.should.be.bignumber.equal(CAP);
      token.should.be.equal(this.token.address);
    });
  });

  describe('timed', function () {
    it('should not accept payments before start', async function () {
      await this.saleBase.send(ether(1)).should.be.rejectedWith(EVMRevert);
      await this.saleBase.buyTokens(investor, { value: ether(1), from: investor })
        .should.be.rejectedWith(EVMRevert);
    });
  
    it('should reject payments afterEnd', async function () {
      await increaseTimeTo(this.afterEnd);
      await this.saleBase.send(ether(1)).should.be.rejectedWith(EVMRevert);
      await this.saleBase.buyTokens(investor, {
        value: ether(1),
        from: investor,
      }).should.be.rejectedWith(EVMRevert);
    });
  });

  describe('cap', function () {
    it('should reject payments over cap', async function () {
      await increaseTimeTo(this.openingTime);
      await this.saleBase.buyTokens(investor, { value: CAP, from: investor, gasPrice: 0 });
      await this.saleBase.send(1).should.be.rejectedWith(EVMRevert);
    });
  });

  describe('buyTokens', function () {
    beforeEach(async function () {
      await increaseTimeTo(this.openingTime);
    });

    xit('should be able to buy when send to small ether', async function () {
      const value = web3.toWei(0.0000000001, 'ether');
      await this.saleBase.buyTokens(investor, { value, from: investor });
      const investorBalance = await this.token.balanceOf(investor);
      console.log(`---------------- : ${investorBalance}`);
    });

    it('should buy tokens', async function () {
      const value = ether(2);
      await this.saleBase.buyTokens(investor, { value, from: investor });
      const investorBalance = await this.token.balanceOf(investor);
      investorBalance.should.be.deep.equal(value);
    });
  });

  describe('pause', function () {
    it('should not be able to send token before unpause', async function () {
      await increaseTimeTo(this.openingTime);
      const value = ether(2);
      await this.saleBase.buyTokens(investor, { value, from: investor });
      await this.token.transfer(another, value, { from: investor }).should.be.rejectedWith(EVMRevert);
    });

    it('should be able to send token after unpause', async function () {
      await increaseTimeTo(this.openingTime);
      const value = ether(2);
      await this.saleBase.buyTokens(investor, { value, from: investor });
      await this.token.unpause({ from: tokenOwner });
      await this.token.transfer(another, ether(1), { from: investor });
      const investorBalance = await this.token.balanceOf(investor);
      const anotherBalance = await this.token.balanceOf(another);
      investorBalance.should.be.deep.equal(ether(1));
      anotherBalance.should.be.deep.equal(ether(1));
    });
  });

  describe('finalize', function () {
    it('should allow finalization and transfer funds to wallet if the goal is reached', async function () {
      await increaseTimeTo(this.openingTime);
      await this.saleBase.buyTokens(investor, { value: GOAL, from: investor, gasPrice: 0 });
      const beforeFinalization = web3.eth.getBalance(wallet);
      await increaseTimeTo(this.afterClosingTime);
      await this.saleBase.finalize({ from: saleOwner });
      const afterFinalization = web3.eth.getBalance(wallet);
      afterFinalization.minus(beforeFinalization).should.be.bignumber.equal(GOAL);
    });
  });

  describe('refunds', function () {
    it('should allow refunds if the goal is not reached', async function () {
      await increaseTimeTo(this.openingTime);
      const balanceBeforeInvestment = web3.eth.getBalance(investor);
      await this.saleBase.buyTokens(investor, { value: ether(1), gasPrice: 0 });
      await increaseTimeTo(this.afterClosingTime);
      await this.saleBase.finalize({ from: saleOwner });
      await this.saleBase.claimRefund({ gasPrice: 0, from: investor })
        .should.be.fulfilled;
      const balanceAfterRefund = web3.eth.getBalance(investor);
      balanceBeforeInvestment.should.be.bignumber.equal(balanceAfterRefund);
    });
  });

  describe('setTokenRate', function () {
    it('should not change rate when rate is under 0', async function () {
      const newRate = 0;
      await this.saleBase.setTokenRate(newRate, { from: saleOwner }).should.be.rejectedWith(EVMRevert);
    });

    it('should change token rate', async function () {
      const newRate = new BigNumber(2);
      await this.saleBase.setTokenRate(newRate, { from: saleOwner });
      const changedRate = await this.saleBase.rate();
      changedRate.should.be.deep.equal(newRate);
    });
  });

  describe('release', function () {
    it('should release bonus tokens', async function () {
      await increaseTimeTo(this.openingTime);
      const valueAmount = 1;
      const value = ether(valueAmount);
      const valueToWei = web3.toWei(valueAmount, 'ether');
      const bonusAmount = valueToWei * RATE * await this.saleBase.BONUS_RATE() / 100;

      await this.saleBase.buyTokens(investor, { value, from: investor });
      const beforeReleaseBalance = await this.token.balanceOf(investor);
      await increaseTimeTo(this.afterReleaseTime);
      await this.saleBase.release({ from: saleOwner });
      const afterReleaseBalance = await this.token.balanceOf(investor);
      afterReleaseBalance.toNumber().should.be.equal(beforeReleaseBalance.toNumber() + bonusAmount);
    });

    it('should not get bonus if did not invest.', async function () {
      await increaseTimeTo(this.openingTime);
      const beforeReleaseBalance = await this.token.balanceOf(investor);
      await increaseTimeTo(this.afterReleaseTime);
      await this.saleBase.release({ from: saleOwner });
      const afterReleaseBalance = await this.token.balanceOf(investor);
      afterReleaseBalance.toNumber().should.be.equal(beforeReleaseBalance.toNumber());
    });
  });
});
