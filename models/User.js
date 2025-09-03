const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

// on the first day he created the people 
const UserSchema = new mongoose.Schema({

    email: {
        type: String, 
        required: true, 
        unique: true, 
        trim: true, 
        lowercase:true
    }, 
    
    username: {
        type: String, 
        required: true, 
        unique: true,
        trim: true, 
        minlength: 3, 
        maxlength: 20
    },
    fullName: {
        type: String, 
        required: true, 
        unique: false,
    }, 
    
    password: {
        type: String, 
        required: true
    }, 

    role: {
        type: String, 
        enum: ['client', 'admin'], 
        default: 'client'
    }, 


    dateOfBirth: {
        type: Date, 
        required: false 
        
    }, 
    countryOfResidence: {
        type: String, 
        required: false, 
        trim: true, 
        minlength: 3, 
        maxlength: 100, 
        lowercase: true
        


    }, 
    countryOfOrigin: {
        type: String, 
        required: false, 
        trim: true, 
        minlength: 3, 
        maxlength: 100, 
        lowercase: true
    },
    avatarUrl: {
        type: String, 
        required: false

    },
    reportCount:{
        type: Number, 
        required: false
        

    },
    
    persona: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Persona',
        required: false
    }
    

    

    


}, {timestamps: true})

UserSchema.pre('save', async function(next){
    try{
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 12);
    }

    next()} catch(error){
        next(error)
    }
})

UserSchema.methods.comparePassword = async function(candidatePassword){
    return bcrypt.compare(candidatePassword, this.password);
}

// get user without password. 
UserSchema.methods.toJSON = function() {
    const userObject = this.toObject()
    delete userObject.password
    return userObject
}

module.exports = mongoose.model('User', UserSchema); 