const express = require("express");
const protectedrouter = express.Router();
const authorize = require("../middlewares/authMiddleware");
const SpeakerProfile = require("../models/Speaker");
const Booking = require("../models/Booking");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const GoogleService = require("../utils/googleService");
const googleService = new GoogleService();
require("dotenv").config({ path: "../.env" });

// Sample route that requires 'user' role
protectedrouter.get("/user-dashboard", authorize(["user"]), (req, res) => {
  res
    .status(200)
    .json({ message: "Welcome to the User Dashboard", user: req.user });
});

// Sample route that requires 'speaker' role
protectedrouter.get(
  "/speaker-dashboard",
  authorize(["speaker"]),
  (req, res) => {
    res
      .status(200)
      .json({ message: "Welcome to the Speaker Dashboard", user: req.user });
  }
);

// Sample route that allows both 'user' and 'speaker' roles
protectedrouter.get(
  "/general-dashboard",
  authorize(["user", "speaker"]),
  (req, res) => {
    res
      .status(200)
      .json({ message: "Welcome to the General Dashboard", user: req.user });
  }
);

protectedrouter.post(
  "/createspeakerprofile",
  authorize(["speaker"]), // Only speakers are allowed
  async (req, res) => {
    try {
      const { expertise, pricePerSession } = req.body;

      // Get the userId from req.user (set by the authorize middleware)
      const userId = req.user.id;

      // Check if the speaker profile already exists
      const speakerProfileExists = await SpeakerProfile.findOne({
        where: { userId },
      });

      if (speakerProfileExists) {
        return res
          .status(400)
          .json({ message: "Speaker Profile already exists!" });
      }

      // Create the speaker profile
      const speakerProfile = await SpeakerProfile.create({
        userId,
        expertise,
        pricePerSession,
      });

      res.status(200).json({
        message: "Speaker Profile Created!",
        speakerProfile,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

protectedrouter.post("/book", authorize(["user"]), async (req, res) => {
  let calendarLink = ""; // Initialize calendar link
  try {
    const { speakerId, date, timeSlot } = req.body;
    const userId = req.user.id;

    // Check if the speaker exists
    const speakerProfile = await SpeakerProfile.findOne({
      where: { userId: speakerId },
    });

    if (!speakerProfile) {
      return res.status(404).json({ message: "Speaker not found!" });
    }

    // Check if the slot is already booked
    const bookingExists = await Booking.findOne({
      where: { speakerId, date, timeSlot },
    });

    if (bookingExists) {
      return res.status(400).json({ message: "Slot already booked!" });
    }

    // Create the booking
    const booking = await Booking.create({
      userId,
      speakerId,
      date,
      timeSlot,
    });

    // Fetch user and speaker details
    const user = await User.findByPk(userId);
    const speaker = await User.findByPk(speakerId);

    // Email configuration
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    try {
      const [start, end] = booking.timeSlot.split(" - ");

      // Convert start time and end time to 24-hour format
      const convertTo24Hour = (time) => {
        const [timePart, period] = time.split(" ");
        let [hours, minutes] = timePart.split(":").map(Number);

        if (period === "PM" && hours !== 12) {
          hours += 12;
        } else if (period === "AM" && hours === 12) {
          hours = 0;
        }

        return `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`;
      };

      const bookingDetails = {
        date: booking.date,
        startTime: convertTo24Hour(start), // Extract from your time slot
        endTime: convertTo24Hour(end), // Extract from your time slot
        userEmail: user.email,
        speakerEmail: speaker.email,
      };

      // Create calendar event
      calendarLink = await googleService.createCalendarEvent(bookingDetails);

      console.log("Calendar Link:", calendarLink);
    } catch (error) {
      console.error("Booking confirmation failed:", error);
      // Handle error (e.g., show user-friendly message)
    }

    const mailOptionsForUser = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Booking Confirmation",
      text: `Your session with ${speaker.firstName} ${speaker.lastName} on ${date} at ${timeSlot} has been successfully booked. Calendar Link: ${calendarLink}`,
    };

    const mailOptionsForSpeaker = {
      from: process.env.EMAIL_USER,
      to: speaker.email,
      subject: "New Booking Notification",
      text: `You have a new booking from ${user.firstName} ${user.lastName} on ${date} at ${timeSlot}. Calendar Link: ${calendarLink}`,
    };

    // Send emails to both user and speaker
    await transporter.sendMail(mailOptionsForUser);
    await transporter.sendMail(mailOptionsForSpeaker);

    res
      .status(200)
      .json({ message: "Session Booked and Notifications Sent!", booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = protectedrouter;
