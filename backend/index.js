require("dotenv").config({ path: "./.env" });

const express = require("express");
const cors = require("cors");
const connectToMongo = require("./db");
const cookieParser = require("cookie-parser");

const app = express();

// ------------------ Middleware ------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ------------------ CORS ------------------
const WHITELIST = [
  "https://edu-align-five.vercel.app",
  "https://edualign.onrender.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (WHITELIST.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
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

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ------------------ Connect to MongoDB ------------------
connectToMongo(); // <-- No .then() because your db.js doesn't return Promise

// ------------------ Basic Routes ------------------
app.get("/", (req, res) => {
  res.send("Welcome to the Tutor-Time API!");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", ts: Date.now() });
});

// ------------------ Routes ------------------
const adminRoutes = require("./routes/adminRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const studentRoutes = require("./routes/studentRoutes");
const messageRoutes = require("./routes/messageRoutes");

app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/teachers", teacherRoutes);
app.use("/api/v1/student", studentRoutes);
app.use("/api/v1/messages", messageRoutes);

// ------------------ Error Handling ------------------
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Global error:", err.message || err);

  if (err.message && err.message.startsWith("CORS policy")) {
    return res.status(401).json({ success: false, message: err.message });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

// ------------------ Start Server ------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
