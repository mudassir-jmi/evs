const Admin = require('../models/admin');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
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


exports.getLogin = (req, res, next) => {
    res.render('organizer/auth/loginsignup',{
        pageTitle:"Blockchain Voting System | Login",
        errorMsg : "",
        isSignupMode:false,
        oldInput : {email:null, password:null,aname:null,aemail:null, apassword:null, cpassword:null},
        validationErrors:[]
    });
}


exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const pass = req.body.password;
    const errors = validationResult(req);
    if(!errors.isEmpty()){       // if email was empty
        return res.status(422)
        .render('organizer/auth/loginsignup',{
            pageTitle:"Blockchain Voting System | Login",
            path:"/login",
            isSignupMode:false,
            errorMsg:errors.array()[0].msg,
            oldInput : {email:null, password:null,aname:null, aemail:null, apassword:null, cpassword:null},
            validationErrors:errors.array()
    
        });
    }

   Admin.findOne({email:email})
    .then(admin=>{
        if(!admin){               // if email is not found
           return res.status(422)
           .render('organizer/auth/loginsignup',{
            pageTitle:"Blockchain Voting System | Login",
            path:"/login",
               errorMsg:'Invalid user email or password!',
               isSignupMode:false,
               oldInput : {email:email, password:pass,aname:null,aemail:null, apassword:null, cpassword:null},
               validationErrors:[]
           });
        }
      bcrypt.compare(pass,admin.pass)
      .then(matched=>{
          if(matched){
            req.session.isLoggedIn = true;
            req.session.admin = admin;
            return req.session.save(err=>{
              //  console.log(err);
              res.redirect('/o/dashboard');
            });   
          } else{           // if password not matched
            return res.status(422)
           .render('organizer/auth/loginsignup',{
            pageTitle:"Blockchain Voting System | Login",
            path:"/login",
            isSignupMode:false,
               errorMsg:'Invalid user email or password!',
               oldInput : {email:email, password:pass,aname:null, aemail:null, apassword:null, cpassword:null},
               validationErrors:[]
           });
          }      
      })  
    })
    .catch(err =>console.log(err));
}
//destroying the session
exports.postOlogout = (req, res)=>{
    req.session.destroy(err=>{
       // console.log(err);
        res.redirect('/');
    })
}

exports.postSignup = (req, res, next) => {
    const email = req.body.aemail;
    const pass = req.body.apassword;
    const name = req.body.aname;
    const errors = validationResult(req);
    console.log(name)
    if(!errors.isEmpty()){
        return res.status(422)
        .render('organizer/auth/loginsignup',{
            pageTitle:"Blockchain Voting System | Login",
            path:"/login",
            errorMsg:errors.array()[0].msg,
            isSignupMode:true,
            oldInput : {email:null, password:null, aemail:email, aname:name, apassword:pass, cpassword:req.body.cpassword},
            validationErrors:errors.array()
    
        });
    }
        return bcrypt.hash(pass,13)
        .then(hashedpass=>{
            const a = new Admin({
                name:name,
                email:email,
                pass:hashedpass,
                elections:[]
            });
            return a.save();
        })
        .then(result=>{    
            res.redirect('/');
            //if mail sent
        })  
    // })
    .catch((error) => {
        console.error(error)
      })
}

//reset password
exports.getReset = (req, res, next) => {
    
    res.render('organizer/auth/reset',{
        pageTitle:"Reset your password | BVS",
            path:"/reset",
            isResetmode:true,
            errorMsg:null, 
            oldInput : {email:null}
    })
}

exports.postReset =  (req, res, next) => {
    const email = req.body.email;
    const errors = validationResult(req);
    if(!errors.isEmpty()){       // if email was empty
    return res.status(422)
        .render('organizer/auth/reset',{
            pageTitle:"Reset your password | BVS",
            path:"/reset",
            isResetmode:true,
            errorMsg:errors.array()[0].msg,
            oldInput : {email:email},
            validationErrors:errors.array()
    
        });
    }
    crypto.randomBytes(32,(err,buffer)=>{
        if(err){
            console.log(err);
            return res.redirect('/resetpassword')
        }
    const token = buffer.toString('hex');
    Admin.findOne({email:email})
    .then(admin=>{
        if(!admin){
         return   res.status(422)
        .render('organizer/auth/reset',{
            pageTitle:"Reset your password | BVS",
            path:"/reset",
            isResetmode:true,
            errorMsg:"No account found with this related email address!",
            oldInput : {email:email},
            validationErrors:errors.array()
    
        });
        }
            
            admin.resetToken = token;
            admin.resetTokenExpiration = Date.now()+3600000;             //2 minute
            console.log(admin.resetTokenExpiration);
            return admin.save();
         })
         .then(admin=>{
            const aId = admin._id;
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
                        subject : "YOUR EVS RESETING PASSWORD ",
                        text: "dont share it with anyone ",
                        html:`
                               <h3>Here is your link for reseting password!:-  @bvs </h3>
                               <p> click here to <a href="http://localhost:3000/resetpassword/${aId}/${token}">reset password</a></p>
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
                res
                .render('organizer/auth/reset',{
                    pageTitle:"Reset your password | BVS",
                    path:"/reset",
                    isResetmode:false,
                    oldInput : {email:email},
                    errorMsg:""
            
                });
        })  
    })
    .catch(err=>{console.log(err)})
});

}

//new password
exports.getNewPass =  (req, res, next) => {
const aId  = req.params.aid;
const key = req.params.key;
    // console.log(aId,key);
  Admin.findOne({_id: aId, resetToken: key, resetTokenExpiration:{$gt : Date.now()}})
  .then(admin=>{
       if(!admin){
        return res.redirect('/oreset')
    }
    res.render('organizer/auth/newpass',{
        pageTitle:"Enter  your new password | BVS",
            path:"/newpass",
            isNewPassmode:true,
            errorMsg:null, 
            aId:aId, 
            key:key,
            oldInput : {password:null}
    })
})
.catch((error) => {
    console.error(error)
  })

   
}  

exports.postNewPass = (req, res, next) => {
    const pass = req.body.password;
    const aId = req.body.aId;
    const key = req.body.key;
    // console.log(pass, aId, key)
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(422)
        .render('organizer/auth/newpass',{
            pageTitle:"Blockchain Voting System | Login",
            path:"/login",
            errorMsg:errors.array()[0].msg,
            isNewPassmode:true,
            aId:aId, 
            key:key,
            oldInput : { password:pass},
            validationErrors:errors.array()
    
        });
    }
 
    Admin.findOne({_id: aId, resetToken: key, resetTokenExpiration:{$gt : Date.now()}})
  .then(admin=>{
       if(!admin){
        return res.redirect('/oreset')
    }
    resetUser = admin;
    return bcrypt.hash(pass,13)
 })
.then(hashedpass=>{
    resetUser.pass = hashedpass;
    resetUser.resetToken = undefined;
    resetUser.resetTokenExpiration = undefined;
    return resetUser.save();
})
.then(result=>{
    res.redirect('/')
})
.catch((error) => {
    console.error(error)
  })

}