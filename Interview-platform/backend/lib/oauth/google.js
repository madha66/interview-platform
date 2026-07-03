const { Google } = require("arctic");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });
const google = new Google(
    process.env.Google_client_id,
    process.env.Google_client_password,
    process.env.GOOGLE_REDIRECT_URI || "https://interview-platform-nine.vercel.app/google/callback"
);

module.exports = { google };