const GXCToken = artifacts.require('GXCToken');
const GXCSaleBase = artifacts.require('GXCSaleBase');

const openingTime = web3.eth.getBlock('latest').timestamp;
const closingTime = openingTime + (86400 * 1); // days
const releaseTime = closingTime + (86400 * 7);
const RATE = new web3.BigNumber(10);
const wallet = web3.eth.accounts[9];
const cap = new web3.BigNumber(web3.toWei(1, 'ether'));
const goal = new web3.BigNumber(web3.toWei(100, 'ether'));
const userMinCappedLimit = new web3.BigNumber(web3.toWei(0.1, 'ether'));
const userMaxCappedLimit = new web3.BigNumber(web3.toWei(100, 'ether'));

module.exports = async (deployer) => {
  try {
    await deployer.deploy(GXCToken);
    await deployer.deploy(GXCSaleBase, RATE, wallet, cap, goal, openingTime, closingTime, releaseTime, GXCToken.address, userMinCappedLimit, userMaxCappedLimit);
  } catch (err) {
    console.log(err);
  }
};
