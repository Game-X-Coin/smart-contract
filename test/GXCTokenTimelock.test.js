import latestTime from 'openzeppelin-solidity/test/helpers/latestTime';
import { duration } from 'openzeppelin-solidity/test/helpers/increaseTime';

const GameXCoin = artifacts.require('GameXCoin.sol');
const GXCTokenTimelock = artifacts.require('GXCTokenTimelock.sol');

contract('GXCTokenTimelock Test', async function ([owner, investor]) {
  let tokenDeployed;
  let timelockDeployed;
  let releaseTime;

  beforeEach(async function () {
    tokenDeployed = await GameXCoin.new({ from: owner });
    releaseTime = latestTime() + duration.weeks(24);
    timelockDeployed = await GXCTokenTimelock.new(tokenDeployed.address, releaseTime);
    await tokenDeployed.transfer(timelockDeployed.address, 100000000000);
  });

  it('should initialized', async function () {
    let releaseTimeQueried = await timelockDeployed.releaseTime();
    assert(releaseTimeQueried, releaseTime);
  });

  it('should get token after release', async function () {
    await timelockDeployed.deposit(investor, 1000000000);
    await timelockDeployed.release({ from: investor });

    let queriedBalance = await tokenDeployed.balanceOf(investor);
    assert.equal(1000000000, queriedBalance.toNumber());
  });
});
