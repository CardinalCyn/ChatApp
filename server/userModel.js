const mongoose=require('mongoose');

const userSchema=new mongoose.Schema({
    username:{type:String},
    password:{type:String},
    profileImg:{type:String},
    twitterId:{type:String},
    facebookId:{type:String},
    instaId:{type:String},
    roomDisplayed:{type:String},
    roomList:{type:Array},
})

const userModel=mongoose.model('User',userSchema);

module.exports=userModel;