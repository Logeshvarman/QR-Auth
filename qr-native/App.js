import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, TextInput } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

const HomeScreen = ({ navigation, ws }) => {
  const handleLogout = () => {
    // Close WebSocket connection on logout
    ws.close();
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <Text>Welcome!</Text>
      <Button
        title="Logout"
        onPress={handleLogout}
      />
    </View>
  );
};

const LoginScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [loginToken, setLoginToken] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();

    // Establish WebSocket connection when component mounts
    const ws = new WebSocket('ws://192.168.1.3:8080');

    ws.onopen = () => {
      console.log('WebSocket connection opened');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'loginToken') {
        setLoginToken(data.token);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      // Close WebSocket connection when component unmounts
      ws.close();
    };
  }, []);

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    setShowScanner(false);
    setLoginToken(data);
    console.log(`Bar code with type ${type} and data ${data} has been scanned!`);
  };

  const handleLoginPress = () => {
    // Add your login logic here
    // After successful login, navigate to the Home screen
    navigation.navigate('Home');
  };

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }

  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      {showScanner && (
        <View style={styles.qrContainer}>
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
      )}

      {!showScanner && loginToken && (
        <Text style={styles.qrText}>{loginToken}</Text>
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button title="Scan QR Code" onPress={() => setShowScanner(true)} />
      <Button title="Login" onPress={handleLoginPress} />
    </View>
  );
};

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login">
          {(props) => <LoginScreen {...props} />}
        </Stack.Screen>
        <Stack.Screen name="Home">
          {(props) => <HomeScreen {...props} ws={new WebSocket('ws://192.168.1.3:8080')} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  qrContainer: {
    height: 300,
    width: 300,
    marginBottom: 20,
  },
  qrText: {
    fontSize: 16,
    marginBottom: 20,
  },
  input: {
    height: 40,
    width: 200,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
});

export default App;
