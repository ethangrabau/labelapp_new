import { React } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ScanScreen } from './src/screens/ScanScreen';
import { AnalysisScreen } from './src/screens/AnalysisScreen';
import { DetailsScreen } from './src/screens/DetailsScreen';
import type { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Scan"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2196F3',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Scan" 
          component={ScanScreen} 
          options={{ title: 'Scan Label' }}
        />
        <Stack.Screen 
          name="Analysis" 
          component={AnalysisScreen} 
          options={{ title: 'Analysis Results' }}
        />
        <Stack.Screen 
          name="Details" 
          component={DetailsScreen} 
          options={{ title: 'Ingredient Details' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;