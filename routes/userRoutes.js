const express = require('express')
const router = express.Router(); 
const {getMyProfile, updateMyProfile} = require('../controllers/userController')
const {requireAuth} = require('../middleware/auth');
const { profileUpdateValidators, handleValidation } = require('../middleware/validators');


// routes
router.get('/me', requireAuth,getMyProfile )
router.put('/me', requireAuth,profileUpdateValidators, handleValidation, updateMyProfile)

module.exports = router