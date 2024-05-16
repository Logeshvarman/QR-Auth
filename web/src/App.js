import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import './App.css';

function App() {
  const [loginToken, setLoginToken] = useState(null);
  const [userId, setUserId] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [loginStatus, setLoginStatus] = useState('');

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:4000');

    ws.onopen = () => {
      console.log('WebSocket connection opened');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'loginToken':
          setLoginToken(data.token);
          break;
        case 'loginStatus':
          setLoginStatus(data.status);
          break;
        case 'authToken':
          setAuthToken(data.token);
          break;
        // Handle other message types
      }
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleLogin = () => {
    const ws = new WebSocket('ws://localhost:4000');
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'login', token: loginToken }));
    };
  };

  const handleCheckLoginStatus = () => {
    const ws = new WebSocket('ws://localhost:4000');
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'checkLoginStatus', token: loginToken }));
    };
  };

  const handleSendUserId = () => {
    const ws = new WebSocket('ws://localhost:4000');
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'sendUserId', userId }));
    };
  };

  return (
    <div>
      <h1>Login</h1>
      {loginToken && <QRCode className="QR-code" value={loginToken} />}
      <button onClick={handleLogin}>Login</button>
      <button onClick={handleCheckLoginStatus}>Check Login Status</button>
      <input
        type="text"
        placeholder="Enter User ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      />
      <button onClick={handleSendUserId}>Send User ID</button>
      <p>Login Status: {loginStatus}</p>
      <p>Authentication Token: {authToken}</p>
    </div>
  );
}

export default App;
