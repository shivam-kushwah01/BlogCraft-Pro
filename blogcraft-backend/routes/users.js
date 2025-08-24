const express = require('express');
const { updateProfile, deleteAccount } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.put('/profile', updateProfile);
router.delete('/account', deleteAccount);

module.exports = router;