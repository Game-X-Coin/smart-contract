require('dotenv').config();
require('babel-register')({
  ignore: /node_modules\/(?!openzeppelin-solidity)/,
});
require('babel-polyfill');

const HDWalletProvider = require('truffle-hdwallet-provider');

const providerWithMnemonic = (mnemonic, rpcEndpoint) =>
  new HDWalletProvider(mnemonic, rpcEndpoint);

const infuraProvider = network => providerWithMnemonic(
  process.env.MNEMONIC || '',
  `https://${network}.infura.io/${process.env.INFURA_API_KEY}`
);

const ropstenProvider = process.env.SOLIDITY_COVERAGE
  ? undefined
  : infuraProvider('ropsten');

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  build: 'webpack',
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // eslint-disable-line camelcase
      gasLimit: 0xfffffffffff,
      gasPrice: 0x01,
    },
    ropsten: {
      provider: ropstenProvider,
      network_id: 3, // eslint-disable-line camelcase
    },
    ganache: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // eslint-disable-line camelcase
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },
    coverage: {
      host: 'localhost',
      network_id: '*', // eslint-disable-line camelcase
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },
    rinkeby: {
      host: 'localhost', // Connect to geth on the specified
      port: 8545,
      from: '0x5aa78c7b46597f9ef46fa48f1255078fb85bf6b6',
      network_id: 4,
      gas: 0xfffffffffff, // Gas limit used for deploys
      gasPrice: 0x01
    },
    mocha: {
      reporter: 'eth-gas-reporter',
      reporterOptions: {
        currency: 'KRW',
        gasPrice: 5
      }
    }
  },
};
