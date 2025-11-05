const fs = require("fs");
const { google } = require("googleapis");
require("dotenv").config();

const oauth2Client = new google.auth.OAuth2(
  process.env.YT_CLIENT_ID,
  process.env.YT_CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
});

console.log("Authorize this app by visiting this URL:", authUrl);

const express = require("express");
const app = express();

app.get("/oauth2callback", async (req, res) => {
  const code = req.query.code;
  const { tokens } = await oauth2Client.getToken(code);
  console.log("Tokens:", tokens);
  fs.writeFileSync("tokens.json", JSON.stringify(tokens));
  res.send(" Authorization successful! You can close this tab.");
});

app.listen(8000, () => {
  console.log("Server running on http://localhost:8000");
  console.log("Visit this URL to authorize:", authUrl);
});
