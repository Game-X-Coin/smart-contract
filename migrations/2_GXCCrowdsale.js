const GXCToken = artifacts.require('GXCToken');
const GXCSaleBase = artifacts.require('GXCSaleBase');
const GXCTokenTimelock = artifacts.require('GXCTokenTimelock');

const openingTime = web3.eth.getBlock('latest').timestamp;
const closingTime = openingTime + (86400 * 1); // days
const releaseTime = closingTime + (86400 * 7);
const RATE = new web3.BigNumber(10);
const wallet = web3.eth.accounts[9];
const cap = new web3.BigNumber(web3.toWei(1, 'ether'));
const goal = new web3.BigNumber(web3.toWei(100, 'ether'));

module.exports = async (deployer) => {
  try {
    await deployer.deploy(GXCToken);
    await deployer.deploy(GXCTokenTimelock, GXCToken.address, releaseTime);
    await deployer.deploy(GXCSaleBase, RATE, wallet, cap, goal, openingTime, closingTime, GXCToken.address, GXCTokenTimelock.address);
  } catch (err) {
    console.log(err);
  }
};
