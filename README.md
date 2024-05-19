# QR Code Authentication App

This mobile application allows users to authenticate using QR codes. It consists of a login/register screen and a QR code scanning screen.

## Features

- **Login**: Users can log in with their username and password.
- **Register**: New users can register by providing a username and password.
- **QR Code Scanning**: After logging in, users can scan QR codes to authenticate.

## Technologies Used

- **React Native**: Used for building the mobile application.
- **Expo**: Used for accessing device features such as the camera for QR code scanning.
- **Node.js**: Used for building the backend server.
- **Express.js**: Used for handling HTTP requests in the backend.
- **MongoDB**: Used as the database for storing user information.
- **WebSocket**: Used for real-time communication between the mobile app and the server.
- **bcrypt**: Used for hashing passwords before storing them in the database.
- **axios**: Used for making HTTP requests from the mobile app to the server.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Logeshvarman/QR-Auth

2. Install dependencies for native app , server and web app:

   ```bash
   npm install

3. Start 
   ```bash
   npm start

MIT License

Copyright (c) [2024] [Logesh Varman]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
