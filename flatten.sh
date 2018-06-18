#!/bin/bash
rm -rf ./flatten
mkdir ./flatten

truffle-flattener ./contracts/AqwireToken.sol >> ./flatten/AqwireToken.sol
truffle-flattener ./contracts/AqwireContract.sol >> ./flatten/AqwireContract.sol