const mongoose = require('mongoose')

const PersonaSchema = new mongoose.Schema({
    
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }, 
    personaName: {
        type: String, 
        required: true
    }, 
    
    avatarUrl: {
        type: String, 
        required: false
    }, 
    coverImageUrl: {
        type: String, 
        required: false
    }, 
    trailerVideo: {
        type: String, 
        required: false
    }


})

module.exports = mongoose.model('Persona', PersonaSchema);