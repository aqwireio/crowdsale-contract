<a href="https://aqwire.io/">
    <img src="https://cdn-images-1.medium.com/max/1000/1*oWcFukUctnjw0SHBWBSxEA.png"
         align="right" valign="top" alt="AQWIRE logo" />
</a>

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
> Token Supply: 180 million | 90 million will be sold (50%)
> Price per token: $0.11
> Cap: $9.9M Hardcap | $5M Softcap
> Duration: Presale is LIVE and will run until June 15.
> Bonuses: Up to 15% Bonus.

For more information about AQWIRE and the crowdsale, go to:

[AQWIRE KYC and Whitelisting process](https://medium.com/aqwire/https-medium-com-aqwire-aqwire-kyc-whitelisting-how-does-it-work-982cd51a8310)
[AQWIRE KYC site](https://aqwire.io/kyc)
[AQWIRE Whitepaper](https://aqwire.io/#whitepaper)
[AQWIRE FAQ](https://medium.com/aqwire/https-medium-com-inno-91650-aqwire-frequently-asked-questions-e65555cb26eb)

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

# Contributors

* Andrey Shishkin <motive.do@gmail.com>
* Scott Yu <scott@qwikwire.com>


   [truffle]: <http://truffleframework.com/>
