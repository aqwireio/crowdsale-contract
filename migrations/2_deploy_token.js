const AqwireToken = artifacts.require('./AqwireToken.sol');

module.exports = async function (deployer, network, accounts) {
  // ===== AQWIRE Token variables =====
  // multisig wallet address
  const multisigWallet = '0xBe91BB57BD54f9Ac75472E7f6556563960297548';
  const oneYearFromNow = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).getTime() / 1000;

  // owner of the crowdsale
  const owner = accounts[0];
  // ===== AQWIRE Token variables =====

  deployer.deploy(AqwireToken, { from: owner, overwrite: false}).then(async function () {
    console.log('============= Start Deploy Token Contract ============');
    const tokenAddress = AqwireToken.address;
    const CoinInstance = AqwireToken.at(tokenAddress);
    const totalSupply = await CoinInstance.totalSupply({ from: owner });
    // set unlocktime a year from deployment until crowdsale or manual override
    await CoinInstance.setUnlockTime(oneYearFromNow);
    // whitelist multisig wallet address, subsequent private sale addresses can be added here.
    await CoinInstance.addAddressToWhitelist(multisigWallet, { from: owner });
    console.log('============= End Deploy Token Contract ============');
  });
};
