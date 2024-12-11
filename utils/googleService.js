const { google } = require("googleapis");
const nodemailer = require("nodemailer");
require("dotenv").config({ path: "../.env" });

class GoogleService {
  constructor() {
    // Validate environment variables
    this.validateCredentials();

    // Initialize OAuth2 client
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );

    // Set credentials with refresh token
    this.oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      access_token:
        "ya29.a0AeDClZDTvRat6yk082Y1dqDgVZ7E_c6-Ok8mdqPwZoN-Zr1NN8h4t_AfZFJdzar_jTxAqv6qW1e0QjR7yfUbVV8TJewu6w1koFCgURupUMWToF8z_VVhulSySmDbh9voKoFumDLeFA83zkjExF4eJycG4Nshz87a5UI-wujNaCgYKAUASARMSFQHGX2MifUA5r6vMFwmHXCWdlnSGuA0175",
    });
  }

  // Add credential validation
  validateCredentials() {
    const requiredEnvVars = [
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "GOOGLE_REFRESH_TOKEN",
      "EMAIL_USER",
    ];

    requiredEnvVars.forEach((varName) => {
      if (!process.env[varName]) {
        throw new Error(`Missing required environment variable: ${varName}`);
      }
    });
  }

  async refreshAccessToken() {
    try {
      console.log("Attempting to refresh access token...");
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      console.log("Access token refreshed successfully");
      return credentials;
    } catch (error) {
      console.error("Access Token Refresh Error:", error);
      console.error("Detailed Error:", {
        message: error.message,
        code: error.code,
        response: error.response ? error.response.data : "No response data",
      });
      throw new Error(`Token Refresh Failed: ${error.message}`);
    }
  }

  async createCalendarEvent(bookingDetails) {
    try {
      // Explicitly refresh access token
      const credentials = await this.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);

      // Create Google Calendar service
      const calendar = google.calendar({
        version: "v3",
        auth: this.oauth2Client,
      });

      // Precise time handling
      const startDateTime = new Date(
        `${bookingDetails.date}T${bookingDetails.startTime}:00+05:30`
      );
      const endDateTime = new Date(
        `${bookingDetails.date}T${bookingDetails.endTime}:00+05:30`
      );

      const event = {
        summary: `Speaking Session`,
        description: `Booked Speaking Session`,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: "Asia/Kolkata",
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: "Asia/Kolkata",
        },
        attendees: [
          { email: bookingDetails.userEmail },
          { email: bookingDetails.speakerEmail },
        ],
      };

      // Insert event into calendar
      const response = await calendar.events.insert({
        calendarId: "primary",
        resource: event,
      });

      return response.data.htmlLink;
    } catch (error) {
      console.error("Comprehensive Google Calendar Error:", {
        message: error.message,
        stack: error.stack,
        code: error.code,
        response: error.response ? error.response.data : "No response data",
      });
      throw new Error(`Calendar Event Creation Failed: ${error.message}`);
    }
  }
}

module.exports = GoogleService;
