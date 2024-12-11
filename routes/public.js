const express = require("express");
const publicRouter = express.Router();
const SpeakerProfile = require("../models/Speaker");
const User = require("../models/User");
require("dotenv").config({ path: "../.env" });

// Route to fetch all speakers
publicRouter.get("/speakers", async (req, res) => {
  try {
    const speakers = await SpeakerProfile.findAll({
      include: [
        {
          model: User, // Join with the User table
          attributes: ["firstName", "lastName", "email"], // Include only relevant user details
        },
      ],
    });

    res
      .status(200)
      .json({ message: "Speakers fetched successfully", speakers });
  } catch (error) {
    console.error("Error fetching speakers:", error);
    res.status(500).json({ message: "Failed to fetch speakers." });
  }
});

module.exports = publicRouter;
