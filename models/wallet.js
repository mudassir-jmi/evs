const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const walletSchema = new Schema({
    baclance:{
        type:Number
    },
    publicAddres : {
        type:String
    },
    user:{
        type:String
    }
});




module.exports = mongoose.model('Wallet', walletSchema);