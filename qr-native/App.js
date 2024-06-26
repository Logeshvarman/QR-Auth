import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
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
        navigation.navigate('Home', { userId: response.data.userId, username });
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
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        placeholderTextColor="#aaa"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#aaa"
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.linkText}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
};

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      const response = await axios.post('http://192.168.1.2:8080/register', { username, password });
      if (response.data.userId) {
        Alert.alert('Registration successful', 'You can now log in.');
        navigation.navigate('Login');
      } else {
        Alert.alert('Registration failed', 'Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        placeholderTextColor="#aaa"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#aaa"
      />
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
    </View>
  );
};

const HomeScreen = ({ route, navigation }) => {
  const { username, userId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {username}!</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Scan', { userId, username })}>
        <Text style={styles.buttonText}>Scan QR Code</Text>
      </TouchableOpacity>
    </View>
  );
};

const ScanScreen = ({ route }) => {
  const { userId, username } = route.params;
  const ws = useRef(null);
  const [permissionRequested, setPermissionRequested] = useState(false);

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

  const isValidQRCodeData = (data) => {
    // Check if the data meets certain criteria to be considered a valid QR code
    return typeof data === 'string' && data.length > 0; // Example: Check if data is a non-empty string
  };

  const handleBarCodeScanned = ({ type, data }) => {
    if (!permissionRequested) {
      setPermissionRequested(true); // Update state to indicate permission request has been shown
      if (isValidQRCodeData(data)) {
        console.log('QR Code scanned:', data);
        // Only send data to the server if it's a valid QR code
        ws.current.send(JSON.stringify({ type: 'qr_scan', data, userId }));
      } else {
        // Notify users if an invalid QR code is scanned
        Alert.alert('Invalid QR Code', 'Please scan a valid QR code');
      }
    }
  };

  const ProfileScreen = () => {
    // Profile screen implementation
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        {/* Add profile related content here */}
      </View>
    );
  };
  
  const LoginDataScreen = () => {
    // Login data screen implementation
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Login Data</Text>
        {/* Add login data related content here */}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {username}!</Text>
      <BarCodeScanner
        style={styles.scanner}
        onBarCodeScanned={handleBarCodeScanned}
      />
    </View>
  );
};

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Scan" component={ScanScreen} options={{ headerShown: false }} />
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
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    width: '100%',
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  button: {
    width: '100%',
    padding: 15,
    marginVertical: 10,
    backgroundColor: '#007BFF',
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  scanner: {
    width: '100%',
    height: '70%',
  },
  linkText: {
    color: '#007BFF',
    marginTop: 20,
    },
    });
    
    export default App;