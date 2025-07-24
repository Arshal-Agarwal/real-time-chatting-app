// db/connectDB.js
const mongoose = require('mongoose');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();  // Load environment variables from .env

// MongoDB connection function
const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/Chat_app', {
      connectTimeoutMS: 30000, // 30 seconds
      serverSelectionTimeoutMS: 30000, // 30 seconds
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
  }
};

// MySQL connection pool
const mysqlPool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',   // Put your password here or in .env
  database: process.env.MYSQL_DATABASE || 'your_mysql_database',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

console.log('✅ MySQL pool created');

module.exports = {
  connectMongoDB,
  mysqlPool,
};
