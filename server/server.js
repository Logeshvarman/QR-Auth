const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Rate limiting for /login and /register
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
});

app.use('/login', loginLimiter);
app.use('/register', loginLimiter);

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/qr');

// Define a user schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  qrCode: String,
  isAuthenticated: Boolean,
});

const User = mongoose.model('users', userSchema);

// Register endpoint
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ username, password: hashedPassword, isAuthenticated: false });
    await user.save();
    res.json({ message: 'User registered successfully', userId: user._id });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare the provided password with the hashed password
    const isPasswordValid = bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET|| "mysecretkey", { expiresIn: '1h' });

    res.json({ message: 'Login successful', userId: user._id, token });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
});

app.get('/session', (req, res) => {
  const sessionId = new mongoose.Types.ObjectId();
  res.json({ sessionId });
});

// Generate QR code endpoint
app.post('/generate_qr', async (req, res) => {
  const { sessionId, userId } = req.body;

  try {
    if (!sessionId || !userId) {
      return res.status(400).json({ message: 'sessionId and userId are required' });
    }

    const qrCodeData = JSON.stringify({ sessionId, userId });
    const url = await QRCode.toDataURL(qrCodeData);
    console.log('Generated QR code URL:', url); // Add a console log to check the generated QR code URL
    res.json({ url });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ message: 'Error generating QR code', error });
  }
});


// Verify QR code endpoint
app.post('/verify_qr', async (req, res) => {
  const { sessionId, userId } = req.body;

  try {
    if (!sessionId || !userId) {
      return res.status(400).json({ message: 'sessionId and userId are required' });
    }
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isAuthenticated) {
      return res.status(401).json({ message: 'User is not authenticated' });
    }

    console.log('User authenticated:', user.username);
    res.json({ message: 'QR code verified successfully', user });
  } catch (error) {
    console.error('Error verifying QR code:', error);
    res.status(500).json({ message: 'Error verifying QR code', error });
  }
});

// WebSocket connection
wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');

  // Implement WebSocket message handling
  ws.on('message', async (message) => {
    const data = JSON.parse(message);

    if (data.type === 'auth') {
      try {
        const { token } = data;
        console.log('Received JWT token:', token); // Log the JWT token

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { userId } = decoded;
        console.log('User ID:', userId); // Log the user ID

        const user = await User.findById(userId);

        if (!user || !user.isAuthenticated) {
          ws.send(JSON.stringify({ type: 'error', message: 'Authentication failed' }));
          return;
        }

        ws.send(JSON.stringify({ type: 'auth_success', userId: user._id }));
      } catch (error) {
        ws.send(JSON.stringify({ type: 'error', message: 'Error during authentication' }));
      }
    } else if (data.type === 'qr_scan') {
      console.log('QR code scanned:', data); // Log the scanned QR code data
      // Acknowledge the receipt of the QR code data
      ws.send(JSON.stringify({ type: 'qr_scan_ack' }));

      // Broadcast the QR code data to all connected web app clients
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'qr_code_data', data: data }));
        }
      });
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

server.listen(process.env.PORT || 8080, () => {
  console.log('Server is listening on port', process.env.PORT || 8080);
});
