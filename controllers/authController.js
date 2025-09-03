const User = require('../models/User')
const passport = require('passport')





exports.register = async (req, res, next) =>{

    try{
        let {fullName, email, username,  password } = req.body

        // normalizing input 
        email = String(email || '').trim().toLowerCase()
        username = String(username || '').trim()
        fullName = String(fullName || '').trim()

        // do they already exist
        const existingUser = await User.findOne({
            $or: [{email}, {username}]})

        if (existingUser) {
            return res.status(409).json({code: "conflict", message: 'A user already exists with this email or username!'})
           
        }

        // no? build a user, brick by brick
        // enforce client role to prevent role escalation
        const user=  new User({fullName, email, password, username, role: 'client'})
        await user.save()
        
        // establish a session
        req.login(user, (err)=>{
            if (err) return next(err)
                return res.status(201).json({user: user.toJSON()})
        })   

    } catch (err){
        console.log(err)
        res.status(500).json({code: 'internal_error', message: 'Error registering user. Sorry!'})
       
    }

}


// login 
exports.login = async (req, res, next) =>{
    
        passport.authenticate('local', (err, user)=>{
            if (err){
                return next(err)
                 
            }

            if (!user){
                
                return res.status(401).json({message: "Email or password incorrect", code: "invalid_credentials"})
            }

            req.login(user, (err)=>{
                if (err) return next(err)
                return res.status(200).json({user: user.toJSON()})
            })
        })(req, res, next)

    

}

// user profile
exports.getMe = async (req, res) => {
    const user = req.user

    if (!user){
        return res.status(401).json({code: 'unauthorized',message: 'authentication required'})
    }

    return res.status(200).json( { 
        "user": user.toJSON()})
    
}





// cop out of the mess
exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err){
            return next(err)
        }

        req.session.destroy(()=>{

            res.status(200).json({message: 'Logged out successfully. BYE!'})
        })

    })
}

