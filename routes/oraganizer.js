const express = require("express");

const organizerController = require('../controllers/organizerController');
//middleware
const isOauth = require('../middlewares/isoauth');
const {body} = require("express-validator");
const router = express.Router();

router.get('/dashboard',isOauth, organizerController.getOdashboard);
router.get('/profile',isOauth, organizerController.getOprofile);
router.get('/create',isOauth, organizerController.getOcreateElection);
router.post('/create-election',isOauth,
[
    body('electionTitle')
    .isLength({min:4}),
    body('NoOfCandidate')
    .isInt(),
    body('NoOfVoters')
    .isInt(),
    body('typeOfId')
    .isString()
    .isLength({min:4}),
    body('desc')
    .isString()
    .isLength({min:5, max:400}),
    body('candidatesName'),
    body('candidatesAge'),
    
],
organizerController.postOcreateElection);
router.get('/:electionTitle/:electionId',isOauth, organizerController.getElectionDashboard);


//delete election
router.post('/delete-election',isOauth,organizerController.postDeleteElection);

//election stuffs
router.get('/:electionTitle/:electionId/wallet',isOauth,organizerController.getAdminWallet);

router.post('/create-wallet',isOauth, organizerController.postCreateWallet)
router.post('/create-coinbase',isOauth, organizerController.postCoinBase)


//annoncing the election
router.get('/:electionTitle/:electionId/announce',isOauth, organizerController.getAnnounce);
router.post('/announce',isOauth,organizerController.postAnnounce);

//balance
router.post('/balance',isOauth, organizerController.postBallance);

router.get('/:electionTitle/:electionId/result',isOauth, organizerController.getResult);

//candididate details and voterController
router.get('/:electionTitle/:electionId/candidate-details',isOauth, organizerController.getCanDet);

//posting public mails to all the votersGmail
router.post('/maillink', isOauth, organizerController.postvMails);
exports.routes = router;