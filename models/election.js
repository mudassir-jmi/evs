/*jshint esversion: 6 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const electionSchema = new Schema({
    electionTitle: {
        type:String,
        required:true
    },
    candidatesDetails : [{
        candName: {
            type:String
        },
        candAge :{
            type:Number
        },
        candidateWallet : {
            pub:String,
            prv: String,
            balance: String
        },
        bitvote:{
            type: String
        }

    }],
    voterMails : [{
        voterMail:{
            type:String
        }
    }],
    descs:{
        type:String,
        required: true
    },
    voterPublicLink :{
        type:String,
        required: true
    },
    endTimeVoterVerifLink: {
        type: Number,
        required :true
    },
    verifcationIdType:{
        type:String,
        required: true
    },
    desc:{
        type:String
    },
    wallet :{
      isCreated : Boolean,
      hasCoinbase : Boolean,
      hasAnnounced : Boolean,
      adminWallet :{
          pub:String,
          prv: String
      },
      candidateWallet : [{
          pub:String,
          prv: String,
          balance: Number
      }],
      voterWallet : [{
          pub:String
      }]
    },
    blockchain : {
        type:Schema.Types.ObjectId,
        ref:'Blockchain'
    },
    admin : {
        email: { type:String,required: true },
        adminId :{
            type: Schema.Types.ObjectId,
            ref:'User',
            required: true
        }
    }
});

electionSchema.methods.addPubToCandidate = function(){

}

module.exports = mongoose.model('Election', electionSchema);