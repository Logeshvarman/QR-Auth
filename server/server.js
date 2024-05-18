const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const QRCode = require('qrcode');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/qr', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define a user schema
const userSchema = new mongoose.Schema({
  username: String,
  qrCode: String,
  isAuthenticated: Boolean,
});
const User = mongoose.model('User', userSchema);

wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');

  ws.on('message', (message) => {
    console.log('Received message:', message);
    try {
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
        User.findById(data.userId, (err, user) => {
          if (err || !user) {
            ws.send(JSON.stringify({ type: 'error', message: 'User not found' }));
            return;
          }
          user.isAuthenticated = true;
          user.save();
          ws.send(JSON.stringify({ type: 'auth_success', userId: user._id }));
        });
      }
    } catch (error) {
      console.error('Error parsing JSON data:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON data received' }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});


server.listen(8080, () => {
  console.log('Server is listening on port 8080');
});
