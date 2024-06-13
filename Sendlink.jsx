const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

// Replace with your MongoDB connection string
const mongoUri = "mongodb://localhost:27017/local";

///////////// Connecting to database //////////////

mongoose
  .connect(mongoUri)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

///////////// Schema //////////////

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  signupLink: {
    type: String, // Optional if using JWT expiration (commented out)
  },
  signupLinkToken: {
    type: String, // For database flag-based expiration
  },
  clicked: {
    type: Boolean,
    default: false,
  },
});

const User = mongoose.model("User", userSchema);

const sendEmail = async (email, link) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", // Replace with your email service if needed
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Consider using environment variables
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Muntazim Signup Link",
      // html: `<a href="${link}">Click here to sign up for Muntazim</a> (This link expires in 1 hour)`,
      text: link,
    };
    await transporter.sendMail(mailOptions);
    console.log("Email sent:", email);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post("/signup", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).send("Missing email address");
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("Email already exists");
    }
    const crypto = require("js-crypto-random");
    const uniqueToken = crypto.getRandomBytes(16).toString("hex");
    const link = `http://your-website.com/signup?token=${uniqueToken}`;

    await sendEmail(email, link);

    const user = new User({
      email,
      signupLinkToken: uniqueToken,
      clicked: false,
    });
    await user.save();

    res.send("Signup link sent successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});

app.listen(port, () => console.log(`Server listening on port ${port}`));
