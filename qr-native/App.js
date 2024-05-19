import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import axios from 'axios';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

const LoginScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
      Alert.alert('Authentication successful');
    } else {
      console.error('Authentication failed:', jsonData.message);
      Alert.alert('Authentication failed', jsonData.message);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://192.168.1.2:8080/login', { username, password });
      if (response.data.userId) {
        navigation.navigate('Scan', { userId: response.data.userId });
      } else {
        Alert.alert('Login failed', 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Login failed');
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
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
};

const ScanScreen = ({ route }) => {
  const { userId } = route.params;
  const ws = useRef(null);

  useEffect(() => {
    // Initialize WebSocket connection
    ws.current = new WebSocket('ws://192.168.1.2:8080');

    ws.current.onopen = () => {
      console.log('WebSocket connection opened');
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

  const handleBarCodeScanned = ({ type, data }) => {
    console.log(`QR Code scanned: ${data}`);
    ws.current.send(JSON.stringify({ type: 'qr_scan', data, userId }));
    Alert.alert('QR Code Scanned', 'Data has been sent to the server');
  };

  return (
    <BarCodeScanner
      style={StyleSheet.absoluteFillObject}
      onBarCodeScanned={handleBarCodeScanned}
    />
  );
};

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Scan" component={ScanScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
});

export default App;
