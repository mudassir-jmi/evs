const Election = require('../models/election');
const Blockchain = require('../models/blockchain');
const Voter = require('../models/voter');
const otps = require('../utils/otp');
const cryptoHash = require('../utils/cryptohash');
const crypto = require('crypto');
const {validationResult} = require("express-validator");


//sending mails
require('dotenv').config();
const nodemailer = require('nodemailer');
const {google} = require('googleapis');
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET; 
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const oAuth2Client = new google.auth.OAuth2(CLIENT_ID,CLIENT_SECRET,REDIRECT_URI);
oAuth2Client.setCredentials({refresh_token : REFRESH_TOKEN});



exports.getVoterLogin=(req, res, next) => {
    const linkId = req.params.link;
    Election.findOne({voterPublicLink:linkId, endTimeVoterVerifLink:{$gt: Date.now()}})
    .then(election =>{
       if(election){
        res.render('voter/auth/login',{
            linkId :linkId,
            electionId : election._id,
            electionTitle:election.electionTitle,
            errorMsg : "",
            validationErrors:[],
            oldInput : {email:null},
            pageTitle:"Login | Plz log in to proceed further"
        });
       }else{
           res.render('404');
       }
    })
    
}

exports.postLogin = (req, res, next) => {
    const email = req.body.vEmail;
    const linkId = req.body.linkId;
    const electionId = req.body.electionId;
    const electionT = req.body.eTitle;
    const errors = validationResult(req);
    if(!errors.isEmpty()){       // if email was empty
        return res.status(422)
        .render('voter/auth/login',{
            linkId :linkId,
            electionId : electionId,
            electionTitle:electionT,
            pageTitle:"Login | Plz log in to proceed further",
            path:"/login",
            errorMsg:errors.array()[0].msg,
             oldInput : {email:null},
            validationErrors:errors.array()
        });
    }
    crypto.randomBytes(32,(err,buffer)=>{
        if(err){
            console.log(err);
            }
       const link = buffer.toString('hex');
       const hash = cryptoHash(link)
        var otps = parseInt(hash.substring(8,16),16);    //random 8 digit otp
    //    console.log('kjds', otps)
    Election.findOne({_id:electionId, voterPublicLink:linkId, endTimeVoterVerifLink:{$gt: Date.now()}})
    .then(election=>{
        const vmails = election.voterMails
        const electionTitle = election.electionTitle;
        let mails = vmails.map(i=>{
            return i.voterMail;
        })
        return {mails,otps, electionTitle};
    })
    .then(({mails,otps, electionTitle})=>{
        
       if(mails.indexOf(email)!==-1){
            Voter.findOne({"election.electionId":electionId ,email:email})
            .then(voter=>{
                if(!voter){
                    console.log('new one');
                    const v = new Voter({
                        email:email,
                        otpval : {
                            pass: otps,
                            expireTime : Date.now()+360000
                        },
                        election:{
                            electionTitle : electionTitle,
                            electionId : electionId
                        }
                    })
                  return v.save()
                  .then(result=>{     
                    
                  //sending the mails
                  async function sendMail(){
                    try {
                        const accessToken = await oAuth2Client.getAccessToken();
                
                        const transport = nodemailer.createTransport({
                            service :'gmail',
                            auth : {
                                type: 'OAuth2',
                                user:'mahiteamevs@gmail.com',
                                clientId : CLIENT_ID,
                                clientSecret : CLIENT_SECRET,
                                refreshToken :REFRESH_TOKEN,
                                accessToken:accessToken
                            },
                        });
                        const mailOptions = {
                            from :'MAHITEAM <mahiteamevs@gmail.com>',
                            to:email,
                            subject : "YOUR EVS OTP ",
                            text: "dont share it with anyone ",
                            html:`
                            <h3>Here is your otp for login for Election:- ${electionTitle} @bvs </h3>
                             <p>${otps} </p>
                            <span>Don't share with anyone else! </span> 
                            `,
                        };
                        const result = await transport.sendMail(mailOptions);
                        return result;
                    } catch (error) {
                        return error;
                    }
                }
                sendMail()
                .then((result)=>{
                    console.log('Email sent....')
                    //render
                      //  console.log(err);
                      res.render('voter/auth/votp',{
                          email:email,
                          linkId :linkId,
                         electionId : electionId,
                         electionTitle:electionT,
                         errorMsg:"",
                         validationErrors:[],
                         isNewOne : true,
                         pageTitle:"Otp verification | Plz log in to proceed further"
                             });
                  })
                })
                }else{
                    //update only otp
                    Voter.findOne({"election.electionId":electionId ,email:email})
                    .then(voter=>{
                      if(!voter){
                          return console.log('Not found')
                      }
                      voter.otpval.pass = otps;
                      voter.otpval.expireTime = Date.now()+360000
                      return voter.save();
                    }) 
                    .then(result=>{
                           //sending the mails
                  async function sendMail(){
                    try {
                        const accessToken = await oAuth2Client.getAccessToken();
                
                        const transport = nodemailer.createTransport({
                            service :'gmail',
                            auth : {
                                type: 'OAuth2',
                                user:'mahiteamevs@gmail.com',
                                clientId : CLIENT_ID,
                                clientSecret : CLIENT_SECRET,
                                refreshToken :REFRESH_TOKEN,
                                accessToken:accessToken
                            },
                        });
                        const mailOptions = {
                            from :'MAHITEAM <mahiteamevs@gmail.com>',
                            to:email,
                            subject : "YOUR EVS OTP ",
                            text: "dont share it with anyone ",
                            html:`
                                   <h3>Here is your otp for login for Election:- ${electionTitle} @bvs </h3>
                                    <p>${otps} </p>
                                   <span>Don't share with anyone else! </span> 
                            `,
                        };
                        const result = await transport.sendMail(mailOptions);
                        return result;
                    } catch (error) {
                        return error;
                    }
                }
                sendMail()
                .then((result)=>{
                    console.log('Email sent....')
                      //render
                 res.render('voter/auth/votp',{
                    email:email,
                    linkId :linkId,
                   electionId : electionId,
                   electionTitle:electionT,
                   errorMsg:"",
                   validationErrors:[],
                   pageTitle:"Otp verification | Plz log in to proceed further"
                       });
                  })
                         })  
                }
            })
            
        }else{
         //   console.log('Not found')
            res.render('voter/auth/login',{
                linkId :linkId,
                electionId : electionId,
                electionTitle:electionT,
                pageTitle:"Login | Plz log in to proceed further",
                path:"/login",
                errorMsg:"Mail not found with associated election",
                 oldInput : {email:null},
                validationErrors:errors.array()
            });
        }
    })

        }); 
}
// exports.getVoterOtp=(req, res, next) => {
    
    
// }

//otp stuffs
exports.postOtp = (req, res, next) => {
    const otp = req.body.votp;
    const email = req.body.vEmail;
    const linkId = req.body.linkId;
    const electionId = req.body.electionId;
    const electionT = req.body.eTitle;
    Voter.findOne({"election.electionId":electionId ,email:email, "otpval.pass":otp, "otpval.expireTime" :{$gt :Date.now()}})
    .then(voter=>{

  if(voter){
    voter.otpval.pass = undefined;
    voter.otpval.expireTime =undefined;
    return voter.save()
    .then(voter=>{
        //session of voter
        req.session.isVLoggedIn = true;
        req.session.voter = voter;
        return req.session.save(err=>{
          //  console.log(err);
          res.redirect('/v/dashboard')
        });  
        
    })
    .catch(err=>{console.log(err)})
   
  }else{
      console.log('error')
      res.render('voter/auth/login',{
        linkId :linkId,
        electionId : electionId,
        electionTitle:electionT,
        pageTitle:"Login | Plz log in to proceed further",
        path:"/login",
        errorMsg:"Wrong otp!",
         oldInput : {email:null},
        validationErrors:errors.array()
    });
  }
    
})
}


//destroying the session
exports.postVlogout= (req, res)=>{
    req.session.destroy(err=>{
       // console.log(err);
        res.redirect('/');
    })
}