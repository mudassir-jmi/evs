const mongoose = require("mongoose");
const cryptoHash = require("../utils/cryptohash");
const hexToBinary = require("hex-to-binary");

const Schema = mongoose.Schema;

const blockchainSchema = new Schema({
  chain: [
    {
      index: {
        type: Number,
        required: true,
      },
      timestamp: {
        type: Number,
        required: true,
      },
      nonce: {
        type: Number,
        required: true,
      },
      hash: {
        type: String,
        required: true,
      },
      prevHash: {
        type: String,
        required: true,
      },
      transactions: [
        {
          hash: {
            type: String,
          },
          sender: {
            type: String,
          },
          receiver: {
            type: String,
          },
          vote: {
            type: Number,
          },
          inputAdrs: String,
          inputVal: Number,
          output: [
            {
              receiver: String,
              val: Number,
            },
          ],
        },
      ],
    },
  ],
  memTransac: [
    {
      hash: {
        type: String,
      },
      sender: {
        type: String,
        required: true,
      },
      receiver: {
        type: String,
        required: true,
      },
      vote: {
        type: Number,
        required: true,
      },
    },
  ],
  admin: {
    email: { type: String, required: true },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  election: {
    electionTitle: { type: String, required: true },
    electionId: {
      type: Schema.Types.ObjectId,
      ref: "Election",
    },
  },
});

// calling genesis block
// blockchainSchema.methods.genesis = function(){
//     const genesis = {
//             index:1,
//             timestamp : Date.now(),
//             nonce : 0,
//             hash: cryptoHash(Date.now()),
//             prevHash:"00",
//             transactions:[]

//         }
//     this.chain = genesis;
//     return this.save();
// }

//mining
blockchainSchema.methods.mining = function () {
  const wholeChain = [...this.chain];
  const lastBlock = wholeChain[wholeChain.length - 1];
  const { timestamp, nonce, hash } = minedBlock(lastBlock);
};

const minedBlock = (...inputs) => {
  let hash;
  const timestamp = Date.now();
  //proof of work
  let nonce = 0;
  do {
    nonce++;

    // difficulty = Block.adjustDifficulty({ originalBlock: lastBlock, timestamp });
    hash = cryptoHash(inputs, nonce);
    // console.log(nonce,hash);
  } while (hash.substring(0, 4) !== "0".repeat(4)); // till two 0 met

  return { timestamp, nonce, hash };
};

const calculateBalance = async function (chain, address) {
  return new Promise((resolve, reject) => {
    let hasConductedTransaction = false;
    let outputsTotal = 0;

    for (let i = chain.length - 1; i > 0; i--) {
      //not till genesis block
      const block = chain[i];

      for (let transaction of block.transactions) {
        let newOutputBal = 0;

        if (transaction.inputAdrs === address) {
          hasConductedTransaction = true;
        }
        const addressOutput = [...transaction.output];
        addressOutput.forEach((a) => {
          if (a.receiver === address) {
            newOutputBal = a.val;
          }
        });
        if (newOutputBal) {
          outputsTotal = outputsTotal + newOutputBal;
        }
      }
      if (hasConductedTransaction) {
        break;
      }
    }
    resolve(outputsTotal);
    //  return outputsTotal;
  });
};
blockchainSchema.methods.knowBalance = async function (address) {
  // return new Promise((resolve, reject) =>{
  const wholeChain = [...this.chain];
  let availableBal = await calculateBalance(wholeChain, address);
  return availableBal;
  //  resolve(availableBal);

  // })
};

blockchainSchema.methods.addTransaction = async function (
  sender,
  amountSend,
  receiver
) {
  // let leftBal = amountSend;
  const wholeChain = [...this.chain];
  const lastHash = wholeChain[wholeChain.length - 1].hash;
  const { timestamp, nonce, hash } = minedBlock(receiver, amountSend, lastHash);

  let availableBal = await calculateBalance(wholeChain, sender);
  if (!availableBal) {
    return false;
  }

  let tempBal = availableBal;
  //   console.log(amountSend);
  //   return console.log(sender, amountSend, receiver);

  let outputMap = receiver.map((r) => {
    availableBal -= 1;
    return { receiver: r.pub, val: amountSend };
  });

  outputMap.push({
    receiver: sender,
    val: availableBal,
  });

  const transaction = [
    {
      hash: cryptoHash(outputMap),
      inputAdrs: sender,
      inputVal: tempBal,
      output: outputMap,
    },
  ];

  wholeChain.push({
    index: wholeChain[wholeChain.length - 1].index + 1,
    timestamp: timestamp,
    nonce: nonce,
    hash: hash,
    prevHash: lastHash,
    transactions: transaction,
  });

  this.chain = wholeChain;
  return this.save();
};

blockchainSchema.methods.coinBaseTransaction = function (receiver, amount) {
  const wholeChain = [...this.chain];
  const lastHash = wholeChain[wholeChain.length - 1].hash;

  // let hash;
  const { timestamp, nonce, hash } = minedBlock(receiver, amount, lastHash);

  const tHash = cryptoHash(timestamp, amount);
  let outputMap = [
    {
      receiver: receiver,
      val: amount,
    },
  ];
  const transaction = [
    {
      hash: cryptoHash(outputMap),
      inputAdrs: "COIN BASE BIT VOTE TRANSFERED",
      inputVal: amount,
      output: outputMap,
    },
  ];

  wholeChain.push({
    index: 2,
    timestamp: timestamp,
    nonce: nonce,
    hash: hash,
    prevHash: lastHash,
    transactions: transaction,
  });

  this.chain = wholeChain;
  return this.save();
};

module.exports = mongoose.model("Blockchain", blockchainSchema);
