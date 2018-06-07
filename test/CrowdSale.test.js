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

contract('AqwireContract', function ([owner, wallet, investor, purchaser, authorized, unauthorized, anotherAuthorized]) {
  const RATE = new BigNumber(100);
  const GOAL = ether(3);
  const CAP = ether(5);
  const _moreThanhardCap = ether(7);
  const _hardCap = ether(5);
  const _lessThanHardCap = ether(4);
  const _softCap = ether(3);
  const _lessThanSoftCap = ether(2);
  
  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();
  });

  beforeEach(async function () {
    this.startTime = latestTime() + duration.weeks(1);
    this.endTime = this.startTime + duration.weeks(4);
    this.afterEndTime = this.endTime + duration.seconds(10);
    this._value = ether(1);
    this._value2 = ether(2);
    this.tokens = RATE.mul(this._value);

    this.firstBonus = new web3.BigNumber(110);
    this.secondBonus = new web3.BigNumber(105);
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
    // await CoinInstance.transfer(owner, totalSupply, { from: owner });

    // setup Bonus rates
    await this.crowdsale.setCurrentRate(this.firstBonus, this.secondBonus, this.finalRate, this.startTime, this.firstTimeBonusChange, this.secondTimeBonusChange);
    
    // approve so they can invest in crowdsale
    await this.crowdsale.addToWhitelist(owner);
    await this.crowdsale.addToWhitelist(investor);
    await this.crowdsale.addToWhitelist(wallet);
    await this.crowdsale.addToWhitelist(purchaser);
    await this.crowdsale.addToWhitelist(authorized);

    await CoinInstance.approve(crowdsaleAddress, totalSupply);
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

      console.log('Crowdsale Owner', await this.crowdsale.owner());
      console.log('test owner', owner);
      console.log('test investor', investor);
      console.log('test wallet', wallet);
      console.log('test purchaser', purchaser);
      console.log('test authorized', authorized);
      console.log('test unauthorized', unauthorized);
      console.log('test anotherAuthorized', anotherAuthorized);
      console.log('test firstTimeBonusChange', this.firstTimeBonusChange + duration.seconds(1000));
      console.log('test secondTimeBonusChange', this.secondTimeBonusChange + duration.seconds(1000));
    });
    
    it('should not accept payments before start', async function () {
      await this.crowdsale.sendTransaction({ from: investor, to: this.crowdsale.address, value: this._value }).should.be.rejectedWith(EVMRevert);
    });
    
    it('should remove funds from buyer', async function () {
      await this.crowdsale.setUserCap(investor, this._value2);
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
      await this.crowdsale.setUserCap(investor, this._value2);
      await increaseTimeTo(this.startTime);
      const balanceBuyerBefore = await this.token.balanceOf(investor);

      await this.crowdsale.sendTransaction(
        { from: investor, to: this.crowdsale.address, value: this._value });

      const balanceBuyerAfter = await this.token.balanceOf(investor);
      balanceBuyerAfter.should.be.bignumber.equal(balanceBuyerBefore.add(this.firstBonus.mul(this._value)));
    });

    it('should assign tokens to sender and have Second Bonus', async function () {
      await this.crowdsale.setUserCap(investor, this._value2);
      await increaseTimeTo(this.firstTimeBonusChange + duration.seconds(1000));
      const balanceBuyerBefore = await this.token.balanceOf(investor);

      await this.crowdsale.sendTransaction(
        { from: investor, to: this.crowdsale.address, value: this._value });

      const balanceBuyerAfter = await this.token.balanceOf(investor);
      balanceBuyerAfter.should.be.bignumber.equal(balanceBuyerBefore.add(this.secondBonus.mul(this._value)));
    });

    it('should assign tokens to sender and have Final Rate', async function () {
      await this.crowdsale.setUserCap(investor, this._value2);
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
      await increaseTimeTo(this.afterEnd);
      await assertRevert(this.crowdsale.sendTransaction(
        { from: investor, to: this.crowdsale.address, value: ether(1) }));
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
        await this.crowdsale.setUserCap(authorized, this._value2);
        await this.crowdsale.setUserCap(unauthorized, this._value2);
        await this.crowdsale.buyTokens(authorized, { value: this._value, from: authorized }).should.be.fulfilled;
        await this.crowdsale.buyTokens(authorized, { value: this._value, from: unauthorized }).should.be.fulfilled;
      });

      it('should reject payments to not whitelisted (from whichever buyers)', async function () {
        await this.crowdsale.setUserCap(authorized, this._value2);
        await this.crowdsale.setUserCap(unauthorized, this._value2);
        await this.crowdsale.send({ value: this._value, from: unauthorized }).should.be.rejected;

        await this.crowdsale.buyTokens(unauthorized, { value: this._value, from: unauthorized }).should.be.rejected;
        await this.crowdsale.buyTokens(unauthorized, { value: this._value, from: authorized }).should.be.rejected;
      });

      it('should reject payments to addresses removed from whitelist', async function () {
        await this.crowdsale.setUserCap(authorized, this._value2);
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
        await this.crowdsale.setUserCap(authorized, this._value2);
        await this.crowdsale.setUserCap(unauthorized, this._value2);
        await this.crowdsale.setUserCap(anotherAuthorized, this._value2);
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
        await this.crowdsale.setUserCap(authorized, this._value2);
        await this.crowdsale.setUserCap(unauthorized, this._value2);
        await this.crowdsale.send({ value: this._value, from: unauthorized }).should.be.rejected;

        await this.crowdsale.buyTokens(unauthorized, { value: this._value, from: unauthorized }).should.be.rejected;
        await this.crowdsale.buyTokens(unauthorized, { value: this._value, from: authorized }).should.be.rejected;
      });

      it('should reject payments to addresses removed from whitelist', async function () {
        await this.crowdsale.setUserCap(authorized, this._value2);
        await this.crowdsale.setUserCap(anotherAuthorized, this._value2);
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
      await this.crowdsale.setUserCap(investor, _lessThanHardCap);
      await increaseTimeTo(this.startTime);
      await this.crowdsale.sendTransaction({ value: _softCap, from: investor });
      await increaseTimeTo(this.afterEndTime);
      await this.crowdsale.claimRefund({ from: investor }).should.be.rejectedWith(EVMRevert);
    });

    it('should allow refunds after end if goal was not reached', async function () {
      await this.crowdsale.setUserCap(investor, _lessThanHardCap);
      await increaseTimeTo(this.startTime);
      await this.crowdsale.sendTransaction({ value: _lessThanSoftCap, from: investor });
      await increaseTimeTo(this.afterEndTime);
      await this.crowdsale.finalize({ from: owner });
      const pre = web3.eth.getBalance(investor);
      await this.crowdsale.claimRefund({ from: investor, gasPrice: 0 })
        .should.be.fulfilled;
      const post = web3.eth.getBalance(investor);
      post.minus(pre).should.be.bignumber.equal(_lessThanSoftCap);
    });

    it('should forward funds to wallet after end if goal was reached', async function () {
      await this.crowdsale.setUserCap(investor, _lessThanHardCap);
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
        await this.crowdsale.setUserCap(investor, _moreThanhardCap);
        let amount = _hardCap.minus(_lessThanHardCap);
        await this.crowdsale.sendTransaction({ value: amount, from: investor }).should.be.fulfilled;
        await this.crowdsale.sendTransaction({ value: _lessThanHardCap, from: investor }).should.be.fulfilled;
      });
  
      it('should reject payments outside cap', async function () {
        await this.crowdsale.setUserCap(investor, _moreThanhardCap);
        await this.crowdsale.sendTransaction({ value: _hardCap, from: investor });
        await this.crowdsale.sendTransaction({ value: 1, from: investor }).should.be.rejectedWith(EVMRevert);
      });
  
      it('should reject payments that exceed cap', async function () {
        await this.crowdsale.setUserCap(investor, _moreThanhardCap);
        let amount = _hardCap.add(1);
        await this.crowdsale.sendTransaction({ value: amount, from: investor }).should.be.rejectedWith(EVMRevert);
      });
    });

    describe('ending', function () {
      it('should not reach cap if sent under cap', async function () {
        await this.crowdsale.setUserCap(investor, _moreThanhardCap);
        let capReached = await this.crowdsale.capReached();
        capReached.should.equal(false);
        await this.crowdsale.sendTransaction({ value: _lessThanHardCap, from: investor });
        capReached = await this.crowdsale.capReached();
        capReached.should.equal(false);
      });
  
      it('should not reach cap if sent just under cap', async function () {
        await this.crowdsale.setUserCap(investor, _moreThanhardCap);
        let amount = _hardCap.minus(1);
        await this.crowdsale.sendTransaction({ value: amount, from: investor });
        let capReached = await this.crowdsale.capReached();
        capReached.should.equal(false);
      });
  
      it('should reach cap if cap sent', async function () {
        await this.crowdsale.setUserCap(investor, _moreThanhardCap);
        await this.crowdsale.sendTransaction({ value: _hardCap, from: investor });
        let capReached = await this.crowdsale.capReached();
        capReached.should.equal(true);
      });
    });

    describe('Individual contribution cap', function () {
      it('should fail if below limit', async function () {
        await this.crowdsale.setUserCap(investor, this._value);
        await this.crowdsale.sendTransaction({ from: investor, to: this.crowdsale.address, value: this._value2 }).should.be.rejectedWith(EVMRevert);
      });

      it('should allow if exactly max limit', async function () {
        await this.crowdsale.setUserCap(investor, this._value2);
        await this.crowdsale.sendTransaction({ from: investor, to: this.crowdsale.address, value: this._value2 }).should.be.fulfilled;
      });

      it('should allow if less than max limit', async function () {
        await this.crowdsale.setUserCap(investor, this._value2);
        await this.crowdsale.sendTransaction({ from: investor, to: this.crowdsale.address, value: this._value }).should.be.fulfilled;
      });
    });

  });
});
