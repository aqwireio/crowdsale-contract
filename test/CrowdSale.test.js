import ether from 'openzeppelin-solidity/test/helpers/ether';
import assertRevert from 'openzeppelin-solidity/test/helpers/assertRevert';
import { advanceBlock } from 'openzeppelin-solidity/test/helpers/advanceToBlock';
import { increaseTimeTo, duration } from 'openzeppelin-solidity/test/helpers/increaseTime';
import latestTime from 'openzeppelin-solidity/test/helpers/latestTime';
import EVMRevert from 'openzeppelin-solidity/test/helpers/EVMRevert';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const AqwireContract = artifacts.require('./AqwireContract.sol');
const AqwireToken = artifacts.require('./AqwireToken.sol');

contract('AqwireContract', function (accounts) {
  // ==== accounts setup ====

  // owner of the crowdsale
  const owner = accounts[0];
  // wallet address where collected eth will be forwarded to
  const wallet = accounts[1]; // Develop
  // multisig wallet address
  const multisigWallet = accounts[2];
  // tokenWallet Address holding the tokens, which has approved allowance to the crowdsale
  const tokenWallet = accounts[3];

  const investor = accounts[4];
  const purchaser = accounts[5];
  const authorized = accounts[6];
  const unauthorized = accounts[7];
  const anotherAuthorized = accounts[8];
  
  // ==== variables setup =====

  const startDate = 'Sun Jul 1 2018 18:30:00 GMT+0800';
  const openingTime = new Date(startDate).getTime() / 1000;
  const closingTime = openingTime + duration.weeks(6);

  const ethUSD = 550; // abitrary rate for testing
  const qeyUSD = 0.15; // $0.15 per QEY
  const ethToQeyRate = new web3.BigNumber((ethUSD / qeyUSD).toFixed(0));

  const hardCapInUSD = 15000000;
  const soldPrivateSaleETH = 10000;
  const soldPrivateSaleUSD = soldPrivateSaleETH * ethUSD;
  const hardCapRemainUSD = hardCapInUSD - soldPrivateSaleUSD;
  const softCapInUSD = 3000000;
  const hardCapInEth = new web3.BigNumber((hardCapRemainUSD / ethUSD).toFixed(0));
  const hardCapInWei = (new web3.BigNumber(10).pow(18)).mul(hardCapInEth); // maximum amount of wei accepted in the crowdsale
  const softCapInEth = new web3.BigNumber((softCapInUSD / ethUSD).toFixed(0));
  const softCapInWei = (new web3.BigNumber(10).pow(18)).mul(softCapInEth); // minimum amount of funds to be raised in weis

  const minCapPerAddress = ether(0.1);
  const maxCapPerAddress = ether(500);

  const RATE = ethToQeyRate;
  const GOAL = softCapInWei;
  const CAP = hardCapInWei;
  const _moreThanhardCap = CAP.add(ether(1));
  const _hardCap = CAP;
  const _lessThanHardCap = CAP.sub(ether(1));
  const _moreThanSoftCap = GOAL.add(ether(1));
  const _softCap = GOAL;
  const _lessThanSoftCap = GOAL.add(ether(1));
  const _minCap = ether(0.1);
  const _lessThanMinCap = _minCap.sub(ether(0.05));
  const soldPrivateSaleQEY = RATE.mul(soldPrivateSaleETH).round(0);
  
  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();
  });

  beforeEach(async function () {
    this.startTime = latestTime() + duration.minutes(1);
    this.endTime = this.startTime + duration.weeks(6);
    this.beforeEndTime = this.endTime - duration.weeks(1);
    this.afterEndTime = this.endTime + duration.weeks(1);
    this._value = ether(1);
    this._value2 = ether(2);

    this.firstBonus = RATE.mul(1.10).round(0); //since we're dealing with wei <> qeybits
    this.secondBonus = RATE.mul(1.05).round(0);
    this.finalRate = RATE;
  
    this.firstTimeBonusChange = this.startTime + duration.weeks(1);
    this.secondTimeBonusChange = this.startTime + duration.weeks(2);

    this.token = await AqwireToken.new({ from: owner });
    this.crowdsale = await AqwireContract.new(
      this.startTime,
      this.endTime,
      RATE,
      wallet,
      CAP,
      owner,
      GOAL,
      this.token.address,
      { from: owner }
    );

    const CoinInstance = this.token;
    const crowdsaleAddress = this.crowdsale.address;
    const totalSupply = await CoinInstance.totalSupply({ from: owner });
    await CoinInstance.addAddressToWhitelist(crowdsaleAddress, { from: owner });
    await CoinInstance.setUnlockTime(this.endTime, { from: owner });

    // setup Bonus rates
    await this.crowdsale.setCurrentRate(this.firstBonus, this.secondBonus, this.finalRate, this.startTime, this.firstTimeBonusChange, this.secondTimeBonusChange);
    
    const whitelistedAddresses = [owner, investor, wallet, purchaser, authorized];

    // approve so they can invest in crowdsale
    await this.crowdsale.addManyToWhitelist(whitelistedAddresses);

    // set contribution cap for addresses
    await this.crowdsale.setGroupCap(whitelistedAddresses, maxCapPerAddress, minCapPerAddress);

    await CoinInstance.approve(crowdsaleAddress, totalSupply);
    await CoinInstance.transfer(multisigWallet, soldPrivateSaleQEY, { from: owner });
  });

  describe('buying tokens', function () {
    it('should create crowdsale with correct parameters', async function () {
      this.crowdsale.should.exist;
      this.token.should.exist;

      const rate = await this.crowdsale.rate();
      const walletAddress = await this.crowdsale.wallet();
      const goal = await this.crowdsale.goal();
      const cap = await this.crowdsale.cap();

      rate.should.be.bignumber.equal(RATE);
      walletAddress.should.be.equal(wallet);
      goal.should.be.bignumber.equal(GOAL);
      cap.should.be.bignumber.equal(CAP);

      console.info('======================== VARIABLES ========================');
      console.info('Crowdsale Owner', await this.crowdsale.owner());
      console.info('owner', owner);
      console.info('investor', investor);
      console.info('wallet', wallet);
      console.info('purchaser', purchaser);
      console.info('authorized', authorized);
      console.info('unauthorized', unauthorized);
      console.info('anotherAuthorized', anotherAuthorized);
      console.info('startTime', this.startTime);
      console.info('beforeEndTime', this.beforeEndTime);
      console.info('firstTimeBonusChange', this.firstTimeBonusChange);
      console.info('secondTimeBonusChange', this.secondTimeBonusChange);
      console.info('endTime', this.endTime);
      console.info('afterEndTime', this.afterEndTime);
      console.info('======================== VARIABLES ========================');
    });
    
    it('should not accept payments before start', async function () {
      await this.crowdsale.sendTransaction({ from: investor, to: this.crowdsale.address, value: this._value }).should.be.rejectedWith(EVMRevert);
    });
    
    it('transfer tokens to multisigWallet for tokens sold at private sale', async function () {
      const multisigQeyBalance = await this.token.balanceOf(multisigWallet);
      soldPrivateSaleQEY.should.be.bignumber.equal(multisigQeyBalance);
    });

    it('should remove funds from buyer', async function () {
      await this.crowdsale.setUserCap(investor, this._value2, _minCap);
      await increaseTimeTo(this.startTime);
      const walletBuyerBefore = web3.eth.getBalance(investor);
      const receipt = await this.crowdsale.sendTransaction(
        { from: investor, to: this.crowdsale.address, value: this._value });

      const walletBuyerAfter = web3.eth.getBalance(investor);

      const gasUsed = receipt.receipt.gasUsed;
      const tx = await web3.eth.getTransaction(receipt.tx);
      const gasPrice = tx.gasPrice;
      const txCost = gasPrice.mul(gasUsed);
      const expectedBuyerWallet = walletBuyerBefore.minus(this._value).minus(txCost);
      walletBuyerAfter.should.be.bignumber.equal(expectedBuyerWallet);
    });

    it('should assign tokens to sender and have First Bonus', async function () {
      await this.crowdsale.setUserCap(investor, this._value2, _minCap);
      await increaseTimeTo(this.startTime);
      const balanceBuyerBefore = await this.token.balanceOf(investor);

      await this.crowdsale.sendTransaction(
        { from: investor, to: this.crowdsale.address, value: this._value });

      const balanceBuyerAfter = await this.token.balanceOf(investor);
      balanceBuyerAfter.should.be.bignumber.equal(balanceBuyerBefore.add(this.firstBonus.mul(this._value)));
    });

    it('should assign tokens to sender and have Second Bonus', async function () {
      await this.crowdsale.setUserCap(investor, this._value2, _minCap);
      await increaseTimeTo(this.firstTimeBonusChange + duration.seconds(1000));
      const balanceBuyerBefore = await this.token.balanceOf(investor);

      await this.crowdsale.sendTransaction(
        { from: investor, to: this.crowdsale.address, value: this._value });

      const balanceBuyerAfter = await this.token.balanceOf(investor);
      balanceBuyerAfter.should.be.bignumber.equal(balanceBuyerBefore.add(this.secondBonus.mul(this._value)));
    });

    it('should assign tokens to sender and have Final Rate', async function () {
      await this.crowdsale.setUserCap(investor, this._value2, _minCap);
      await increaseTimeTo(this.secondTimeBonusChange + duration.seconds(10));
      const balanceBuyerBefore = await this.token.balanceOf(investor);

      await this.crowdsale.sendTransaction(
        { from: investor, to: this.crowdsale.address, value: this._value });

      const balanceBuyerAfter = await this.token.balanceOf(investor);
      balanceBuyerAfter.should.be.bignumber.equal(balanceBuyerBefore.add(this.finalRate.mul(this._value)));
    });

    it('reverts when trying to buy tokens when contract is paused', async function () {
      await this.crowdsale.pause({ from: owner });
      await assertRevert(this.crowdsale.sendTransaction(
        { from: investor, to: this.crowdsale.address, value: ether(1) }));
    });

    it('reverts when trying to buy tokens when contract is end', async function () {
      await increaseTimeTo(this.afterEndTime);
      await assertRevert(this.crowdsale.sendTransaction(
        { from: investor, to: this.crowdsale.address, value: ether(1) }));
    });
  });

  describe('Unlock tokens', function () {
    it('reverts when trying to send tokens when crowdsale is not finished', async function () {
      await this.crowdsale.setUserCap(investor, this._value2, _minCap);
      await increaseTimeTo(this.startTime);

      await this.crowdsale.sendTransaction(
        { from: investor, to: this.crowdsale.address, value: this._value });

      const balanceBuyerAfter = await this.token.balanceOf(investor);
      await this.token.transfer(authorized, balanceBuyerAfter, { from: investor }).should.be.rejectedWith(EVMRevert);
    });

    it('should assign when trying to send tokens when crowdsale is finished', async function () {
      await this.crowdsale.setUserCap(investor, this._value2, _minCap);
      await increaseTimeTo(this.beforeEndTime);

      await this.crowdsale.sendTransaction(
        { from: investor, to: this.crowdsale.address, value: this._value });

      const balanceBuyerAfter = await this.token.balanceOf(investor);
      await increaseTimeTo(this.afterEndTime); // force time to move after unlock
      await this.token.transfer(authorized, balanceBuyerAfter, { from: investor }).should.be.fulfilled;
    });

    it('should assign when trying to send tokens when user is whitelisted', async function () {
      await this.crowdsale.setUserCap(investor, this._value2, _minCap);
      await increaseTimeTo(this.startTime);

      await this.crowdsale.sendTransaction(
        { from: investor, to: this.crowdsale.address, value: this._value });

      const balanceBuyerAfter = await this.token.balanceOf(investor);
      await this.token.addAddressToWhitelist(investor);
      const unlockTime = await this.token.unlockTime();
      await this.token.transfer(authorized, balanceBuyerAfter, { from: investor }).should.be.fulfilled;
    });
  });

  describe('Whitelisting', function () {
    beforeEach(async function () {
      await await increaseTimeTo(this.startTime);

      // ensure whitelisted
      await this.crowdsale.addManyToWhitelist([authorized, anotherAuthorized]);
    });

    describe('accepting payments', function () {
      it('should accept payments to whitelisted (from whichever buyers)', async function () {
        await this.crowdsale.setUserCap(authorized, this._value2, _minCap);
        await this.crowdsale.setUserCap(unauthorized, this._value2, _minCap);
        await this.crowdsale.buyTokens(authorized, { value: this._value, from: authorized }).should.be.fulfilled;
        await this.crowdsale.buyTokens(authorized, { value: this._value, from: unauthorized }).should.be.fulfilled;
      });

      it('should reject payments to not whitelisted (from whichever buyers)', async function () {
        await this.crowdsale.setUserCap(authorized, this._value2, _minCap);
        await this.crowdsale.setUserCap(unauthorized, this._value2, _minCap);
        await this.crowdsale.send({ value: this._value, from: unauthorized }).should.be.rejected;

        await this.crowdsale.buyTokens(unauthorized, { value: this._value, from: unauthorized }).should.be.rejected;
        await this.crowdsale.buyTokens(unauthorized, { value: this._value, from: authorized }).should.be.rejected;
      });

      it('should reject payments to addresses removed from whitelist', async function () {
        await this.crowdsale.setUserCap(authorized, this._value2, _minCap);
        await this.crowdsale.removeFromWhitelist(authorized);
        await this.crowdsale.buyTokens(authorized, { value: this._value, from: authorized }).should.be.rejected;
      });
    });

    describe('reporting whitelisted', function () {
      it('should correctly report whitelisted addresses', async function () {
        let isAuthorized = await this.crowdsale.whitelist(authorized);
        isAuthorized.should.equal(true);

        let isntAuthorized = await this.crowdsale.whitelist(unauthorized);
        isntAuthorized.should.equal(false);
      });
    });

    describe('accepting payments', function () {
      it('should accept payments to whitelisted (from whichever buyers)', async function () {
        await this.crowdsale.setUserCap(authorized, this._value2, _minCap);
        await this.crowdsale.setUserCap(unauthorized, this._value2, _minCap);
        await this.crowdsale.setUserCap(anotherAuthorized, this._value2, _minCap);
        await this.crowdsale.buyTokens(authorized, { value: this._value, from: authorized }).should.be.fulfilled;
        await this.crowdsale.buyTokens(authorized, { value: this._value, from: unauthorized }).should.be.fulfilled;
        await this.crowdsale.buyTokens(anotherAuthorized, {
          value: this._value,
          from: authorized,
        }).should.be.fulfilled;
        await this.crowdsale.buyTokens(anotherAuthorized, {
          value: this._value,
          from: unauthorized,
        }).should.be.fulfilled;
      });

      it('should reject payments to not whitelisted (with whichever buyers)', async function () {
        await this.crowdsale.setUserCap(authorized, this._value2, _minCap);
        await this.crowdsale.setUserCap(unauthorized, this._value2, _minCap);
        await this.crowdsale.send({ value: this._value, from: unauthorized }).should.be.rejected;

        await this.crowdsale.buyTokens(unauthorized, { value: this._value, from: unauthorized }).should.be.rejected;
        await this.crowdsale.buyTokens(unauthorized, { value: this._value, from: authorized }).should.be.rejected;
      });

      it('should reject payments to addresses removed from whitelist', async function () {
        await this.crowdsale.setUserCap(authorized, this._value2, _minCap);
        await this.crowdsale.setUserCap(anotherAuthorized, this._value2, _minCap);
        await this.crowdsale.removeFromWhitelist(anotherAuthorized);
        await this.crowdsale.buyTokens(authorized, { value: this._value, from: authorized }).should.be.fulfilled;
        await this.crowdsale.buyTokens(anotherAuthorized, {
          value: this._value,
          from: authorized,
        }).should.be.rejected;
      });
    });

    describe('reporting whitelisted', function () {
      it('should correctly report whitelisted addresses', async function () {
        let isAuthorized = await this.crowdsale.whitelist(authorized);
        isAuthorized.should.equal(true);

        let isAnotherAuthorized = await this.crowdsale.whitelist(anotherAuthorized);
        isAnotherAuthorized.should.equal(true);

        let isntAuthorized = await this.crowdsale.whitelist(unauthorized);
        isntAuthorized.should.equal(false);
      });
    });
  });

  describe('softCap handling', function () {
    it('should deny refunds before end', async function () {
      await this.crowdsale.claimRefund({ from: investor }).should.be.rejectedWith(EVMRevert);
      await increaseTimeTo(this.startTime);
      await this.crowdsale.claimRefund({ from: investor }).should.be.rejectedWith(EVMRevert);
    });

    it('should deny refunds after end if goal was reached', async function () {
      await this.crowdsale.setUserCap(investor, _moreThanSoftCap, _minCap);
      await increaseTimeTo(this.startTime);
      await this.crowdsale.sendTransaction({ value: _moreThanSoftCap, from: investor });
      await increaseTimeTo(this.afterEndTime);
      await this.crowdsale.claimRefund({ from: investor }).should.be.rejectedWith(EVMRevert);
    });

    it('should allow refunds after end if goal was not reached', async function () {
      await this.crowdsale.setUserCap(investor, _moreThanSoftCap, _minCap);
      await increaseTimeTo(this.startTime);
      await this.crowdsale.sendTransaction({ value: ether(100), from: investor });
      await increaseTimeTo(this.afterEndTime);
      await this.crowdsale.finalize({ from: owner });
      const pre = web3.eth.getBalance(investor);
      await this.crowdsale.claimRefund({ from: investor, gasPrice: 0 })
        .should.be.fulfilled;
      const post = web3.eth.getBalance(investor);
      post.minus(pre).should.be.bignumber.equal(ether(100));
    });

    it('should forward funds to wallet after end if goal was reached', async function () {
      await this.crowdsale.setUserCap(investor, _lessThanHardCap, _minCap);
      await increaseTimeTo(this.startTime);
      await this.crowdsale.sendTransaction({ value: _softCap, from: investor });
      await increaseTimeTo(this.afterEndTime);
      const pre = web3.eth.getBalance(wallet);
      await this.crowdsale.finalize({ from: owner });
      const post = web3.eth.getBalance(wallet);
      post.minus(pre).should.be.bignumber.equal(_softCap);
    });
  });
  
  describe('hardCap handling', function () {
    beforeEach(async function () {
      await increaseTimeTo(this.startTime);
    });

    describe('accepting payments', function () {
      it('should accept payments within cap', async function () {
        await this.crowdsale.setUserCap(investor, _moreThanhardCap, _minCap);
        let amount = _hardCap.minus(_lessThanHardCap);
        await this.crowdsale.sendTransaction({ value: amount, from: investor }).should.be.fulfilled;
        await this.crowdsale.sendTransaction({ value: _lessThanHardCap, from: investor }).should.be.fulfilled;
      });
  
      it('should reject payments outside cap', async function () {
        await this.crowdsale.setUserCap(investor, _moreThanhardCap, _minCap);
        await this.crowdsale.sendTransaction({ value: _hardCap, from: investor });
        await this.crowdsale.sendTransaction({ value: 1, from: investor }).should.be.rejectedWith(EVMRevert);
      });
  
      it('should reject payments that exceed cap', async function () {
        await this.crowdsale.setUserCap(investor, _moreThanhardCap, _minCap);
        let amount = _hardCap.add(1);
        await this.crowdsale.sendTransaction({ value: amount, from: investor }).should.be.rejectedWith(EVMRevert);
      });
    });

    describe('ending', function () {
      it('should not reach cap if sent under cap', async function () {
        await this.crowdsale.setUserCap(investor, _moreThanhardCap, _minCap);
        let capReached = await this.crowdsale.capReached();
        capReached.should.equal(false);
        await this.crowdsale.sendTransaction({ value: _lessThanHardCap, from: investor });
        capReached = await this.crowdsale.capReached();
        capReached.should.equal(false);
      });
  
      it('should not reach cap if sent just under cap', async function () {
        await this.crowdsale.setUserCap(investor, _moreThanhardCap, _minCap);
        let amount = _hardCap.minus(1);
        await this.crowdsale.sendTransaction({ value: amount, from: investor });
        let capReached = await this.crowdsale.capReached();
        capReached.should.equal(false);
      });
  
      it('should reach cap if cap sent', async function () {
        await this.crowdsale.setUserCap(investor, _moreThanhardCap, _minCap);
        await this.crowdsale.sendTransaction({ value: _hardCap, from: investor });
        let capReached = await this.crowdsale.capReached();
        capReached.should.equal(true);
      });
    });

    describe('Individual max contribution cap', function () {
      it('should fail if below max limit', async function () {
        await this.crowdsale.setUserCap(investor, this._value, _minCap);
        await this.crowdsale.sendTransaction({ from: investor, to: this.crowdsale.address, value: this._value2 }).should.be.rejectedWith(EVMRevert);
      });

      it('should allow if exactly max limit', async function () {
        await this.crowdsale.setUserCap(investor, this._value2, _minCap);
        await this.crowdsale.sendTransaction({ from: investor, to: this.crowdsale.address, value: this._value2 }).should.be.fulfilled;
      });

      it('should allow if less than max limit', async function () {
        await this.crowdsale.setUserCap(investor, this._value2, _minCap);
        await this.crowdsale.sendTransaction({ from: investor, to: this.crowdsale.address, value: this._value }).should.be.fulfilled;
      });
    });

    describe('Individual min contribution cap', function () {
      it('should fail if below min limit', async function () {
        await this.crowdsale.setUserCap(investor, this._value, _minCap);
        await this.crowdsale.sendTransaction({ from: investor, to: this.crowdsale.address, value: _lessThanMinCap }).should.be.rejectedWith(EVMRevert);
      });

      it('should allow if exactly min limit', async function () {
        await this.crowdsale.setUserCap(investor, this._value2, _minCap);
        await this.crowdsale.sendTransaction({ from: investor, to: this.crowdsale.address, value: _minCap }).should.be.fulfilled;
      });

      it('should allow if more than min limit', async function () {
        await this.crowdsale.setUserCap(investor, this._value2, _minCap);
        await this.crowdsale.sendTransaction({ from: investor, to: this.crowdsale.address, value: this._value }).should.be.fulfilled;
      });
    });
  });
});
