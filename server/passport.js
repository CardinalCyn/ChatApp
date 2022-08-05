module.exports=(app,userModel,passport,TwitterStrategy,FacebookStrategy)=>{
    require("dotenv").config();
    passport.use(new TwitterStrategy({
      consumerKey: process.env.TWITTER_CLIENT,
      consumerSecret: process.env.TWITTER_SECRET,
      callbackURL: "https://192.168.1.192:5000/auth/twitter/callback"
      },
      (token, tokenSecret, profile, cb)=> {
        userModel.findOne({ twitterId: profile.username },  (err, user) =>{
          if(err){
            console.log(err);
            return cb(err);
          }
          if(!user){
              userModel.create({twitterId:profile.username,username:profile.username,profileImg:"uploads\\default.jpeg"},(error,data)=>{
                return(cb(error,data));
              })
            }
            else{
              return(cb(err,user));
            }
        });
      }
    ));
    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_CLIENT,
        clientSecret: process.env.FACEBOOK_SECRET,
        callbackURL: "https://192.168.1.192:5000/auth/facebook/callback"
      },
      (accessToken, refreshToken, profile, cb)=> {
        userModel.findOne({ facebookId: profile.id },  (err, user) =>{
          if(err){
            return cb(err);
          }
          if(!user){
            userModel.create({facebookId:profile.id,username:profile.displayName,profileImg:"uploads\\default.jpeg"},(error,data)=>{
              return(cb(error,data));
            })
          }
          else{
            return(cb(err,user));
          }
        });
      }
    ));
    passport.serializeUser((user,done)=>{
        done(null,user)
    })
    passport.deserializeUser((user,done)=>{
        done(null,user)
    })
    app.use(passport.initialize());
    app.use(passport.session());
}