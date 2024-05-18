import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';

const QRScanner = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const ws = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();

    // Initialize WebSocket connection
    ws.current = new WebSocket('ws://192.168.1.2:8080');

    ws.current.onopen = () => {
      console.log('WebSocket connection opened');
    };

    ws.current.onmessage = (e) => {
      const data = e.data;
      console.log('Received data:', data);

      try {
        const jsonData = JSON.parse(data);
        handleWebSocketMessage(jsonData);
      } catch (error) {
        console.error('Error parsing JSON data:', error);
        console.log('Data that failed to parse:', data);
        Alert.alert('Error', 'Unexpected data received from the server');
      }
    };

    ws.current.onerror = (error) => {
      console.log('WebSocket error: ', error);
      Alert.alert('Error', 'WebSocket connection error');
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.current.close();
    };
  }, []);

  const handleWebSocketMessage = (jsonData) => {
    if (jsonData.type === 'auth_success') {
      console.log('Authentication successful');
      // Handle authentication success
    } else {
      console.error('Authentication failed:', jsonData.message);
      Alert.alert('Authentication failed', jsonData.message);
    }
  };

  const handleBarCodeScanned = ({ data }) => {
    setScanned(true);
    try {
      const qrData = JSON.parse(data);
      if (typeof qrData === 'object' && qrData.userId) {
        ws.current.send(JSON.stringify({ type: 'auth', userId: qrData.userId }));
      } else {
        console.error('Invalid QR code data:', qrData);
        Alert.alert('Error', 'Invalid QR code');
      }
    } catch (error) {
      console.error('Error parsing QR code data:', error);
      Alert.alert('Error', 'Invalid QR code');
    }
  };
  

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }

  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      {scanned && <Button title="Tap to Scan Again" onPress={() => setScanned(false)} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default QRScanner;
