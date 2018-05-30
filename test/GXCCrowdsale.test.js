import ether from 'openzeppelin-solidity/test/helpers/ether';
import { advanceBlock } from 'openzeppelin-solidity/test/helpers/advanceToBlock';
import { increaseTimeTo, duration } from 'openzeppelin-solidity/test/helpers/increaseTime';
import latestTime from 'openzeppelin-solidity/test/helpers/latestTime';
import EVMRevert from 'openzeppelin-solidity/test/helpers/EVMRevert';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const GXCCrowdsale = artifacts.require('GXCCrowdsale');
const GameXCoin = artifacts.require('GameXCoin');

contract('GXCCrowdsale', function ([_, owner, wallet, authorized, unauthorized, anotherAuthorized]) {
  const RATE = new BigNumber(40);
  const GOAL = ether(10);
  const CAP = ether(20);

  before(async function () {
    await advanceBlock();
  });

  beforeEach(async function () {
    this.openingTime = latestTime() + duration.weeks(1);
    this.closingTime = this.openingTime + duration.weeks(1);
    this.beforeEndTime = this.closingTime - duration.hours(1);
    this.afterClosingTime = this.closingTime + duration.seconds(1);

    this.token = await GameXCoin.new();
    this.crowdsale = await GXCCrowdsale.new(
      this.openingTime,
      this.closingTime,
      RATE,
      wallet,
      CAP,
      this.token.address,
      GOAL,
    );
    this.totalSupply = await this.token.totalSupply();
    await this.token.transferOwnership(this.crowdsale.address);
    await this.token.transfer(this.crowdsale.address, CAP.mul(RATE));
  });

  it('should create crowdsale with correct parameters', async function () {
    const openingTime = await this.crowdsale.openingTime();
    const closingTime = await this.crowdsale.closingTime();
    const rate = await this.crowdsale.rate();
    const walletAddress = await this.crowdsale.wallet();
    const goal = await this.crowdsale.goal();
    const cap = await this.crowdsale.cap();

    openingTime.should.be.bignumber.equal(this.openingTime);
    closingTime.should.be.bignumber.equal(this.closingTime);
    rate.should.be.bignumber.equal(RATE);
    walletAddress.should.be.equal(wallet);
    goal.should.be.bignumber.equal(GOAL);
    cap.should.be.bignumber.equal(CAP);
  });

  it('should not accept payments before start', async function () {
    await this.crowdsale.send(ether(1)).should.be.rejectedWith(EVMRevert);
    await this.crowdsale.buyTokens(authorized, { from: authorized, value: ether(1) })
      .should.be.rejectedWith(EVMRevert);
  });

  it('should reject payments after end', async function () {
    await increaseTimeTo(this.afterEnd);
    await this.crowdsale.send(ether(1)).should.be.rejectedWith(EVMRevert);
    await this.crowdsale.buyTokens(authorized, {
      value: ether(1),
      from: authorized,
    }).should.be.rejectedWith(EVMRevert);
  });

  it('should reject payments over cap', async function () {
    await increaseTimeTo(this.openingTime);
    await this.crowdsale.sendTransaction({ value: CAP, from: authorized, gasPrice: 0 });
    await this.crowdsale.send(1).should.be.rejectedWith(EVMRevert);
  });

  it('should allow finalization and transfer funds to wallet if the goal is reached', async function () {
    await increaseTimeTo(this.openingTime);
    await this.crowdsale.sendTransaction({ value: GOAL, from: authorized, gasPrice: 0 });

    const beforeFinalization = web3.eth.getBalance(wallet);
    await increaseTimeTo(this.afterClosingTime);
    await this.crowdsale.finalize();
    const afterFinalization = web3.eth.getBalance(wallet);

    afterFinalization.minus(beforeFinalization).should.be.bignumber.equal(GOAL);
  });

  it('should allow refunds if the goal is not reached', async function () {
    const balanceBeforeInvestment = web3.eth.getBalance(authorized);

    await increaseTimeTo(this.openingTime);
    await this.crowdsale.sendTransaction({ value: ether(1), from: authorized, gasPrice: 0 });
    await increaseTimeTo(this.afterClosingTime);
    await this.crowdsale.finalize();
    await this.crowdsale.claimRefund({ from: authorized, gasPrice: 0 })
      .should.be.fulfilled;
    const balanceAfterRefund = web3.eth.getBalance(authorized);
    balanceBeforeInvestment.should.be.bignumber.equal(balanceAfterRefund);
  });
});
