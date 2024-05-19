import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode.react';
import axios from 'axios';

const QRGenerator = () => {
  const [message, setMessage] = useState('');
  const [qrCode, setQrCode] = useState(null);
  const [userData, setUserData] = useState(null); // State to store user data
  const [userId, setUserId] = useState(null); // State to store user ID
  const ws = useRef(null);

  useEffect(() => {
    const fetchSessionId = async () => {
      try {
        const response = await axios.get('http://localhost:8080/session');
        setQrCode(response.data.sessionId); // Set the session ID to the qrCode state
      } catch (error) {
        setMessage('Error fetching session ID');
      }
    };

    fetchSessionId();
  }, []);

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:8080');

    ws.current.onopen = () => {
      console.log('WebSocket connection opened');
    };

    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'auth_success') {
        setMessage('User authenticated successfully!');
        setUserId(data.userId); // Set the user ID
        // Fetch user data after authentication success
        fetchUserData(qrCode);
      } else if (data.type === 'qr_code_data') {
        console.log('Received QR code data:', data.data); // Handle the received QR code data
        setMessage('QR code scanned successfully!');
        fetchUserData(data.data.sessionId); // Fetch user data based on the QR code data
      } else if (data.type === 'error') {
        setMessage(data.message);
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.current.close();
    };
  }, []);

  const fetchUserData = async (sessionId) => {
    try {
      const response = await axios.get('http://localhost:8080/verify_qr', { sessionId });
      const userDataResponse = response.data.user; // Access user data from the response
      setUserData(userDataResponse); // Set user data to state
      setMessage('QR code verified successfully'); // Update message
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setMessage('User not found');
      } else if (error.response && error.response.status === 401) {
        setMessage('User is not authenticated');
      } else {
        setMessage('Error fetching user data');
        console.error('Error fetching user data:', error);
      }
    }
  };
  
  
  return (
    <div style={styles.container}>
      <h1>QR Code Authentication</h1>
      {qrCode ? <QRCode value={qrCode} size={256} /> : <p>Loading...</p>}
      {message && <p>{message}</p>}
      {userData && (
        <div>
          <h2>User Data:</h2>
          <p>Username: {userData.username}</p>
          {/* Display other user data here */}
        </div>
      )}
      {userId && <p>User ID: {userId}</p>}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#f0f0f0',
    fontFamily: 'Arial, sans-serif',
  },
};

export default QRGenerator;
