const express = require("express");
const axios = require("axios");

const router = express.Router();

router.post("/subscribe", async (req, res) => {
  try {
    const { email, name } = req.body;

    // POST to Listmonk API
    const response = await axios.post(
      "http://localhost:9000/api/subscribers",
      {
        email,
        name,
        status: "enabled",
        lists: [5]
      },
      {
        auth: {
          username: process.env.LISTMONK_USER,
          password: process.env.LISTMONK_PASS,
        },
      }
    );

    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error("Subscribe error:", error.response?.data || error.message);

    res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message,
    });
  }
});

module.exports = router;
