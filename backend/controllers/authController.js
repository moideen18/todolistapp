const User = require('../models/User');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const dotenv = require('dotenv');

dotenv.config();

// Signup Controller
exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Create verification token
    const verificationToken = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Create new user
    const user = new User({
      username,
      email,
      password,
      verificationToken
    });

    await user.save();

    // Send verification email
    const verificationUrl = `http://localhost:3000/verify/${verificationToken}`;
    const emailText = `Click the link below to verify your email:\n\n${verificationUrl}`;

    await sendEmail(
      email,
      'Verify Your Email',
      emailText
    );

    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.'
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
};

// Login Controller
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare provided password with stored hashed password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Ensure email has been verified before allowing login
    if (!user.isVerified) {
      return res.status(400).json({ message: 'Email not verified' });
    }

    // Generate JWT for authenticated user
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    res.json({ 
      token, 
      message: 'Logged in successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
      }
    });
    
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Email Verification Controller
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;  // Get token from params
    console.log('Verification token received:', token);

    // Decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);

    // Find user and update verification status
    const user = await User.findOne({ 
      email: decoded.email,
      verificationToken: token
    });

    if (!user) {
      console.log('User not found or token invalid');
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    // Update user verification status
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    console.log('User verified successfully');

    // Generate login token
    const loginToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Email verified successfully',
      token: loginToken,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isVerified: true
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(400).json({ message: 'Email verification failed' });
  }
};

// Resend Verification Email Controller
exports.resendVerification = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // If already verified, no need to resend
    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified.' });
    }

    // Create a new verification token
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    user.verificationToken = verificationToken;
    await user.save();

    // Construct verification URL and send the email
    const verificationUrl = `${process.env.CLIENT_URL}/verify?token=${verificationToken}`;
    await sendEmail(email, 'Email Verification', `Please verify your email by clicking this link: ${verificationUrl}`);

    res.status(200).json({ message: 'Verification email resent successfully.' });
    
  } catch (error) {
    console.error('Error resending verification email:', error);
    res.status(500).json({ message: 'Server error during resending verification email.' });
  }
};
