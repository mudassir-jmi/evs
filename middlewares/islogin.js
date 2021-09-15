module.exports = (req,res,next)=>{           //check login
    if(req.session.isLoggedIn){
       return  res.redirect('/o/dashboard');
    }
    next();
  }