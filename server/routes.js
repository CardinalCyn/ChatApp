
module.exports=(app,userModel,bcrypt,multer,passport,TwitterStrategy,FacebookStrategy)=>{
    const { v4: uuidv4 } = require('uuid');
    const fs=require('fs');
    const storage=multer.diskStorage({
        destination:(req,file,cb)=>{
            cb(null,'./uploads')
        },
        filename:(req,file,cb)=>{
            const arraySplit=file.mimetype.split('/');
            const fileName=uuidv4()+"."+arraySplit[arraySplit.length-1];
            cb(null,fileName);
        }
    })
    const upload = multer({ 
        storage:storage,
        fileFilter:(req,file,cb)=>{
            //checks if the file is a picture or not
            if(file.mimetype=="image/png"||file.mimetype=="image/jpg"||file.mimetype=="image/jpeg"){
                cb(null,true);
            }
            else{
                cb(null,false);
                return cb(new Error('Only pngs, jpgs, and .jpegs are allowed!'))
            }
        }
    })
    app.post('/register',async (req,res)=>{
        const username=req.body.username;
        const password=req.body.password;
        //checks if username is b/w 2 and 16 characters long, and if pass is between 8 and 40 characters
        let usernameValid=false;
        let passwordValid=false;
        if(username.length<=16&&username.length>=2){
            usernameValid=true;
        }
        if(password.length<=40&&password.length>=2){
            passwordValid=true
        }
        !usernameValid|!passwordValid?res.json({usernameValid:usernameValid,passwordValid:passwordValid,status:"credential input invalid"}):
        //finds someone with this username, sees if they exist or not, and if not, creates user in db, and sends res json to client that will redirect them to signin page
        userModel.findOne({username:username},(err,user)=>{
            if(err){
                res.json({error:err});
            }
            if(user){
                res.json({status:"username already exists"});
            }
            else{
                bcrypt.hash(password,12,async (err,hashedPassword)=>{
                    if (err){
                        console.log(err);
                    }
                    else{
                        await userModel.create({
                            username:username,
                            password:hashedPassword,
                            profileImg:'uploads\\default.jpeg'
                        });
                        res.json({status:"created"});
                    }
                })
            }
        })
    });
    
    app.post('/', async (req,res)=>{
        const username=req.body.username;
        const password=req.body.password;
        userModel.findOne({username:username},(err,user)=>{
            if(err){
                throw err;
            }
            else{
                if(!user){
                    return res.json({status:"That username doesn't exist!"})
                }
                else{
                    bcrypt.compare(password, user.password,(error,result)=>{
                        if(error){
                            throw err;
                        }
                        else{
                            if(result){
                                req.session.user=user;
                                req.session.save((err)=>{
                                    if(err){
                                        res.json({error:err})
                                    }
                                    else{
                                        return res.json({user:req.session.user});
                                    }
                                });
                            }
                            else{
                                return res.json({status:"That password is incorrect."});
                            }
                        }
                    })
                }
            }
        })
    })
    //checks the user session if its valid, returns loggedin:false if not, otherwise sends the user info
    app.get("/checkSession",async (req,res)=>{
        console.log("checked");
        if(req.session.user){
            return res.json({loggedIn:true, user:req.session.user});
        }
        else{
            return res.json({loggedIn:false});
        }
    })
    app.post("/profilePic",upload.single('profilePic'),async(req,res)=>{
        //updates entry in mongo with a req file path to the photo
        if(!req.file){
            res.json({status:"no file"});
        }
        else{
            let filter;
            if(req.session.user.hasOwnProperty('facebookId')){
                filter={facebookId:req.session.user.facebookId}
            }
            else if(req.session.user.hasOwnProperty('twitterId')){
                filter={twitterId:req.session.user.twitterId}
            }
            else if(req.session.user.hasOwnProperty('instaId')){
                filter={instaId:req.session.user.instaId}
            }
            else{
                filter={username:req.session.user.username}
            }
            //finds db entry based on username, changes profileImg to tht file
            userModel.findOneAndUpdate(filter,{profileImg:req.file.path},(err,data)=>{
                if(err){
                    console.log(err);
                    throw err;
                }
                //if the previous prof pic wasn't the default image, it will delete the pic from server files
                if(data.profileImg!=="uploads\\default.jpeg"){
                    fs.unlink(data.profileImg,(err)=>{
                        if(err){
                            throw err;
                        }
                    })
                }
                res.json({status:"success"});
            })
        }
    })
    app.get("/profilePic",async(req,res)=>{
        if(!req.session.user){
            res.json({status:"no session present"})
        }
        else{
            //filter to check if the user has an fb id. fb doesnt use usernames, so use their real names as profile name. to ensure that theyre unique, we see if the entry has an fb id, and we query for that in the db instead of using the username
            let filter;
            if(req.session.user.hasOwnProperty('facebookId')){
                filter={facebookId:req.session.user.facebookId}
            }
            else if(req.session.user.hasOwnProperty('twitterId')){
                filter={twitterId:req.session.user.twitterId}
            }
            else if(req.session.user.hasOwnProperty('instaId')){
                filter={instaId:req.session.user.instaId}
            }
            else{
                filter={username:req.session.user.username}
            }
            //finds entry in mongodb for user w/ session username
            userModel.findOne(filter,(err,data)=>{
                if(err){
                    console.log(err);
                    throw err;
                }
                //checks if mongodb has link to the profile picture
                if(data.profileImg){
                    //sends the file through the path designated by the user's entry
                    res.sendFile(data.profileImg,{root:"."});
                }
                else{
                    res.json({status:"no profile picture found"})
                }
            })
        }
    })
    app.post("/roomList",async(req,res)=>{
        let filter;
        if(req.session.user.hasOwnProperty('facebookId')){
            filter={facebookId:req.session.user.facebookId}
        }
        else if(req.session.user.hasOwnProperty('twitterId')){
            filter={twitterId:req.session.user.twitterId}
        }
        else if(req.session.user.hasOwnProperty('instaId')){
            filter={instaId:req.session.user.instaId}
        }
        else{
            filter={username:req.session.user.username}
        }
        userModel.findOneAndUpdate({filter},req.body,(err,data)=>{
            if(err){
                console.log(err);
                throw err;
            }
        })
    })
    app.get("/roomList",async(req,res)=>{
        let filter;
        if(req.session.user.hasOwnProperty('facebookId')){
            filter={facebookId:req.session.user.facebookId}
        }
        else if(req.session.user.hasOwnProperty('twitterId')){
            filter={twitterId:req.session.user.twitterId}
        }
        else if(req.session.user.hasOwnProperty('instaId')){
            filter={instaId:req.session.user.instaId}
        }
        else{
            filter={username:req.session.user.username}
        }
        userModel.findOne({filter},(err,data)=>{
            if(err){
                console.log(err);
                throw err;
            }
            res.json({roomList:data.roomList})
        })
    })
    app.post("/roomDisplayed",async(req,res)=>{
        let filter;
        if(req.session.user.hasOwnProperty('facebookId')){
            filter={facebookId:req.session.user.facebookId}
        }
        else if(req.session.user.hasOwnProperty('twitterId')){
            filter={twitterId:req.session.user.twitterId}
        }
        else if(req.session.user.hasOwnProperty('instaId')){
            filter={instaId:req.session.user.instaId}
        }
        else{
            filter={username:req.session.user.username}
        }
        userModel.findOneAndUpdate({filter},req.body,(err,data)=>{
            if(err){
                console.log(err);
                throw err;
            }
        })
    })
    app.get("/roomDisplayed",async(req,res)=>{
        let filter;
        if(req.session.user.hasOwnProperty('facebookId')){
            filter={facebookId:req.session.user.facebookId}
        }
        else if(req.session.user.hasOwnProperty('twitterId')){
            filter={twitterId:req.session.user.twitterId}
        }
        else if(req.session.user.hasOwnProperty('instaId')){
            filter={instaId:req.session.user.instaId}
        }
        else{
            filter={username:req.session.user.username}
        }
        userModel.findOne({filter},(err,data)=>{
            if(err){
                console.log(err);
                throw err;
            }
            res.json({roomDisplayed:data.roomDisplayed});
        })
    })
    //destroys session in browser
    app.post("/logout",async(req,res)=>{
        if(req.session){
            req.session.cookie.maxAge = 0
            delete req.session
            res.clearCookie("express.sid");
            res.json({status:"logged out"})
        }
    })
    //twitter authentication routes
    app.get("/auth/twitter",passport.authenticate("twitter"));

    app.get("/auth/twitter/callback",passport.authenticate('twitter',{failureRedirect:'/login/failed'}),(req,res)=>{
        req.session.user={username:req.session.passport.user.twitterId, twitterId:req.session.passport.user.twitterId, profileImg:"uploads\\default.jpeg",};
        req.session.save((err)=>{
            if(err){
                console.log(err);
            }
        });
        res.redirect('https://192.168.1.192:3000/profile');
    });
    //facebook authentication routes
    app.get("/auth/facebook",passport.authenticate("facebook"));

    app.get("/auth/facebook/callback",passport.authenticate('facebook',{failureRedirect:'/login/failed'}),(req,res)=>{
        req.session.user={username:req.session.passport.user.username, profileImg:"uploads\\default.jpeg",facebookId:req.session.passport.user.facebookId};
        req.session.save((err)=>{
            if(err){
                console.log(err);
            }
        });
        res.redirect('https://192.168.1.192:3000/profile');
    });
}