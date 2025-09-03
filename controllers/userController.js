const User = require("../models/User")


exports.getMyProfile = async (req, res) => {
    const user = req.user

    if (!user){
        return res.status(401).json({code: 'unauthorized',message: 'authentication required'})
    }

    return res.status(200).json( { 
        user: user.toJSON()})
   
}

exports.updateMyProfile = async (req, res, next) => {
  try {
    // only these fields allowed
    const {
      fullName,
      avatarUrl,
      countryOfResidence,
      countryOfOrigin,
      dateOfBirth
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: { code: 'not_found', message: 'User not found' } });
    }

    // apply updates only if provided
    if (typeof fullName === 'string') user.fullName = fullName.trim();
    if (typeof avatarUrl === 'string') user.avatarUrl = avatarUrl;
    if (typeof countryOfResidence === 'string') user.countryOfResidence = countryOfResidence.trim().toLowerCase();
    if (typeof countryOfOrigin === 'string') user.countryOfOrigin = countryOfOrigin.trim().toLowerCase();
    if (dateOfBirth instanceof Date || typeof dateOfBirth === 'string') user.dateOfBirth = dateOfBirth;

    // explicitly DO NOT allow updating email/username/role here
    // if (email || username) ignore silently or reject in a future enhancement

    await user.save();
    return res.status(200).json({ user: user.toJSON() });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({
        error: { code: 'conflict', message: 'Duplicate field value' }
      });
    }
    console.error(err);
    return res.status(500).json({
      error: { code: 'internal_error', message: 'Error updating user' }
    });
  }
};
