//jshint esversion:6
const Admin = require("../models/admin");
const Election = require("../models/election");
const Blockchain = require("../models/blockchain");
const { GENESIS_DATA } = require("../config");
const election = require("../models/election");
const cryptoHash = require("../utils/cryptohash");
const mongoose = require("mongoose");
const crypto = require("crypto");
var EC = require("elliptic").ec;
var ec = new EC("secp256k1"); //for rsa and generating keypair
const { validationResult } = require("express-validator");
//sending mails
require("dotenv").config();
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

exports.getOdashboard = (req, res, next) => {
  res.render("organizer/dashboard", {
    admin: req.admin,
    pageTitle: "Organizer | Welcome to the dashboard",
    path: "/o/dashboard",
  });
};

exports.getOprofile = (req, res) => {
  res.render("organizer/profile", {
    admin: req.admin,
    pageTitle: "Organizer | Your profile",
    path: "/o/profile",
  });
};

exports.getOcreateElection = (req, res) => {
  res.render("organizer/createelection", {
    admin: req.admin,
    pageTitle: "Organizer | Create a new election",
    path: "/o/create",
    errorMsg: null,
    validationErrors: [],
  });
};

exports.postOcreateElection = (req, res) => {
  const electionTitle = req.body.electionTitle;
  const candidatesName = req.body.candidatesName;
  const candidatesAge = req.body.candidatesAge;
  const votersGmail = req.body.votersGmail;
  const typeOfId = req.body.typeOfId;
  const endDate = req.body.endDate;
  const endTime = req.body.endTime;
  const desc = req.body.desc;
  var d = new Date(endDate + " " + endTime);
  var timeStampEnd = d.getTime();
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // if email was empty
    return res.status(422).render("organizer/createelection", {
      admin: req.admin,
      pageTitle: "Organizer | Create a new election",
      path: "/o/create",
      isSignupMode: false,
      errorMsg: errors.array()[0].msg,
      oldInput: {},
      validationErrors: errors.array(),
    });
  }

  const voterMails = votersGmail.map((i) => {
    return { voterMail: i };
  });
  var l = -1;
  const candidatesDetailsArr = candidatesName.map((i) => {
    l++;
    return { candName: i, candAge: candidatesAge[l] };
  });
  var electionId = mongoose.Types.ObjectId(); //manually creating id for election
  var blockchainId = mongoose.Types.ObjectId();

  //creating genesis  blockchain
  const b1 = new Blockchain({
    _id: blockchainId,
    chain: [
      {
        index: 1,
        timestamp: Date.now(),
        nonce: 0,
        hash: cryptoHash(Date.now()),
        prevHash: "000",
        transactions: [],
      },
    ],
    desc: desc,
    election: {
      electionTitle: electionTitle,
      electionId: electionId,
    },
    admin: {
      email: req.admin.email,
      adminId: req.admin,
    },
  });

  //blockchain save
  b1.save();
  req.admin.addToCtreateElection(electionTitle, electionId);

  //creation of election

  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
    }
    const link = buffer.toString("hex");

    const election = new Election({
      _id: electionId,
      electionTitle: electionTitle,
      candidatesDetails: candidatesDetailsArr,
      voterMails: voterMails,
      voterPublicLink: link,
      verifcationIdType: typeOfId,
      endTimeVoterVerifLink: timeStampEnd,
      descs: desc,
      wallet: { hasAnnounced: false },
      blockchain: blockchainId,
      admin: {
        email: req.admin.email,
        adminId: req.admin,
      },
    });
    election.save().then((result) => {
      res.redirect("/o/dashboard");
    });
  });
};

//delete election
exports.postDeleteElection = (req, res, next) => {
  const electionId = req.body.electionId;
  Election.findById(electionId)
    .then((election) => {
      return election.blockchain;
    })
    .then((blockchainId) => {
      Blockchain.remove({ _id: blockchainId }).then((result) => {
        Election.remove({ _id: electionId }).then((result) => {
          console.log(result);
          req.admin
            .deleteElection(electionId)
            .then((result) => {
              res.redirect("/o/dashboard");
            })
            .catch((err) => console.log(err));
        });
      });
    });
};

//election
exports.getElectionDashboard = (req, res, next) => {
  const electionId = req.params.electionId;
  // const elLink = cryptoHash(electionId);
  req.admin
    .populate("elections.electionId")
    .execPopulate()
    .then((admin) => {
      const eIds = admin.elections.map((e) => {
        return e.electionId._id.toString();
      });
      //   console.log(eIds, electionId)
      if (eIds.indexOf(electionId.toString()) !== -1) {
        //checking is that election exist in the Admins election
        Election.findById(electionId).then((election) => {
          res.render("organizer/elction/adminelctiondash", {
            election: election,
            admin: req.admin,
            pageTitle: election.electionTitle + " | Recent works in electon",
            publicLink: election.voterPublicLink,
            path: "/election",
          });
        });
      } else {
        res.redirect("/o/dashboard");
      }
    });
};

exports.getAdminWallet = (req, res) => {
  const electionId = req.params.electionId;
  req.admin
    .populate("elections.electionId")
    .execPopulate()
    .then((admin) => {
      const eIds = admin.elections.map((e) => {
        return e.electionId._id.toString();
      });
      //   console.log(eIds, electionId)
      if (eIds.indexOf(electionId.toString()) !== -1) {
        //checking is that election exist in the Admins election
        Election.findById(electionId).then((election) => {
          res.render("organizer/elction/wallet", {
            election: election,
            wallet: election.wallet,
            admin: req.admin,
            showBalance: false,
            balance: null,
            pageTitle: election.electionTitle + " | Wallet be careful ",
            publicLink: election.voterPublicLink,
            path: "/wallet",
          });
        });
      } else {
        res.redirect("/o/dashboard");
      }
    });
};

exports.postCreateWallet = (req, res) => {
  const electionId = req.body.electionId;

  req.admin
    .populate("elections.electionId")
    .execPopulate()
    .then((admin) => {
      const eIds = admin.elections.map((e) => {
        return e.electionId._id.toString();
      });
      //   console.log(eIds, electionId)
      if (eIds.indexOf(electionId.toString()) !== -1) {
        //checking is that election exist in the Admins election
        //create wallet for admin and candidates
        Election.findById(electionId)
          .then((election) => {
            // Generate keys
            var keypair = ec.genKeyPair();
            election.wallet.isCreated = true;
            election.wallet.adminWallet.pub = keypair.getPublic("hex");
            election.wallet.adminWallet.prv = keypair.getPrivate("hex");

            // console.log(election.candidatesDetails)
            var cWallet = []; //key pair for candidate
            election.candidatesDetails.forEach((candidate) => {
              var ckeypair = ec.genKeyPair();
              cWallet.push({
                _id: candidate._id,
                pub: ckeypair.getPublic("hex"),
                prv: ckeypair.getPrivate("hex"),
              });
            });
            election.wallet.candidateWallet = cWallet;

            let i = 0;
            election.candidatesDetails.forEach((c) => {
              c.candidateWallet.pub = cWallet[i].pub;
              c.candidateWallet.prv = cWallet[i].prv;
              i++;
            });

            return election.save();
          })
          .then((result) => {
            res.redirect("/o/dashboard");
          });
      } else {
        res.redirect("/o/dashboard");
      }
    });

  // console.log(blockchainId)
};

exports.postCoinBase = (req, res) => {
  const electionId = req.body.electionId;

  req.admin
    .populate("elections.electionId")
    .execPopulate()
    .then((admin) => {
      const eIds = admin.elections.map((e) => {
        return e.electionId._id.toString();
      });
      //   console.log(eIds, electionId)
      if (eIds.indexOf(electionId.toString()) !== -1) {
        Election.findById(electionId)
          .then((election) => {
            const pubAdmin = election.wallet.adminWallet.pub;
            const bId = election.blockchain;
            const numCandidate = election.voterMails.length; //num of bitvote will created in coinbase
            console.log(numCandidate);
            Blockchain.findById(bId)
              .then((b) => {
                b.coinBaseTransaction(pubAdmin, numCandidate);
                // b.mining()
              })
              .then((result) => {
                election.wallet.hasCoinbase = true;

                // console.log(election.wallet.adminWallet)
                return election.save();
              })
              .then((result) => {
                res.redirect("/o/dashboard");
              })
              .catch((error) => {
                console.log(error);
              });
          })
          .catch((error) => {
            console.log(error);
          });
      } else {
        res.redirect("/o/dashboard");
      }
    });

  // console.log(blockchainId)
};

//election announse
exports.getAnnounce = (req, res, next) => {
  const electionId = req.params.electionId;
  req.admin
    .populate("elections.electionId")
    .execPopulate()
    .then((admin) => {
      const eIds = admin.elections.map((e) => {
        return e.electionId._id.toString();
      });
      //   console.log(eIds, electionId)
      if (eIds.indexOf(electionId.toString()) !== -1) {
        //checking is that election exist in the Admins election
        Election.findById(electionId).then((election) => {
          res.render("organizer/elction/announce", {
            election: election,
            wallet: election.wallet,
            admin: req.admin,
            pageTitle: election.electionTitle + " | Announce the election ",
            publicLink: election.voterPublicLink,
            path: "/announce",
          });
        });
      } else {
        res.redirect("/o/dashboard");
      }
    });
};
exports.postAnnounce = (req, res, next) => {
  const electionId = req.body.electionId;
  // const pubKeyAdmin = req.body.pubKeyAdmin;
  // console.log(electionId);
  req.admin
    .populate("elections.electionId")
    .execPopulate()
    .then((admin) => {
      const eIds = admin.elections.map((e) => {
        return e.electionId._id.toString();
      });
      //   console.log(eIds, electionId)
      if (eIds.indexOf(electionId.toString()) !== -1) {
        //checking is that election exist in the Admins election
        Election.findById(electionId).then((election) => {
          const prvkey = ec.keyFromPrivate(election.wallet.adminWallet.prv);
          // console.log(prvkey.getPublic('hex'))
          const msg = "1 coin";

          var signature = prvkey.sign(msg);
          const pubkey = ec.keyFromPublic(
            election.wallet.adminWallet.pub,
            "hex"
          );

          // const voterPublicKeyI = ec.keyFromPublic(election.wallet.voterWallet[0].pub,'hex');
          const votePublicKey = election.wallet.voterWallet.map((i) => {
            return { pub: i.pub };
          });
          //    return console.log(votePublicKey);
          Blockchain.findById(election.blockchain)
            .then((b) => {
              if (
                b.addTransaction(
                  election.wallet.adminWallet.pub,
                  1,
                  votePublicKey
                )
              ) {
                election.wallet.hasAnnounced = true;
                return election.save();
                console.log("Successfully");
              } else {
                console.log("No balance");
              }
            })
            .then((result) => {
              res.redirect("/o/dashboard");
            });
        });
      } else {
        res.redirect("/o/dashboard");
      }
    });
};

//check balance
exports.postBallance = (req, res, next) => {
  const electionId = req.body.electionId;
  const pubkey = req.body.pubkey.split(/\s/).join("");

  Election.findById(electionId)
    .then((e) => {
      //    // console.log(e.blockchain)
      //    const election =e;
      return Blockchain.findById(e.blockchain);
    })
    .then((b) => {
      return b.knowBalance(pubkey);
    })
    .then((balance) => {
      Election.findById(electionId).then((election) => {
        res.render("organizer/elction/wallet", {
          election: election,
          wallet: election.wallet,
          admin: req.admin,
          showBalance: true,
          balance: balance,
          pageTitle: election.electionTitle + " | Wallet be careful ",
          publicLink: election.voterPublicLink,
          path: "/wallet",
        });
      });
    });
};

function voteBV(b) {
  Blockchain.findById(b).then((b) => {
    candBV.push(b.knowBalance(i.candidateWallet.pub));
    return console.log(candBV);
  });
}

//results

exports.getResult = async (req, res) => {
  const electionId = req.params.electionId;
  try {
    const admin1 = await req.admin
      .populate("elections.electionId")
      .execPopulate();

    const eIds = admin1.elections.map((e) => {
      return e.electionId._id.toString();
    });

    if (eIds.indexOf(electionId.toString()) !== -1) {
      //checking is that election exist in the Admins election
      const election = await Election.findById(electionId);

      var candBV = [];

      for (const i of election.candidatesDetails) {
        const bl = await Blockchain.findById(election.blockchain);
        const bv = await bl.knowBalance(i.candidateWallet.pub);
        candBV.push(bv);
      }
      await res.render("election/result", {
        election: election,
        wallet: election.wallet,
        admin: req.admin,
        canBV: candBV,
        pageTitle: election.electionTitle + " | Election Results ",
        publicLink: election.voterPublicLink,
        path: "/result",
      });
    } else {
      res.redirect("/o/dashboard");
    }
  } catch (error) {
    console.log(error);
  }
};

// candidatesDetails

exports.getCanDet = (req, res) => {
  const electionId = req.params.electionId;
  req.admin
    .populate("elections.electionId")
    .execPopulate()
    .then((admin) => {
      const eIds = admin.elections.map((e) => {
        return e.electionId._id.toString();
      });
      //   console.log(eIds, electionId)
      if (eIds.indexOf(electionId.toString()) !== -1) {
        //checking is that election exist in the Admins election
        Election.findById(electionId).then((election) => {
          res.render("organizer/elction/candetails", {
            election: election,
            wallet: election.wallet,
            admin: req.admin,
            canBV: [],
            pageTitle: election.electionTitle + " | Candidate details ",
            publicLink: election.voterPublicLink,
            path: "/candidatesdetails",
          });
          //res.redirect('/o/dashboard');
        });
      } else {
        res.redirect("/o/dashboard");
      }
    });
};

//postin mails
exports.postvMails = (req, res) => {
  const electionId = req.body.eId;
  req.admin
    .populate("elections.electionId")
    .execPopulate()
    .then((admin) => {
      const eIds = admin.elections.map((e) => {
        return e.electionId._id.toString();
      });

      //   console.log(eIds, electionId)
      if (eIds.indexOf(electionId.toString()) !== -1) {
        //checking is that election exist in the Admins election
        //create wallet for admin and candidates
        Election.findById(electionId)
          .then((election) => {
            let mails = election.voterMails.map((i) => {
              //mails of all voters
              return i.voterMail;
            });
            //    console.log(mails)
            mails.forEach((m) => {
              async function sendMail() {
                try {
                  const accessToken = await oAuth2Client.getAccessToken();

                  const transport = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                      type: "OAuth2",
                      user: "mahiteamevs@gmail.com",
                      clientId: CLIENT_ID,
                      clientSecret: CLIENT_SECRET,
                      refreshToken: REFRESH_TOKEN,
                      accessToken: accessToken,
                    },
                  });
                  const mailOptions = {
                    from: "MAHITEAM <mahiteamevs@gmail.com>",
                    to: m,
                    subject: "YOUR PUBLIC LINK FOR ELECTION LOGIN",
                    text: "dont share it with anyone ",
                    html: `
                               <h3>Here is your public link</h3>
                               <p> click here to <a href="http://localhost:3000/public/${election.voterPublicLink}">http://localhost:3000/public//${election.voterPublicLink}</a></p>   
                        `,
                  };
                  const result = await transport.sendMail(mailOptions);
                  return result;
                } catch (error) {
                  return error;
                }
              }

              sendMail().then((result) => {
                // console.log('Email sent....')
              });
            });
          })
          .then((result) => {
            res.redirect("/o/dashboard");
          });
      } else {
        res.redirect("/o/dashboard");
      }
    });
};
