const express = require("express");
const isOauth = require("../middlewares/isoauth");
const electController = require("../controllers/electiontransaction");

const router = express.Router();

router.get("/transaction/:eId", electController.getTransaction);
// router.get('/result/:eId',isOauth,electController.getResult);
//check balance
router.post("/balance", isOauth, electController.postBallance);
router.get("/:eId/i/:hId", electController.getBlock);

router.get("/search", electController.getSearch);

exports.routes = router;
