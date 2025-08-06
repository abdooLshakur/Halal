require('dotenv').config(); 
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");

// Import routes
const UserRoutes = require("./routes/Userroutes");
const Intresetroutes = require("./routes/Interestroutes");
const notification = require('./routes/Ntificationroutes');
const MatchRoute = require('./routes/MacthRoute');
const AdminRoute = require('./routes/Adminroutes');
const Galleryroutes = require('./routes/Galleryroutes');
const paymentRoutes = require('./routes/PaymentRoutes');

// App setup
const app = express();
const server = http.createServer(app); // Use HTTP server for Socket.IO
const port = process.env.PORT || 5000;
const SECRET_KEY = process.env.SECRET_KEY;
const dbUrl = process.env.DB_URL;

// Check env vars
if (!dbUrl || !SECRET_KEY) {
  console.error("Missing critical environment variables!");
  process.exit(1);
}

// Allowlisted domains for CORS
const allowedOrigins = [
  "http://localhost:3000",
  "https://halalmatchmakings.com",
  "https://www.halalmatchmakings.com",
];

// CORS
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn("Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(dbUrl)
  .then(() => console.log("Database connection established"))
  .catch((err) => console.log(err.message));

// Basic route
app.get("/", (req, res) => {
  res.send("Welcome to Halal Match Making API");
});

// Routes
app.use(AdminRoute);
app.use(UserRoutes);
app.use(Intresetroutes);
app.use(notification);
app.use(MatchRoute);
app.use(Galleryroutes);
app.use(paymentRoutes);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.IO connection handler
io.on("connection", (socket) => {
  // console.log(`🔌 Client connected: ${socket.id}`);

  socket.on("sendNotification", (data) => {
    io.emit("newNotification", data); // Broadcast to all clients
  });

  socket.on("disconnect", () => {
    // console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Start the server (HTTP + Socket.IO)
server.listen(port, () => {
  console.log(`🚀 Server started on port: ${port}`);
});
