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
  // multisigwallet address where collected eth will be forwarded to
  const wallet = '0xBe91BB57BD54f9Ac75472E7f6556563960297548';

  // owner of the crowdsale
  const owner = accounts[0];
    
  // tokenWallet Address holding the tokens, which has approved allowance to the crowdsale
  const tokenWallet = accounts[0];

  // ===== start crowdsale variables =====
  const startDate = 'Mon, 08 Oct 2018 16:30:00 +0800'; // RFC 2822 format
  const openingTime = new Date(startDate).getTime() / 1000;
  const closingTime = openingTime + duration.weeks(6);
  const firstTimeBonusChange = openingTime + duration.weeks(1);
  const secondTimeBonusChange = openingTime + duration.weeks(2);

  const ethUSD = 550; // abitrary rate (TBD)
  const qeyUSD = 0.15; // $0.15 per QEY
  const ethToQeyRate = new web3.BigNumber((ethUSD / qeyUSD).toFixed(0));

  const hardCapInUSD = 15000000;
  const soldPrivateSaleETH = 10000;
  const soldPrivateSaleQEY = ethToQeyRate.mul(new web3.BigNumber(web3.toWei(soldPrivateSaleETH, 'ether'))).round(0);
  const soldPrivateSaleUSD = soldPrivateSaleETH * ethUSD;
  const hardCapRemainUSD = hardCapInUSD - soldPrivateSaleUSD;
  const softCapInUSD = 3000000;
  const hardCapInEth = new web3.BigNumber((hardCapRemainUSD / ethUSD).toFixed(0));
  const hardCapInWei = (new web3.BigNumber(10).pow(18)).mul(hardCapInEth); // maximum amount of wei accepted in the crowdsale
  const softCapInEth = new web3.BigNumber((softCapInUSD / ethUSD).toFixed(0));
  const softCapInWei = (new web3.BigNumber(10).pow(18)).mul(softCapInEth); // minimum amount of funds to be raised in weis

  const firstBonus = ethToQeyRate.mul(1.10).round(0);
  const secondBonus = ethToQeyRate.mul(1.05).round(0);
  const finalRate = ethToQeyRate;

  const minCapPerAddress = new web3.BigNumber(web3.toWei(0.1, 'ether'));
  const maxCapPerAddress = new web3.BigNumber(web3.toWei(500, 'ether'));
  // ===== end crowdsale variables =====

  deployer.deploy(AqwireToken, { from: owner, overwrite: false}).then(function () {
    console.log('============= Start Deploy Crowdsale Contract ============');

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
      minCapPerAddress,
      maxCapPerAddress,
      AqwireToken.address,
      { from: owner }
    ).then(async function () {
      const CoinInstance = AqwireToken.at(tokenAddress);
      const crowdsaleAddress = AqwireContract.address;
      const ContractInstance = AqwireContract.at(crowdsaleAddress);
      const totalSupply = await CoinInstance.totalSupply({ from: owner });
      const crowdSaleSupply = totalSupply - soldPrivateSaleQEY;
      await CoinInstance.addAddressToWhitelist(crowdsaleAddress, { from: owner });
      await CoinInstance.setUnlockTime(closingTime, { from: owner });
      // setup Bonus rates
      await ContractInstance.setCurrentRate(firstBonus, secondBonus, finalRate, openingTime, firstTimeBonusChange, secondTimeBonusChange);

      // approve crowdsale contract with token supply for sale
      await CoinInstance.approve(crowdsaleAddress, crowdSaleSupply, { from: tokenWallet });

      console.log('============= End Deploy Crowdsale Contract ============');
    });
  });
};