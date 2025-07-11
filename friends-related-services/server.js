const express = require('express');
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { connectMongoDB } = require('./db/connectDB');
const request_routes = require('./routes/requests.routes');
const manage_routes = require('./routes/manage.routes');

const app = express();
const port = 5002;

// Connect to MongoDB
connectMongoDB();

// Middleware
app.use(express.json());

// ✅ Allow cookies + credentials from frontend
app.use(cors({
  origin: 'http://localhost:3000', // Or the URL of your frontend
  credentials: true               // ✅ Allow cookies
}));

app.use(cookieParser()); // ✅ Enable cookie parsing

// Routes
app.use("/requests", request_routes);
app.use("/manage", manage_routes);

app.get('/', (req, res) => {
  res.send(`Server for friends related services running on http://localhost:${port}`);
});

// Start server
app.listen(port, () => {
  console.log(`Server for friends related services running on http://localhost:${port}`);
});
