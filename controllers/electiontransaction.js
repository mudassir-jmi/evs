const Election = require("../models/election");
const Admin = require("../models/admin");
const Blockchain = require("../models/blockchain");
var EC = require("elliptic").ec;
var ec = new EC("secp256k1"); //for rsa and generating keypair

//voter came here firest using public link
exports.getTransaction = async (req, res, next) => {
  const electionId = req.params.eId;

  const el = await Election.findById(electionId);
  Election.findById(electionId)
    .then((e) => {
      if (!e) {
        return res.redirect("/o/dashboard");
      }
      return Blockchain.findById(e.blockchain);
    })
    .then(async (b) => {
      //console.log(b.chain)
      if (!req.admin) {
        if (req.voter.election.electionId === electionId) {
          res.render("election/transaction", {
            pageTitle: `Transac tion | Welcome to the election details`,
            path: "/v/election-details",
            user: "voter",
            election: el,
            voter: req.voter,
            chain: b.chain,
            eId: b.election.electionId,
          });
        } else {
          res.redirect("/");
        }
      } else if (!req.voter) {
        const admin1 = await req.admin
          .populate("elections.electionId")
          .execPopulate();

        const eIds = admin1.elections.map((e) => {
          return e.electionId._id.toString();
        });
        if (eIds.indexOf(electionId.toString()) !== -1) {
          res.render("election/transaction", {
            pageTitle: `Transac tion | Welcome to the election details`,
            path: "/v/election-details",
            user: "admin",

            admin: req.admin,
            election: el,
            chain: b.chain,
            eId: b.election.electionId,
          });
        } else {
          res.redirect("/");
        }
      } else {
        res.redirect("/");
      }
    });

  // res.render('election/transaction',{
  //     pageTitle:`Transac tion | Welcome to the election details`,
  //     path:'/v/election-details'
  // });
};

//check balance
exports.postBallance = (req, res, next) => {
  const electionId = req.body.electionId;
  const pubkey = req.body.pubkey;

  Election.findById(electionId)
    .then((e) => {
      // console.log(e.blockchain)
      return Blockchain.findById(e.blockchain);
    })
    .then((b) => {
      return b.knowBalance(pubkey);
    })
    .then((balance) => {
      if (req.voter) {
      }
    });
};

//get block info
exports.getBlock = (req, res, next) => {
  const eId = req.params.eId;

  const hId = req.params.hId;

  Election.findById(eId)
    .then((e) => {
      if (!e) {
        return res.redirect("/o/dashboard");
      }
      return Blockchain.findById(e.blockchain);
    })
    .then((b) => {
      console.log();
      if (b.chain.length < hId) {
        return res.redirect("/o/dashboard");
      }
      res.render("election/hashinfo", {
        pageTitle: `Transac tion | Welcome to the election details`,
        path: "/v/election-details",
        admin: req.admin,
        electionTitle: b.election.electionTitle,
        chain: b.chain,
        block: b.chain[hId - 1],
        eId: b.election.electionId,
      });
    });
};

exports.getSearch = (req, res, next) => {
  const block = req.query.b;
  Admin.findById(req.admin._id).then((admin) => {
    if (!admin) {
      return res.redirect("/");
    }

    res.render("election/search", {
      election: admin.elections,
      admin: admin,
      pageTitle: "Organizer | Create a new election",
      path: "/search",
      b: block,
    });
  });
};
