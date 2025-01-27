require('dotenv').config(); 
const express = require("express");
const port = process.env.PORT || 9000; 
const app = express();
const mongoose = require("mongoose");
const UserRoutes = require("./routes/Userroutes");
const ProductRoutes = require("./routes/ProductRoutes");
const MerchantRoutes = require("./routes/Merchantroutes");
const CategoryRoutes = require("./routes/Categoryroutes");
const ReviewRoutes = require("./routes/ReviewRoutes");
const BannerRoutes = require("./routes/BannerRoute");
const WishlistRoutes = require("./routes/WishlistRoutes");
const cors = require("cors");
const path = require("path");
const authenticateToken = require('./middleware/Auth');

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));
app.use("/authenticateToken", authenticateToken);
const SECRET_KEY = process.env.SECRET_KEY; 

const dbUrl = process.env.DB_URL;


mongoose
  .connect(dbUrl)
  .then(() => {
    console.log("Database connection established");
  })
  .catch((err) => {
    console.log(err.message);
  });

// Add a test route
app.get("/login", (req, res) => {
  res.send("Welcome to Codexx API");
});

// Register API routes **before** serving the React app
app.use( UserRoutes);
app.use( ProductRoutes);
app.use( MerchantRoutes);
app.use( CategoryRoutes);
app.use( ReviewRoutes);
app.use( BannerRoutes);
app.use( WishlistRoutes);

// Serve React app
const buildPath = path.resolve("../Codex-Dashbord/build");
app.use(express.static(buildPath));

// Serve index.html for non-API routes
app.get("*", (req, res) => {
  res.sendFile(path.resolve(buildPath, "index.html"));
});

// Start server
app.listen(port, (err) => {
  if (err) {
    console.log("There was a problem starting the server");
  } else {
    console.log(`Server started on port: ${port}`);
  }
});
