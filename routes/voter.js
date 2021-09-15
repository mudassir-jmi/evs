const express = require("express");
const { body } = require("express-validator");

const voterController = require("../controllers/voterController");
const isVauth = require("../middlewares/isvauth");
const router = express.Router();

router.get("/dashboard", isVauth, voterController.getVdashboard);

//voter came here firest using public link
router.get("/voterauthfirst", isVauth, voterController.getVoterAuthFirst);

router.get("/election-details", isVauth, voterController.getElectionDetails);
//voter verification
// router.get('/public/:link',voterController.getVoterVerification);

//wallet
router.get("/wallet", isVauth, voterController.getWallet);
router.post("/wallet", isVauth, voterController.postWallet);

//balance
router.post("/balance", isVauth, voterController.postBallance);

//voting
router.get("/vote", isVauth, voterController.getVote);
router.post(
  "/vote",

  [
    body("vPub", "Enter valid Public key ").isString().isLength({ min: 60 }),
    body("vPrv", "Enter valid Private key ").isString().isLength({ min: 30 }),
    body("radio", "Choose a candidate "),
  ],
  isVauth,
  voterController.postVote
);

router.get(
  "/:electionTitle/:electionId/result",
  isVauth,
  voterController.getResult
);

router.get(
  "/:electionTitle/:electionId/election-details",
  isVauth,
  voterController.getCanDet
);
exports.routes = router;
