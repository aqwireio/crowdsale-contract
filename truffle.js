require('babel-register')({
    ignore: /node_modules\/(?!openzeppelin-solidity\/test\/helpers)/
  })
require('babel-polyfill')
var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "ladder farm pilot topple solid soda cigar digital noise rabbit dial say";

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
                return new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/mywuRvwHieNExl8L7Eff")
            },
            network_id: "*",
            from: "0x78b3e5bb6d1e236727760a4e28f8fcfeb492d8a1",
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



