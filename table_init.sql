CREATE DATABASE IF NOT EXISTS chat_app;

USE chat_app;

CREATE TABLE users (
  uuid CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  bio TEXT,
  profile_picture VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE chat_app.friend_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requester_uuid CHAR(36) NOT NULL,
  receiver_uuid CHAR(36) NOT NULL,
  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (requester_uuid) REFERENCES users(uuid) ON DELETE CASCADE,
  FOREIGN KEY (receiver_uuid) REFERENCES users(uuid) ON DELETE CASCADE,
  UNIQUE (requester_uuid, receiver_uuid)
);

CREATE TABLE friends (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_uuid CHAR(36) NOT NULL,
  friend_uuid CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_uuid) REFERENCES users(uuid) ON DELETE CASCADE,
  FOREIGN KEY (friend_uuid) REFERENCES users(uuid) ON DELETE CASCADE,
  UNIQUE KEY unique_friendship (user_uuid, friend_uuid)
);