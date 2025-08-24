const User = require('../models/user');

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, bio, website, location, twitter, linkedin, github } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        name,
        email,
        bio,
        website,
        location,
        twitter,
        linkedin,
        github
      },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete user account
exports.deleteAccount = async (req, res) => {
  try {
    // First, delete all posts by this user
    await Post.deleteMany({ authorId: req.user._id });
    
    // Then delete the user
    await User.findByIdAndDelete(req.user._id);
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};