require('dotenv').config(); 
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");

const UserRoutes = require("./routes/Userroutes");
const Intresetroutes = require("./routes/Interestroutes");
const notification = require('./routes/Ntificationroutes');
const MatchRoute = require('./routes/MacthRoute');
const AdminRoute = require('./routes/Adminroutes');
const Galleryroutes = require('./routes/Galleryroutes');
const paymentRoutes = require('./routes/PaymentRoutes');
const app = express();
const port = process.env.PORT;
const SECRET_KEY = process.env.SECRET_KEY;
const dbUrl = process.env.DB_URL;

if (!dbUrl || !SECRET_KEY) {
  console.error("Missing critical environment variables!");
  process.exit(1);
}

// Middleware
const allowedOrigins = [
  "http://localhost:3000",
  "https://halalmatchmakings.com",
  "https://www.halalmatchmakings.com",
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn("Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

app.options('*', cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn("Blocked OPTIONS by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));


app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(dbUrl)
  .then(() => console.log("Database connection established"))
  .catch((err) => console.log(err.message));

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to Halal Match Making API");
});
app.use(AdminRoute);
app.use(UserRoutes);
app.use(Intresetroutes);
app.use(notification);
app.use(MatchRoute);
app.use(Galleryroutes);
app.use(paymentRoutes);



// Start server
app.listen(port, () => {
  console.log(`Server started on port: ${port}`);
});
