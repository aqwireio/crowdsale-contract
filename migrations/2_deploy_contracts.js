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
  const multisigWallet = accounts[1];

  // owner of the crowdsale
  const owner = accounts[0];
    
  // wallet address where collected eth will be forwarded to
  const wallet = accounts[1]; // Develop
    
  // tokenWallet Address holding the tokens, which has approved allowance to the crowdsale
  const tokenWallet = accounts[0];

  const startDate = 'Sun Jul 1 2018 18:30:00 GMT+0800';
  const ethUSD = 550;
  const qeyUSD = 0.15;

  const ethToQeyRate = new web3.BigNumber((ethUSD / qeyUSD).toString());

  const openingTime = new Date(startDate).getTime() / 1000;
  const closingTime = openingTime + duration.weeks(6);

  const hardCapInUSD = 15000000;
  const soldPrivateSaleETH = 1000;
  const soldPrivateSaleUSD = soldPrivateSaleETH * ethUSD;
  const soldPrivateSaleQEY = soldPrivateSaleETH * ethToQeyRate;
  const hardCapRemainUSD = hardCapInUSD - soldPrivateSaleUSD;
  const softCapInUSD = 3000000;
  const hardCapInEth = new web3.BigNumber((hardCapRemainUSD / ethUSD).toString()).toNumber();
  const hardCapInWei = hardCapInEth * (10 ** 18); // maximum amount of wei accepted in the crowdsale
  const softCapInEth = new web3.BigNumber((softCapInUSD / ethUSD).toString()).toNumber();
  const softCapInWei = softCapInEth * (10 ** 18); // minimum amount of funds to be raised in weis

  console.log(openingTime, closingTime, ethToQeyRate, wallet, hardCapInWei, tokenWallet, softCapInWei);

  const firstBonus = ethToQeyRate.mul(1.10);
  const secondBonus = ethToQeyRate.mul(1.05);
  const finalRate = ethToQeyRate;

  const startTime = openingTime;
  const firstTimeBonusChange = openingTime + duration.weeks(1);
  const secondTimeBonusChange = openingTime + duration.weeks(2);

  console.log('=============Start Deploy============');

  deployer.deploy(AqwireToken, { from: owner }).then(function () {
    const tokenAddress = AqwireToken.address;
    return deployer.deploy(
      AqwireContract,
      openingTime,
      closingTime,
      ethToQeyRate,
      wallet,
      hardCapInWei,
      tokenWallet,
      softCapInWei,
      AqwireToken.address,
      { from: owner }
    ).then(async function () {
      const CoinInstance = AqwireToken.at(tokenAddress);
      const crowdsaleAddress = AqwireContract.address;
      const ContractInstance = AqwireContract.at(crowdsaleAddress);
      const totalSupply = await CoinInstance.totalSupply({ from: owner });
      await CoinInstance.addAddressToWhitelist(crowdsaleAddress, { from: owner });
      await CoinInstance.setUnlockTime(closingTime, { from: owner });
      // setup Bonus rates
      await ContractInstance.setCurrentRate(firstBonus, secondBonus, finalRate, startTime, firstTimeBonusChange, secondTimeBonusChange);

      // await CoinInstance.transfer(tokenWallet, totalSupply, { from: owner });
      await CoinInstance.approve(crowdsaleAddress, totalSupply, { from: tokenWallet });

      // send sold qey during prsale to multisig
      await CoinInstance.transfer(multisigWallet, soldPrivateSaleQEY, { from: owner });
    });
  });
};
