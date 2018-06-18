<a href="https://aqwire.io/"><img src="https://cdn-images-1.medium.com/max/1000/1*oWcFukUctnjw0SHBWBSxEA.png" align="right" valign="top" alt="AQWIRE logo" /></a>

# AQWIRE Token Sale

This repository contains the Solidity source code for the smart contarcts for the crowdsale and the ERC-20 AQWIRE token. The development environment is based on truffle.

## Crowdsale information

**QEY**, AQWIRE’s token, it will be an ERC20 token ran under the Ethereum blockchain.

Among other things, it can be used on the platform to:

- Retrieve Global Property Report.
- List units for sale.
- View information and trends of real estate in specific areas, worldwide.
- Get significant discounts on a property, etc.

**Details:**
> Token name: Aqwire Token

> Token symbol: QEY

> Decimal: 18

> Total supply: 250million QEY

> Token allocation for sale: 40% or 100M QEY tokens

> Crowdsale will start (DATE TBD) 6pm Philippines UTC+8

> Duration: (WEEKS TBD) weeks

> Unsold tokens at the end of the sale will be burnt

> Tokens will be distributed at the end of the time duration.

> Tokens not for crowdsale will be sent and stored in the company's multisig wallet.

> 1st bonus tier of 10% for the 1st week of crowdsale

> 2nd bonus tier of 5% for the 2nd week of crowdsale

> Hardcap is set at USD $15M

> Softcap is set at USD $3M

> ETH / QEY rate will be locked in the date before the crowdsale.


For more information about AQWIRE and the crowdsale, go to:

- [AQWIRE KYC and Whitelisting process](https://medium.com/aqwire/https-medium-com-aqwire-aqwire-kyc-whitelisting-how-does-it-work-982cd51a8310)
- [AQWIRE KYC site](https://aqwire.io/kyc)
- [AQWIRE Whitepaper](https://aqwire.io/#whitepaper)
- [AQWIRE FAQ](https://medium.com/aqwire/https-medium-com-inno-91650-aqwire-frequently-asked-questions-e65555cb26eb)

## Documentation

### Installation 
1. Open your favorite Terminal 
2. Install npm
3. Clone the project and install the dependencies
```sh
$ git clone https://github.com/AQWIRE/crowdsale-contract.git
$ cd crowdsale-contract
$ npm install
```

### Testing and Linting
The contracts can be tested and used using npm commands:

| Command | Description |
| ------ | ------ |
| ``` npm run migrate ``` | compiles and deploys the contracts |
| ``` npm run test ``` | tests the contracts using ganache-cli |
| ``` npm run coverage ``` | generates the coverage of the tests |
| ``` npm run console ``` | launche truffle console |
| ``` npm run lint ``` | lints the js files |
| ``` npm run lint:fix ``` | lints and fixes the js files  |
| ``` npm run lint:sol ``` | lints the solidity files |
| ``` npm run lint:sol:fix ``` | lints and fixes the solidity files |
| ``` npm run lint:all ``` | lints the js and solidity files |
| ``` npm run lint:all:fix ``` | lints and fixes the js and solidity files |


### Testnet Using Metamask and infura
If you want to test on the testnet, do the following:

1. Register and get API key from https://infura.io/
2. Register and get mnemonic from https://metamask.io/
3. Get some test ether from https://faucet.rinkeby.io/
4. Add your API key and mnemonic to truffle-config.js
5. Run the following command to deploy contracts
```sh
$ npm run migrate:testnet
```

*The contracts are not yet audited*. 

### Useful Resources
**change default eth amount in Ganache**
[Connect Ganache GUI to Ganache CLI? ](https://github.com/trufflesuite/ganache/issues/322)
> you can modify your settings file:

> MacOS: `~/Library/Application\ Support/Ganache/Settings`

> Windows: `%APPDATA%\Ganache\Settings`

> Linux: either `$XDG_CONFIG_HOME/Ganache/Settings` or `~/.config/Ganache/Settings`

[Set custom ETH balance](https://github.com/trufflesuite/ganache/issues/84)

add `"default_balance_ether": 100000` to `Settings` file:
```
{
  "googleAnalyticsTracking": true,
  "cpuAndMemoryProfiling": false,
  "verboseLogging": false,
  "firstRun": false,
  "server": {
    "hostname": "127.0.0.1",
    "mnemonic": "...",
    "network_id": 5777,
    "port": 7545,
    "total_accounts": 10,
    "unlocked_accounts": [],
    "vmErrorsOnRPCResponse": true,
    "default_balance_ether": 1000000
  },
  "uuid": "...",
  "randomizeMnemonicOnStart": false
}
```

# Contributors

* Andrey Shishkin <motive.do@gmail.com>
* Scott Yu <scott@aqwire.io>


 [truffle]: <http://truffleframework.com/>


