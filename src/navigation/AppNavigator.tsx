import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, View, StyleSheet } from 'react-native';
import { ScanScreen } from '../screens/ScanScreen';
import { AnalysisScreen } from '../screens/AnalysisScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const Logo = () => (
  <View style={styles.logoContainer}>
    <Image
      source={require('../assets/beesafelogo.jpeg')}
      style={styles.logo}
    />
  </View>
);

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
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});