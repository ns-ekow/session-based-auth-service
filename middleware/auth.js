// Require authentication
exports.requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  // res.redirect('/auth/login');
  res.status(401).json({message: 'authorization required'})
};



