const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { sendOTP, sendWelcomeEmail } = require('../services/emailService');
const { uploadImage } = require('../services/imageService');

// Register new user
exports.register = async (req, res) => {
  try {
    const { name, mobile, rollNo, email, password } = req.body;

    // Validate required fields
    if (!name || !mobile || !rollNo || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, mobile number, roll number, email, and password.'
      });
    }

    // Check if profile picture is uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Student photo is required.'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ mobile }, { rollNo }, { email }] });
    if (existingUser) {
      let message = 'User already registered.';
      if (existingUser.mobile === mobile) message = 'Mobile number already registered.';
      if (existingUser.rollNo === rollNo) message = 'Roll number already registered.';
      if (existingUser.email === email) message = 'Email already registered.';
      
      return res.status(400).json({
        success: false,
        message
      });
    }

    // Upload profile picture to ImageKit
    const imageUrl = await uploadImage(req.file.buffer, req.file.originalname);

    // Create new user
    const user = new User({
      name,
      mobile,
      rollNo,
      email,
      password,
      profilePicture: imageUrl
    });

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP via email
    await sendOTP(email, otp, name);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for the OTP verification code.',
      userId: user._id
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error during registration.'
    });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId and OTP.'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    if (user.verified) {
      return res.status(400).json({
        success: false,
        message: 'User already verified.'
      });
    }

    // Verify OTP
    const isValid = user.verifyOTP(otp);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP.'
      });
    }

    // Mark user as verified
    user.verified = true;
    user.otp = undefined;
    await user.save();

    // Send welcome email
    sendWelcomeEmail(user.email, user.name).catch(err => 
      console.error('Welcome email error:', err)
    );

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Email verified successfully. Welcome to CampusXChange!',
      token,
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during OTP verification.'
    });
  }
};

// Resend OTP
exports.resendOTP = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId.'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    if (user.verified) {
      return res.status(400).json({
        success: false,
        message: 'User already verified.'
      });
    }

    // Generate new OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP via email
    await sendOTP(user.email, otp, user.name);

    res.json({
      success: true,
      message: 'OTP resent successfully. Please check your email.'
    });
  } catch (error) {
    console.error('Resend OTP Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resending OTP.'
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide mobile number and password.'
      });
    }

    // Find user and include password field
    const user = await User.findOne({ mobile }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    // Check if user is verified
    if (!user.verified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email first. Check your inbox for the OTP.',
        userId: user._id
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login.'
    });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        mobile: req.user.mobile,
        email: req.user.email,
        profilePicture: req.user.profilePicture,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('Get User Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data.'
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile.'
    });
  }
};
