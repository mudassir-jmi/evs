const express = require("express");
const Admin = require('../models/admin');
const {body} = require("express-validator");
const authVcontroller = require("../controllers/oauthController");
const isLog = require('../middlewares/islogin');
const router = express.Router();

router.get('/',isLog, authVcontroller.getLogin);
router.post('/ologin',
[
    body('email','Please enter a valid email address!')
    .isEmail()
    .normalizeEmail(),
    body('password',"Please enter your password with minimum 5 characters!")
    .isLength({min:5})
]
,authVcontroller.postLogin);

router.post('/osignup', 
[
    body('aname', 'Name must be at least three characters longs!')
    .isString()
    .isLength({min:3})
    ,body('aemail','Please enter a valid email address!')
    .isEmail()
    .withMessage('Pleae Enter a valid email address')
    .custom((value, {req})=>{
   return Admin.findOne({email:value})
    .then(admin=>{
        if(admin){
           return Promise.reject('Email already exists, please use another mail!');
        }
    });    
})
.normalizeEmail()
,
 body('apassword',"Please enter your password with minimum 5 characters!")
 .isLength({min:5}),
 body('cpassword').custom((value, {req})=>{
     if(value !== req.body.apassword){
         throw new Error('Password must be equal!')
     }
     else{
         return true;
     }
 })

],
authVcontroller.postSignup);
router.post('/ologout', authVcontroller.postOlogout);

//reset password

router.get('/oreset',
[
    body('Please enter a valid email address!')
    .isEmail()
    .normalizeEmail()
],
authVcontroller.getReset);

router.post('/oreset',isLog,  authVcontroller.postReset);

router.get('/resetpassword/:aid/:key', authVcontroller.getNewPass)
router.post('/onewpass',
[
    body('password',"Please enter your password with minimum 5 characters!")
    .isLength({min:5})
]
,authVcontroller.postNewPass);

module.exports = router;