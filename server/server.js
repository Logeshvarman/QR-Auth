const express = require('express');
const http = require('http'); // Import the http module
const app = express();
const ws = require('websocket');
const mongoose = require('mongoose');
const User = require('./model/User');

// MongoDB connection URL
const mongoUrl = 'mongodb://localhost:27017/qr';

// Connect to MongoDB
mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.error("Failed to connect to MongoDB", err));

// Create an HTTP server
const server = http.createServer(app);

// WebSocket server
const wss = new ws.server({ httpServer: server }); // Attach WebSocket server to the HTTP server

// WebSocket connection handler
wss.on('request', function(request) {
  const connection = request.accept(null, request.origin);
  
  connection.on('message', function(message) {
    handleMessage(connection, message);
  });
});

// Message handler
async function handleMessage(connection, message) {
  const data = JSON.parse(message.utf8Data);

  switch (data.type) {
    case 'login':
      await handleLogin(connection, data.token, data.email, data.password);
      break;
    case 'checkLoginStatus':
      await checkLoginStatus(connection, data.token);
      break;
    case 'sendUserId':
      await sendAuthToken(connection, data.userId);
      break;
    // Handle other message types
  }
}

// Handle login
async function handleLogin(connection, token, email, password) {
  // Verify the login token, email, and password (e.g., check against database)
  const user = await User.findOne({ token, email, password });

  if (user) {
    const loginStatus = 'success';
    connection.send(JSON.stringify({ type: 'loginStatus', status: loginStatus }));
  } else {
    const loginStatus = 'failed';
    connection.send(JSON.stringify({ type: 'loginStatus', status: loginStatus }));
  }
}

// Check login status
async function checkLoginStatus(connection, token) {
  // Verify the login token (e.g., check against database)
  const user = await User.findOne({ token });

  if (user) {
    const loginStatus = 'success';
    connection.send(JSON.stringify({ type: 'loginStatus', status: loginStatus }));
  } else {
    const loginStatus = 'failed';
    connection.send(JSON.stringify({ type: 'loginStatus', status: loginStatus }));
  }
}

// Send authentication token
async function sendAuthToken(connection, userId) {
  // Generate an authentication token
  const authToken = generateAuthToken(userId);

  // Save the authentication token to the database
  await User.updateOne({ userId }, { $set: { authToken } });

  connection.send(JSON.stringify({ type: 'authToken', token: authToken }));
}

// Generate authentication token (simplified example)
function generateAuthToken(userId) {
  return `${userId}_${Date.now()}`;
}

// Start the HTTP server
server.listen(4000, () => {
  console.log('Server started on port 4000');
});
