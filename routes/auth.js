const express = require('express')
const router = express.Router()
const {register, login, logout, getMe} = require('../controllers/authController')
const {requireAuth} = require('../middleware/auth')
const { strictAuthLimiter, generalLimiter } = require('../middleware/rateLimiters')
const { signupValidators, loginValidators, handleValidation } = require('../middleware/validators');

router.get('/csrf-token', (req, res)=>{
    const token = req.csrfToken();
    res.status(200).json({csrfToken: token})
})
// rate limiting middleware
router.use(generalLimiter)

// signup route
router.post('/signup', strictAuthLimiter, signupValidators, handleValidation, register)

// login route
router.post('/login',strictAuthLimiter,  loginValidators, handleValidation, login)

//profile route
router.get('/me', requireAuth, getMe)

//logout route
router.post('/logout', requireAuth, logout); 


module.exports = router