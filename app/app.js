var express = require("express");
var bodyParser = require("body-parser");

var app = express();
var HTTP_PORT = 8000;

// Middleware for parsing JSON and urlencoded data
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Start the server
app.listen(HTTP_PORT, () => {
    console.log(`Server running on port ${HTTP_PORT}`);
});

// Root endpoint
app.get("/", (req, res) => {
    res.json({ message: "Ok" });
});

// Import route files
var userRoutes = require("./routes/userRoutes");
var itemRoutes = require("./routes/itemRoutes");
var typeRoutes = require("./routes/typeRoutes");
var orderRoutes = require("./routes/orderRoutes");

// Use the routes
app.use("/api/users", userRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/types", typeRoutes);
app.use("/api/orders", orderRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
    res.status(404).json({ message: "Not Found" });
});

// Error handling middleware (optional)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Internal Server Error" });
});

module.exports = app;
