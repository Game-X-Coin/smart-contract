import { advanceBlock } from 'openzeppelin-solidity/test/helpers/advanceToBlock';
import latestTime from 'openzeppelin-solidity/test/helpers/latestTime';
import { increaseTimeTo, duration } from 'openzeppelin-solidity/test/helpers/increaseTime';
import ether from 'openzeppelin-solidity/test/helpers/ether';

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const BigNumber = web3.BigNumber;
const GXCPresale = artifacts.require('GXCPresale');
const GXCToken = artifacts.require('GXCToken');
const GXCTokenTimelock = artifacts.require('GXCTokenTimelock');

contract('GXCPresale', async ([owner, wallet, investor]) => {
  let tokenInstance;
  let tokenTimelockInstance;
  let presale;
  const releaseTime = latestTime() + duration.weeks(24);
  const GOAL = ether(10);
  const CAP = ether(20);

  const openingTime = latestTime() + duration.weeks(2);
  const closingTime = openingTime + duration.weeks(1);

  beforeEach(async () => {
    await advanceBlock();
    tokenInstance = await GXCToken.new({ from: owner });
    tokenTimelockInstance = await GXCTokenTimelock.new(tokenInstance.address, releaseTime, { from: owner });
    presale = await GXCPresale.new(wallet, CAP, GOAL, openingTime, closingTime, tokenInstance.address, tokenTimelockInstance.address, { from: owner });
    await tokenInstance.initPresale(presale.address);
  });

  describe('constructor', () => {
    it('should create presale with correct parameters', async () => {
      const openingTime = await presale.openingTime();
      const closingTime = await presale.closingTime();
      const rate = await presale.rate();
      const presaleRate = await presale.PRESALE_RATE();
      const walletAddress = await presale.wallet();
      const goal = await presale.goal();
      const cap = await presale.cap();
      const token = await presale.token();
      const tokenTimelock = await presale.tokenTimelock();

      openingTime.should.be.bignumber.equal(openingTime);
      closingTime.should.be.bignumber.equal(closingTime);
      rate.should.be.bignumber.equal(presaleRate);
      walletAddress.should.be.equal(wallet);
      goal.should.be.bignumber.equal(GOAL);
      cap.should.be.bignumber.equal(CAP);
      token.should.be.equal(tokenInstance.address);
      tokenTimelock.should.be.equal(tokenTimelockInstance.address);
    });
  });

  describe('buyToken', () => {
    it('should buy token', async () => {
      await increaseTimeTo(openingTime);
      const value = ether(1);
      await presale.buyTokens(investor, { value, from: investor });
      await tokenTimelockInstance.release({ from: investor });
    });
  });
});
