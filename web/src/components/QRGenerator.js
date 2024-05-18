import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import useWebSocket from 'react-use-websocket';
import shortUUID from 'short-uuid';

const QRGenerator = () => {
  const [qrCodes, setQrCodes] = useState([]);
  const { sendMessage, lastMessage } = useWebSocket('ws://192.168.1.2:8080');

  const generateQRCodes = () => {
    const shortId = shortUUID.uuid();
    sendMessage(JSON.stringify({ type: 'generate_qr', userId: shortId }));
  };

  useEffect(() => {
    if (lastMessage !== null) {
      try {
        const response = JSON.parse(lastMessage.data);
        if (response.type === 'qr_code') {
          const qrData = response.url;
          console.log('QR Data Length:', qrData.length);
          console.log('QR Data:', qrData);

          
          const chunkSize = 1000; // Adjust this value based on your needs
          const chunks = [];
          for (let i = 0; i < qrData.length; i += chunkSize) {
            chunks.push(qrData.slice(i, i + chunkSize));
          }
          const qrCodes = chunks.map((chunk, index) => (
            <div key={index} style={styles.qrCodeContainer}>
              <QRCode
                value={chunk}
                size={256}
                level="H"
                includeMargin={true}
                version={40}
              />
            </div>
          ));
          setQrCodes(qrCodes);
        }
      } catch (error) {
        console.error('Error processing QR code data:', error);
        alert('Error generating QR code. Please try again.');
      }
    }
  }, [lastMessage]);

  return (
    <div style={styles.container}>
      <button onClick={generateQRCodes} style={styles.button}>
        Generate QR Codes
      </button>
      {qrCodes}
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
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    margin: '20px',
    cursor: 'pointer',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
  },
  qrCodeContainer: {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
};

export default QRGenerator;