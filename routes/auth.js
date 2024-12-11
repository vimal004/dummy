const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const router = express.Router();
const nodemailer = require("nodemailer");
const crypto = require("crypto"); // For generating OTP
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: "../.env" });
const otpExpirationTime = 10 * 60 * 1000;

const emailValidator = (email) => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailRegex.test(email);
};

const passwordValidator = (password) => {
  // Password should be at least 8 characters, contain at least one uppercase letter,
  // one lowercase letter, one digit, and one special character.
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}|\[\]\\:;,.<>?/~`]).{8,}$/;
  return passwordRegex.test(password);
};

// Signup Route
router.post("/signup", async (req, res) => {
  const { firstName, lastName, email, password, userType } = req.body;

  // Validate email format
  if (!emailValidator(email)) {
    return res.status(400).json({ message: "Invalid email format." });
  }

  // Validate password strength
  if (!passwordValidator(password)) {
    return res.status(400).json({
      message:
        "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one digit, and one special character.",
    });
  }

  if (!["user", "speaker"].includes(userType)) {
    return res.status(400).json({ message: "Invalid user type." });
  }

  try {
    // Check if the email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    let otp = crypto.randomInt(100000, 999999); // Generates a 6-digit OTP
    otp = otp.toString(); // Convert OTP to a string

    // Set OTP expiration time (10 minutes from now)
    const otpExpiration = new Date(Date.now() + otpExpirationTime);

    // Create the user with OTP and expiration time
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      userType,
      otp, // Save the OTP temporarily for verification
      isVerified: false, // Set as not verified initially
      otpExpiration, // Store the full expiration time with date and time
    });

    // Send OTP to the user's email
    sendOTP(email, otp);

    res
      .status(201)
      .json({ message: "Signup successful! Please verify your email.", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Signup failed. Please try again later." });
  }
});

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // Your Gmail app password
  },
});

// Generate and send OTP
function sendOTP(email, otp) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify Your Account",
    text: `Your OTP for account verification is: ${otp}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
}

// OTP Verification Route
router.post("/verify", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    console.log("Current Time: ", new Date());
    console.log("OTP Expiration Time: ", user.otpExpiration);

    // Check if OTP has expired
    if (user.otpExpiration && new Date() > new Date(user.otpExpiration)) {
      return res.status(400).json({ message: "OTP has expired." });
    }
    console.log("OTP: ", user.otp);
    console.log("orginal OTP: ", otp);

    // Verify OTP
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    // Activate the account
    user.isVerified = true;
    await user.save();

    res.status(200).json({ message: "Account verified successfully!" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Verification failed. Please try again later." });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    if (!user.isVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email to activate the account." });
    }

    const token = jwt.sign(
      { id: user.id, userType: user.userType },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.status(200).json({ message: "Login successful.", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login failed. Please try again later." });
  }
});

router.delete("/deleteuser", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    await user.destroy();
    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete user." });
  }
});

module.exports = router;
