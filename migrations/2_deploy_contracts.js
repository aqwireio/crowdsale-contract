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
  // owner of the crowdsale
  const owner = accounts[0];
    
  // wallet where the ehter will get deposited
  const wallet = accounts[1]; // Develop
    
  // tokenWallet Address holding the tokens, which has approved allowance to the crowdsale
  const tokenWallet = accounts[0];

  const rate = new web3.BigNumber(100);
  const openingTime = Date.now() / 1000 | 0 + 1000;
  const closingTime = openingTime + duration.weeks(4);
  const hardCap = 300 * (10 ** 18);
  const softCap = 2 * (10 ** 18);
  console.log(openingTime, closingTime, rate, wallet, hardCap, tokenWallet, softCap);

  const firstBonus = new web3.BigNumber(110);
  const secondBonus = new web3.BigNumber(105);
  const finalRate = rate;

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
      rate,
      wallet,
      hardCap,
      tokenWallet,
      softCap,
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
    });
  });
};
