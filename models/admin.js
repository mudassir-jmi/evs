/*jshint esversion: 6 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const adminSchema = new Schema({
    name:{
        type:String
    },
    email:{
        type:String,
        required:true
    },
    pass :{
        type:String,
        required:true
    },
    resetToken:String,
    resetTokenExpiration:String,
    elections:[{
        electionTitle : {
            type:String
        },
        electionId : {
            type:String,
            ref:'Election'
        }
    }]
});

//create an election and add to the amins election array
adminSchema.methods.addToCtreateElection = function(electionTitle, electionId){
   // console.log(election.electionTitle)
    const updatedElection = [...this.elections];
    updatedElection.push({
        electionTitle : electionTitle,
        electionId : electionId
    });
    this.elections = updatedElection;
    return this.save();
} 

//deleting one election
adminSchema.methods.deleteElection = function(electionId){
    // console.log( this.elections);
    const updatedElections = this.elections.filter(items=>{
        return items.electionId.toString() !== electionId.toString();    //returning all produccts except productId's product
    });

    this.elections = updatedElections;         
    return this.save();
}

module.exports = mongoose.model('Admin', adminSchema);