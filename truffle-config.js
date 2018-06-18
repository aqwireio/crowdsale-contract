require('dotenv').config();

require('babel-register')({
    ignore: /node_modules\/(?!openzeppelin-solidity\/test\/helpers)/
  })
require('babel-polyfill')
var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = process.env.MNEMONICS;

module.exports = {
    // Turns on the Solidity optimizer. For development the optimizer's
    // quite helpful, just remember to be careful, and potentially turn it
    // off, for live deployment and/or audit time. For more information,
    // see the Truffle 4.0.0 release notes.
    //
    // https://github.com/trufflesuite/truffle/releases/tag/v4.0.0
    solc: {
        optimizer: {
          enabled: true,
          runs: 200
        }
    },
    networks: {
        rinkeby: {
            provider: function() {
                return new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/" + process.env.INFURA_API_KEY)
            },
            network_id: "*",
            from: "0x1111111111111111111111111111111111111111", //replace with accounts[0]
            gas: 6721975,
            gasPrice: 100000000000,
        },
        development: {
            host: "127.0.0.1",
            port: 7545,
            network_id: "*" // Match any network id
        }
    },
    authors: [
        "Andrey Shishkin <motive.do@gmail.com>",
        "Scott Yu <scott@aqwire.io>"
    ]
};



