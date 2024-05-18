const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/qr', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define a user schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  qrCode: String,
  isAuthenticated: Boolean,
});
const User = mongoose.model('User', userSchema);

// Register endpoint
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const user = new User({ username, password, isAuthenticated: false });
  await user.save();
  res.json({ message: 'User registered successfully', userId: user._id });
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  res.json({ message: 'Login successful', userId: user._id });
});

// WebSocket connection
wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');

  ws.on('message', async (message) => {
    const data = JSON.parse(message);
    if (data.type === 'generate_qr') {
      const qrCodeData = JSON.stringify({ userId: data.userId });
      QRCode.toDataURL(qrCodeData, (err, url) => {
        if (err) {
          ws.send(JSON.stringify({ type: 'error', message: 'QR code generation failed' }));
          return;
        }
        ws.send(JSON.stringify({ type: 'qr_code', url }));
      });
    } else if (data.type === 'auth') {
      const user = await User.findById(data.userId);
      if (!user) {
        ws.send(JSON.stringify({ type: 'error', message: 'User not found' }));
        return;
      }
      user.isAuthenticated = true;
      await user.save();
      ws.send(JSON.stringify({ type: 'auth_success', userId: user._id }));
    }
  });

  // Log when the WebSocket connection is closed
  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

server.listen(8080, () => {
  console.log('Server is listening on port 8080');
});
