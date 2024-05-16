const express = require('express');
const app = express();
const ws = require('ws');
const MongoClient = require('mongodb').MongoClient;

// MongoDB connection URL
const mongoUrl = 'mongodb://localhost:27017';

// MongoDB client
let db;

// WebSocket server
const wss = new ws.Server({ port: 8080 });

// Connect to MongoDB
MongoClient.connect(mongoUrl, function(err, client) {
  if (err) throw err;

  db = client.db('mydb');
  console.log("Connected to MongoDB");
});

// WebSocket connection handler
wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    handleMessage(ws, message);
  });
});

// Message handler
async function handleMessage(ws, message) {
  const data = JSON.parse(message);

  switch (data.type) {
    case 'login':
      await handleLogin(ws, data.token, data.email, data.password);
      break;
    case 'checkLoginStatus':
      await checkLoginStatus(ws, data.token);
      break;
    case 'sendUserId':
      await sendAuthToken(ws, data.userId);
      break;
    // Handle other message types
  }
}

// Handle login
async function handleLogin(ws, token, email, password) {
  // Verify the login token, email, and password (e.g., check against database)
  const user = await db.collection('users').findOne({ token, email, password });

  if (user) {
    const loginStatus = 'success';
    ws.send(JSON.stringify({ type: 'loginStatus', status: loginStatus }));
  } else {
    const loginStatus = 'failed';
    ws.send(JSON.stringify({ type: 'loginStatus', status: loginStatus }));
  }
}

// Check login status
async function checkLoginStatus(ws, token) {
  // Verify the login token (e.g., check against database)
  const user = await db.collection('users').findOne({ token });

  if (user) {
    const loginStatus = 'success';
    ws.send(JSON.stringify({ type: 'loginStatus', status: loginStatus }));
  } else {
    const loginStatus = 'failed';
    ws.send(JSON.stringify({ type: 'loginStatus', status: loginStatus }));
  }
}

// Send authentication token
async function sendAuthToken(ws, userId) {
  // Generate an authentication token
  const authToken = generateAuthToken(userId);

  // Save the authentication token to the database
  await db.collection('users').updateOne({ userId }, { $set: { authToken } });

  ws.send(JSON.stringify({ type: 'authToken', token: authToken }));
}

// Generate authentication token (simplified example)
function generateAuthToken(userId) {
  return `${userId}_${Date.now()}`;
}

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});