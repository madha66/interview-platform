const { Google } = require("arctic");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });
const google = new Google(
    process.env.Google_client_id,
    process.env.Google_client_password,
    "https://interview-platform-1-s0ci.onrender.com/google/callback"
);

module.exports = { google };