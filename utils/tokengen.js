require("dotenv").config({ path: "../.env" });
const { google } = require("googleapis");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

oauth2Client
  .refreshAccessToken()
  .then(({ credentials }) => {
    console.log("Token Refresh Successful");
    console.log("New Access Token:", credentials.access_token);
  })
  .catch((error) => {
    console.error("Token Refresh Failed", error);
  });
