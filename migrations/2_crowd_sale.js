var GameXCoin = artifacts.require('./GameXCoin.sol');
var GXCCrowdsale = artifacts.require('./GXCCrowdsale.sol');

module.exports = (deployer) => {
  deployer.deploy(GameXCoin).then(() => {
    const openingTime = web3.eth.getBlock('latest').timestamp;
    const closingTime = openingTime + (86400 * 1); // days
    const RATE = new web3.BigNumber(10);
    const wallet = web3.eth.accounts[9];
    const cap = new web3.BigNumber(web3.toWei(1, 'ether'));
    const token = GameXCoin.address;
    const goal = new web3.BigNumber(web3.toWei(100, 'ether'));
    deployer.deploy(GXCCrowdsale, openingTime, closingTime, RATE, wallet, cap, token, goal).catch(e => console.log(e));
  }).catch((e) => {
    console.log(e);
  });
};
