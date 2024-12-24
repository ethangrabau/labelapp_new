import React, { useState, useRef, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, View, StyleSheet, TouchableOpacity, Text, Animated } from 'react-native';
import { ScanScreen } from '../screens/ScanScreen';
import { AnalysisScreen } from '../screens/AnalysisScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const Logo = () => {
  const [tapCount, setTapCount] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const messageTimeout = useRef<NodeJS.Timeout>();

  const handleTap = () => {
    setTapCount(prev => {
      const newCount = prev + 1;
      if (newCount === 7) {
        // Show message
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.delay(2000),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          })
        ]).start();

        // Reset tap count after showing message
        messageTimeout.current = setTimeout(() => {
          setTapCount(0);
        }, 3000);
      }
      return newCount;
    });
  };

  useEffect(() => {
    return () => {
      if (messageTimeout.current) {
        clearTimeout(messageTimeout.current);
      }
    };
  }, []);

  return (
    <View style={styles.logoContainer}>
      <TouchableOpacity onPress={handleTap}>
        <Image
          source={require('../assets/beesafelogo.jpeg')}
          style={styles.logo}
        />
      </TouchableOpacity>
      <Animated.View 
        style={[
          styles.messageContainer,
          {
            opacity: fadeAnim,
            transform: [{
              translateX: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0]
              })
            }]
          }
        ]}
      >
        <Text style={styles.messageText}>for mel ❤️</Text>
      </Animated.View>
    </View>
  );
};

const MainStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#000',
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="BeeSafe" 
      component={ScanScreen}
      options={{
        headerLeft: () => <Logo />,
        headerTitle: '',
      }}
    />
    <Stack.Screen 
      name="Analysis" 
      component={AnalysisScreen}
      options={{
        title: 'Ingredient Analysis',
      }}
    />
  </Stack.Navigator>
);

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName = 'barcode-scan';
            if (route.name === 'History') {
              iconName = 'history';
            }
            return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#2196F3',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: '#e0e0e0',
            backgroundColor: 'white',
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          headerStyle: {
            backgroundColor: '#000',
          },
          headerTintColor: '#fff',
        })}
      >
        <Tab.Screen 
          name="Main" 
          component={MainStack}
          options={{ 
            headerShown: false,
            title: 'Scan',
          }}
        />
        <Tab.Screen 
          name="History" 
          component={HistoryScreen}
          options={{ 
            title: 'History',
            headerTitle: 'Scan History',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    marginLeft: 15,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 200,
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    borderRadius: 20,
  },
  messageContainer: {
    marginLeft: 12,
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    justifyContent: 'center',
  },
  messageText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },
});