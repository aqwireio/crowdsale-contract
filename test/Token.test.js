import assertRevert from 'openzeppelin-solidity/test/helpers/assertRevert';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const AqwireToken = artifacts.require('./AqwireToken.sol');
  
contract('AqwireToken', accounts => {
  let aqwireToken;
  
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  
  // owner of the token contract
  var _owner = accounts[0];
  var _receiver = accounts[1];
  
  const _name = 'Aqwire Token';
  const _symbol = 'QEY';
  const _decimals = 18;
  const _totalSupply = 250000000 * 1e+18;
  
  beforeEach('setup contract for each test', async function () {
    aqwireToken = await AqwireToken.new({ from: _owner });
  });
  
  it('has an owner', async function () {
    const owner = await aqwireToken.owner();
    assert.equal(owner, _owner);
  });
  
  it('has a name', async function () {
    const name = await aqwireToken.name();
    assert.equal(name, _name);
  });
  
  it('has a symbol', async function () {
    const symbol = await aqwireToken.symbol();
    assert.equal(symbol, _symbol);
  });
  
  it('has an amount of decimals', async function () {
    const decimals = await aqwireToken.decimals();
    assert.equal(decimals, _decimals);
  });
  
  it('has a total supply', async function () {
    const totalSupply = await aqwireToken.totalSupply();
    assert.equal(totalSupply, _totalSupply);
  });
  
  it('tranfered the total supply to owner during contract creation', async function () {
    const balance = await aqwireToken.balanceOf(_owner);
    assert.equal(balance, _totalSupply);
  });
  
  it('refuses ETH payments', async function () {
    await assertRevert(aqwireToken.sendTransaction({ from: _owner, to: _receiver, value: 10 }));
  });
  
  describe('it transfers some AqwireToken, alignes balances ' +
    'and emits a transfer event, under certain conditions', function () {
    describe('when the recipient is not the zero address', function () {
      describe('when the sender does not have enough balance', function () {
        it('reverts', async function () {
          await assertRevert(aqwireToken.transfer(_receiver, _totalSupply * 10, { from: _owner }));
        });
      });
  
      describe('when the sender has enough balance', function () {
        it('it transfers some AqwireToken, alignes balances and emits a transfer event', async function () {
          const balanceReceiverBefore = await aqwireToken.balanceOf(_receiver);
          assert.equal(balanceReceiverBefore, 0);
          const balanceOwnerBefore = await aqwireToken.balanceOf(_owner);
          assert.equal(balanceOwnerBefore, _totalSupply);
  
          const { logs } = await aqwireToken.transfer(_receiver, 1000);
          const balanceOwnerAfter = await aqwireToken.balanceOf(_owner);
          const balanceReceiverAfter = await aqwireToken.balanceOf(_receiver);
  
          assert.equal(balanceOwnerAfter, _totalSupply - 1000);
          assert.equal(balanceReceiverAfter, 1000);
  
          assert.equal(logs[0].event, 'Transfer');
          assert.equal(logs[0].args.from, _owner);
          assert.equal(logs[0].args.to, _receiver);
          assert.equal(logs[0].args.value, 1000);
        });
      });
    });
  
    describe('when the recipient is the zero address', function () {
      it('reverts', async function () {
        await assertRevert(aqwireToken.transfer(ZERO_ADDRESS, 1000, { from: _owner }));
      });
    });
  });
  
  describe('as a basic burnable token', function () {
    const from = _receiver;
    const amount = 1000;
    describe('when sender is not in whitelist', function () {
      it('reverts', async function () {
        await aqwireToken.removeAddressFromWhitelist(from, { from: _owner });
        await assertRevert(aqwireToken.burn(1, { from }));
      });
    });
  
    describe('when sender is in whitelist', function () {
      describe('when the given amount is not greater than balance of the sender', function () {
        var receipt;
        var initialBalance;
  
        beforeEach(async function () {
          await aqwireToken.transfer(from, amount * 2, { from: _owner });
          initialBalance = await aqwireToken.balanceOf(from);
          await aqwireToken.addAddressToWhitelist(from);
          receipt = await aqwireToken.burn(amount, { from: from });
        });
  
        it('burns the requested amount', async function () {
          const balance = await aqwireToken.balanceOf(from);
          balance.should.be.bignumber.equal(initialBalance - amount);
        });
  
        it('emits a burn event', async function () {
          const event = receipt.logs.find(e => e.event === 'Burn');
          event.args.burner.should.eq(from);
          event.args.value.should.be.bignumber.equal(amount);
        });
  
        it('emits a transfer event', async function () {
          const event = receipt.logs.find(e => e.event === 'Transfer');
          event.args.from.should.eq(from);
          event.args.to.should.eq(ZERO_ADDRESS);
          event.args.value.should.be.bignumber.equal(amount);
        });
      });
  
      describe('when the given amount is greater than the balance of the sender', function () {
        it('reverts', async function () {
          const currentBalance = await aqwireToken.balanceOf(from);
          await assertRevert(aqwireToken.burn(currentBalance.add(1), { from }));
        });
      });
    });
  });
});
