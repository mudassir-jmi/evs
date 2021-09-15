module.exports = (req,res,next)=>{           //check login
    if((!req.session.isLoggedIn) ||(!req.session.isVLoggedIn)){
       return  res.redirect('/');
    }
    next();
  }