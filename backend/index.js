// index.js
require("dotenv").config({ path: "./.env" });

const express = require("express");
const cors = require("cors");
const connectToMongo = require("./db"); // your mongo connection module
const cookieParser = require("cookie-parser");

const app = express();

// ------- Middleware -------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ------- CORS setup -------
// Allowed origins (adjust/add exact origins as needed)
const WHITELIST = [
  "https://edu-align-tau.vercel.app",   // your frontend (Vercel)
  "https://edualign.onrender.com",      // api domain (optional)
  "http://localhost:3000",
  "http://127.0.0.1:3000"
];

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like curl, server-to-server, mobile apps)
    if (!origin) return callback(null, true);

    if (WHITELIST.includes(origin)) {
      // echo back the allowed origin so credentials work
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: Origin ${origin} not allowed`));
    }
  },
  credentials: true, // Access-Control-Allow-Credentials: true
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "X-Requested-With",
    "Origin"
  ],
  optionsSuccessStatus: 204
};

// Apply CORS for all routes
app.use(cors(corsOptions));
// Also handle preflight across the board
app.options("*", cors(corsOptions));

// ------- Connect to Mongo -------
connectToMongo()
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    // optionally exit process if DB is required at start
    // process.exit(1);
  });

// ------- Basic routes & health -------
app.get("/", (req, res) => {
  res.send("Welcome to the Tutor-Time API!");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", ts: Date.now() });
});

// ------- Mounting routes -------
const adminRoutes = require("./routes/adminRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const studentRoutes = require("./routes/studentRoutes");
const messageRoutes = require("./routes/messageRoutes");

app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/teachers", teacherRoutes);
app.use("/api/v1/student", studentRoutes);
app.use("/api/v1/messages", messageRoutes);

// ------- Error handling -------
// handle unknown routes
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// global error handler
app.use((err, req, res, next) => {
  console.error("Global error handler:", err.message || err);
  // for CORS origin rejections, give a clear response for debugging (don't leak in prod)
  if (err.message && err.message.startsWith("CORS policy")) {
    return res.status(401).json({ success: false, message: err.message });
  }

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

// ------- Start server -------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
