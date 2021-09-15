const Election = require("../models/election");
const Blockchain = require("../models/blockchain");
var EC = require("elliptic").ec;
var ec = new EC("secp256k1"); //for rsa and generating keypair

//pdfkit
const path = require("path");
const fs = require("fs");
const pdfDocuments = require("pdfkit");

const { validationResult } = require("express-validator");

exports.getVdashboard = (req, res) => {
  // req.voter
  // .populate('election.electionId')
  // .execPopulate()
  // .then(e=>{
  //     console.log(e.wallet.hasAnnounced)
  // })
  Election.findById(req.voter.election.electionId).then((e) => {
    // console.log(e.wallet.hasAnnounced)
    res.render("voter/dashboard", {
      voter: req.voter,
      election: e,
      pageTitle: "Voter | Welcome to the dashboard",
      path: "/v/dashboard",
    });
  });
};

//voter came here firest using public link
exports.getVoterAuthFirst = (req, res, next) => {
  res.render("voter/voterauth");
};

//voter came here firest using public link
exports.getElectionDetails = (req, res, next) => {
  res.render("election/electiondetail", {
    voter: req.voter,
    pageTitle: `${req.voter.election.electionTitle} | Welcome to the election details`,
    path: "/v/election-details",
  });
};

exports.getVoterVerification = (req, res, next) => {
  const linkId = req.params.link;
  Election.findOne({
    voterPublicLink: linkId,
    endTimeVoterVerifLink: { $gt: Date.now() },
  }).then((election) => {
    if (election) {
      res.render("voter/voterverif", {
        pageTitle: "Voter Verification | Be a part of voter",
      });
    } else {
      res.render("404");
    }
  });
};

exports.getWallet = (req, res, next) => {
  // console.log(req.voter.election.electionId)
  Election.findById(req.voter.election.electionId).then((election) => {
    res.render("voter/wallet", {
      wallet: req.voter.wallet,
      balance: null,
      showBalance: false,
      voter: req.voter,
      election: election,
      electionId: req.voter.election.electionId,
      pageTitle: "Voter | Welcome to the dashboard",
      path: "/v/wallet",
    });
  });
};

exports.postWallet = (req, res, next) => {
  var keypair = ec.genKeyPair();
  req.voter.wallet.status = true;
  const pub = keypair.getPublic("hex");
  const prv = keypair.getPrivate("hex");
  return req.voter.save().then((result) => {
    Election.findById(req.voter.election.electionId)
      .then((e) => {
        const pubn = [];
        let voterWalletN = [...e.wallet.voterWallet];
        voterWalletN.push({ pub: pub });
        e.wallet.voterWallet = voterWalletN;
        return e.save();
      })
      .then(() => {
        //  res.redirect('/v/dashboard')
        const pdfDoc = new pdfDocuments({ size: "A4" });
        res.setHeader("Content-Type", "application/pdf");

        res.setHeader(
          "Content-Dispositison",
          'inline; filenname="' + req.voter._id + '"'
        );
        //  res.setHeader('Content-Disposition', 'attachment; filenname="'+req.voter._id+'"');
        // pdfDoc.pipe(fs.createWriteStream(invoicePath));  //for creeating on server

        pdfDoc.pipe(res);

        pdfDoc
          .fontSize(26)
          .fillColor("grey")
          .text("Wallet of Voter for Election", {
            underline: true,
          });

        pdfDoc
          .fontSize(26)
          .fillColor("green")
          .text("---------------------------------------------------");
        pdfDoc
          .fontSize(19)
          .fillColor("grey")
          .text("Election Title :- " + req.voter.election.electionTitle);
        pdfDoc
          .fontSize(26)
          .fillColor("green")
          .text("---------------------------------------------------");

        pdfDoc
          .fontSize(12)
          .fillColor("black")
          .font("Times-Roman")
          .text("Public Key =  " + pub);
        pdfDoc.text(" ");

        pdfDoc
          .fontSize(12)
          .fillColor("black")
          .font("Times-Roman")
          .text("Private Key =  " + prv);
        pdfDoc.text(" ");
        pdfDoc
          .fontSize(12)
          .fillColor("black")
          .font("Times-Roman")
          .text("Blockchain Voting System | voter wallet pdf", 300, 750);

        var utc = new Date().toJSON().slice(0, 10).replace(/-/g, "/");
        pdfDoc
          .fontSize(12)
          .fillColor("black")
          .font("Times-Roman")
          .text("Date :- " + utc, 410, 50);

        pdfDoc
          .fillColor("red")
          .text("right click in this page and then go homepage", 400, 450, {
            link: "http://localhost:3000/v/wallet",
            underline: true,
          });

        pdfDoc.end();
      });
  });
};

//check balance
exports.postBallance = (req, res, next) => {
  const electionId = req.body.electionId;
  const pubkey = req.body.pubkey.split(/\s/).join("");
  // return console.log(pubkey);
  Election.findById(electionId)
    .then((e) => {
      // console.log(e.blockchain)
      return Blockchain.findById(e.blockchain);
    })
    .then((b) => {
      return b.knowBalance(pubkey);
    })
    .then((balance) => {
      Election.findById(req.voter.election.electionId).then((election) => {
        res.render("voter/wallet", {
          wallet: req.voter.wallet,
          showBalance: true,
          balance: balance,
          voter: req.voter,
          election: election,
          electionId: req.voter.election.electionId,
          pageTitle: "Voter | Welcome to the dashboard",
          path: "/v/wallet",
        });
      });
    });
};

//voter came here firest using public link
exports.getVote = (req, res, next) => {
  const electionId = req.voter.election.electionId;

  Election.findById(electionId).then((e) => {
    if (!e.wallet.hasAnnounced) {
      return res.redirect("/v/dashboard");
    }
    res.render("voter/vote", {
      voter: req.voter,
      errorMsg: null,
      isVote: false,
      election: e,
      pageTitle: `${req.voter.election.electionTitle} | Welcome to the election details`,
      path: "/v/election-details",
    });
  });
};

exports.postVote = (req, res, next) => {
  const electionId = req.voter.election.electionId;
  const cId = req.body.cId;
  const cPub = [{ pub: cId }];
  const vPub = req.body.vPub.split(/\s/).join("");
  const vPrv = req.body.vPrv.split(/\s/).join("");
  const prvInstance = ec.keyFromPrivate(vPrv, "hex");
  const pubInstance = ec.keyFromPublic(vPub, "hex");
  const errors = validationResult(req);
  //console.log(vPub)
  //  console.log(prvInstance.getPublic('hex'))

  //    if(!errors.isEmpty()){       // if email was empty
  //     return res.status(422)
  //     .render('voter/vote',{
  //         pageTitle:`${req.voter.election.electionTitle} | Welcome to the election details`,
  //         path:'/v/election-details',
  //         isSignupMode:false,

  //         errorMsg:errors.array()[0].msg,
  //         validationErrors:errors.array()

  //     });
  // }

  const sign = prvInstance.sign("has vrified");

  if (!pubInstance.verify("has vrified", sign)) {
    Election.findById(electionId).then((e) => {
      if (e.wallet.voterWallet.indexOf(vPub) === -1) {
        res.render("voter/vote", {
          voter: req.voter,
          errorMsg: "Not verified!",
          isVote: false,
          election: e,
          pageTitle: `${req.voter.election.electionTitle} | Welcome to the election details`,
          path: "/v/election-details",
        });
      }
      res.render("voter/vote", {
        voter: req.voter,
        errorMsg: "Not verified!",
        isVote: false,
        election: e,
        pageTitle: `${req.voter.election.electionTitle} | Welcome to the election details`,
        path: "/v/election-details",
      });
    });
  }

  Election.findById(electionId).then((e) => {
    Blockchain.findById(e.blockchain)
      .then((b) => {
        return b.addTransaction(vPub, 1, cPub);
      })
      .then((b) => {
        if (b) {
          console.log("success");
          res.redirect("/v/dashboard");
        } else {
          res.render("voter/vote", {
            voter: req.voter,
            errorMsg: "No balance!",
            isVote: false,
            election: e,
            pageTitle: `${req.voter.election.electionTitle} | Welcome to the election details`,
            path: "/v/election-details",
          });
        }
      });
  });
};

exports.getResult = async (req, res) => {
  const electionId = req.params.electionId;
  try {
    const voter = await req.voter
      .populate("elections.electionId")
      .execPopulate();

    if (voter.election.electionId === electionId) {
      //checking is that election exist in the Admins election
      const election = await Election.findById(electionId);

      var candBV = [];

      for (const i of election.candidatesDetails) {
        const bl = await Blockchain.findById(election.blockchain);
        const bv = await bl.knowBalance(i.candidateWallet.pub);
        candBV.push(bv);
      }
      await res.render("voter/result", {
        election: election,
        canBV: candBV,
        pageTitle: election.electionTitle + " | Election Results ",
        voter: req.voter,
        path: "/result",
      });
    } else {
      res.redirect("/v/dashboard");
    }
  } catch (error) {
    console.log(error);
  }
};

// candidatesDetails

exports.getCanDet = (req, res) => {
  const electionId = req.params.electionId;
  req.voter
    .populate("elections.electionId")
    .execPopulate()
    .then((voter) => {
      //   console.log(eIds, electionId)
      if (voter.election.electionId === electionId) {
        //checking is that election exist in the Admins election
        Election.findById(electionId).then((election) => {
          res.render("voter/candetails", {
            election: election,
            wallet: election.wallet,
            voter: req.voter,

            pageTitle: election.electionTitle + " | Candidate details ",

            path: "/candidatesdetails",
          });
          //res.redirect('/o/dashboard');
        });
      } else {
        res.redirect("/o/dashboard");
      }
    });
};
