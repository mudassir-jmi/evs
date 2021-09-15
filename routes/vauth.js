const express = require("express");
const {body} = require("express-validator");
const authVcontroller = require("../controllers/vauthController");

const router = express.Router();

//login
router.get('/public/:link',authVcontroller.getVoterLogin);
router.post('/vlogin',
[
body('vEmail','Please enter a valid email address!')
.isEmail()
,
]
,authVcontroller.postLogin);
//router.get('/votp',authVcontroller.getVoterOtp);
router.post('/votp',authVcontroller.postOtp);

router.post('/vlogout', authVcontroller.postVlogout);


module.exports = router;