const AqwireContract = artifacts.require('./AqwireContract.sol');
const AqwireToken = artifacts.require('./AqwireToken.sol');

const duration = {
  seconds: function (val) { return val; },
  minutes: function (val) { return val * this.seconds(60); },
  hours: function (val) { return val * this.minutes(60); },
  days: function (val) { return val * this.hours(24); },
  weeks: function (val) { return val * this.days(7); },
  years: function (val) { return val * this.days(365); },
};

module.exports = async function (deployer, network, accounts) {
  // multisig wallet address
  const multisigWallet = '0xddf00a7540a7b68fdca13705b5c83b685518b716';

  // owner of the crowdsale
  const owner = accounts[0];
    
  // wallet address where collected eth will be forwarded to
  const wallet = '0xddf00a7540a7b68fdca13705b5c83b685518b716'; 

  // ===== start crowdsale variables =====
  const time = 'Sun Aug 28 2018 18:30:00 GMT+0800';
  const unlockTime = new Date(time).getTime() / 1000;

  const ethUSD = 550; // abitrary rate (TBD)
  const qeyUSD = 0.15; // $0.15 per QEY
  const ethToQeyRate = new web3.BigNumber((ethUSD / qeyUSD).toFixed(0));

  const soldPrivateSaleETH = 10000;
  const soldPrivateSaleQEY = ethToQeyRate.mul(new web3.BigNumber(web3.toWei(soldPrivateSaleETH, 'ether'))).round(0);
  const soldPrivateSaleUSD = soldPrivateSaleETH * ethUSD;
  // ===== end crowdsale variables =====

  console.log('=============Start Deploy Token============');

  deployer.deploy(AqwireToken, { from: owner, overwrite: false}).then(async function () {
    const tokenAddress = AqwireToken.address;
    const CoinInstance = AqwireToken.at(tokenAddress);
    const totalSupply = await CoinInstance.totalSupply({ from: owner });
    await CoinInstance.addAddressToWhitelist(multisigWallet, { from: owner });
    // send sold qey during prsale to multisig
    await CoinInstance.transfer(multisigWallet, soldPrivateSaleQEY, { from: owner });
    //add private Agency addresses for token distribution
    await CoinInstance.addAddressToWhitelist(wallet, { from: owner });
    //set UnlockTime for freezing tokens
    await CoinInstance.setUnlockTime(unlockTime, { from: owner });
  });
};
