/*jshint esversion: 6 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const voterSchema = new Schema({
    name:{    
        type:String
    },
    email:{
        type:String
    },
    phoneNum:{
        type:String
    },
    numOfId:{
        type:String
    },
    camPhoto : {
        type:String
    },
    otpval : {
        pass:{
            type:String
        },
        expireTime :{ 
            type:Date
        }
    },
    allowingStatus :{
        type:Boolean
    },
    votingStatus :{
        type:Boolean
    },
    wallet:{
        status:Boolean,
        bitvote:Number
    },
    election:{
        electionTitle : {
            type:String
        },
        electionId : {
            type:String,
            ref:'Election'
        }
    }
});

module.exports = mongoose.model('Voter', voterSchema);