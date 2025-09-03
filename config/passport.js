const LocalStrategy = require('passport-local').Strategy
const User = require('../models/User')

module.exports = function(passport){
    // local strategy implementation for passport.js session

    passport.use( new LocalStrategy({
        usernameField: "email", 
        passwordField: "password"
    }, 
    async (email, password , done) => {
        try{
            const user = await User.findOne({email: email})

            if (!user) {
                return done(null, false, {message: "No user found with this email"})
            }

            const isValidPassword = await user.comparePassword(password)

            if (!isValidPassword) {
                return done(null, false, {message: "Incorrect Password"})
            }

            return done(null, user)

        } catch (error){
            return done(error)
        }
    }
))

// serialize user
passport.serializeUser((user, done)=>{
    done(null, user.id)
})

// deserealize user
passport.deserializeUser(async (id, done)=>{
    try{
        const user = await User.findById(id)
        done(null, user)

    } catch(error){
        done(error)
    }
})
}