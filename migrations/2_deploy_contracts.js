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


module.exports = async function(deployer, network, accounts) {

    // owner of the crowdsale
    const owner = accounts[0];
    
    // wallet where the ehter will get deposited
    const wallet = '0xb0ac3d14b456b070544Dd960bf3a516Ee6C1E4Fe';
    //const wallet = '0xfB4CC5388846F303d2280E071aA0331B59bB009a'; //Develop
    
    // tokenWallet Address holding the tokens, which has approved allowance to the crowdsale
    const tokenWallet = '0x1CcaC55a4cF6B4a4498F2c5d939Af4cfADF0F0A5';
    //const tokenWallet = '0x572813700Adda59F3EAa52B244c4FD716FA7bc48'; //Develop

    const rate = new web3.BigNumber(10);
    console.log("rate " + rate);
    const openingTime = Date.now()/1000|0 + 1000;
    console.log("openingTime " + openingTime);
    const closingTime = openingTime + duration.weeks(1);
    console.log("closingTime " + closingTime);
    const hardCap = 300 * (10 ** 18);
    const softCap = 2 * (10 ** 18);
    console.log(openingTime, closingTime, rate, wallet, hardCap, tokenWallet, softCap);


    console.log("=============Start Deploy============");

    deployer.deploy(AqwireToken).then(function() {
        console.log("AqwireToken " + AqwireToken.address);
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
            AqwireToken.address
        ).then(async function() {
            const CoinInstance = AqwireToken.at(tokenAddress);
            const crowdsaleAddress = AqwireContract.address;
            const totalSupply = await CoinInstance.totalSupply();
            await CoinInstance.transfer(tokenWallet, totalSupply);
            await CoinInstance.approve(crowdsaleAddress, totalSupply);
        });
    });
    

};




