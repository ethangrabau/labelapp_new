import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image } from 'react-native';
import { ScanScreen } from '../screens/ScanScreen';
import { AnalysisScreen } from '../screens/AnalysisScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="BeeSafe" 
      component={ScanScreen}
      options={{
        headerTitle: () => (
          <Image
            source={require('../assets/beesafelogo.jpeg')}
            style={{ width: 120, height: 40, resizeMode: 'contain' }}
          />
        ),
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

const AppNavigator = () => (
  <NavigationContainer>
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Main') {
            iconName = focused ? 'barcode-scan' : 'barcode-scan';
          } else if (route.name === 'History') {
            iconName = focused ? 'history' : 'history';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
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
        }}
      />
    </Tab.Navigator>
  </NavigationContainer>
);

export default AppNavigator;