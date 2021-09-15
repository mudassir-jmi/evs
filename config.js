const MINE_RATE = 1000;
const INITIAL_DIFFICULTY = 3;
const cryptoHash = require('./utils/cryptohash');
const GENESIS_DATA = {
    index:1,
    timestamp : Date.now(),
    nonce : 0,
    hash: cryptoHash(Date.now()),
    prevHash:"00",
    transactions:[]
};

const STARTING_BALANCE = 1000;

const REWARD_INPUT = { address: '*authorized-reward*' };

const MINING_REWARD = 50;

module.exports = {
  GENESIS_DATA,
  MINE_RATE,
  STARTING_BALANCE,
  REWARD_INPUT,
  MINING_REWARD
};
