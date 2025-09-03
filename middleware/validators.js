const { body, validationResult } = require('express-validator');

const signupValidators = [
  body('email')
    .isEmail().withMessage('Invalid email')
    .normalizeEmail(),
  body('username')
    .isString().withMessage('Username is required')
    .trim()
    .isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username must be alphanumeric/underscore'),
  body('fullName')
    .isString().withMessage('Full name is required')
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Full name must be 1-100 characters'),
  body('password')
    .isString().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
];

const loginValidators = [
  body('email')
    .isEmail().withMessage('Invalid email')
    .normalizeEmail(),
  body('password')
    .isString().withMessage('Password is required')
    .notEmpty().withMessage('Password is required')
];

const profileUpdateValidators = [
  body('fullName')
  .optional()
  .isString().withMessage('Full name must be a string')
  .trim()
  .isLength({ min: 1, max: 100 }).withMessage('Full name must be 1-100 characters'),
  
  body('avatarUrl')
  .optional()
  .isURL().withMessage('avatarUrl must be a valid URL'),

  body('countryOfOrigin')
  .optional()
  .isString().withMessage('country of origin must be a string')
  .trim()
  .isLength({ min: 3, max: 100 }).withMessage('country of origin must be 3-100 characters'),
 
  body('countryOfResidence')
  .optional()
  .isString().withMessage('country of residence must be a string')
  .trim()
  .isLength({ min: 3, max: 100 }).withMessage('country of residence must be -100 characters'),

  body('dateOfBirth')
  .optional()
  .isISO8601()
  .toDate()


]

const handleValidation = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  return res.status(400).json({
    errors: result.array().map(e => ({
      field: e.path,
      message: e.msg,
      code: 'validation_error'
    }))
  });
};

module.exports = {
  signupValidators,
  loginValidators,
  profileUpdateValidators,
  handleValidation
};