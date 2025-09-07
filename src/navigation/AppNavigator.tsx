import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import TemplateScreen from '../screens/TemplateScreen';
import ShoppingScreen from '../screens/ShoppingScreen';
import ExpiryScreen from '../screens/ExpiryScreen';
import ExportScreen from '../screens/ExportScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type RootStackParamList = {
  Dashboard: undefined;
  Inventory: undefined;
  ProductDetail: { productId: string };
  Template: undefined;
  Shopping: undefined;
  Expiry: undefined;
  Export: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor="#0369a1" />
        <Stack.Navigator
          initialRouteName="Dashboard"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#0369a1',
            },
            headerTintColor: '#ffffff',
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18,
            },
          }}
        >
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{
              title: 'STOCKLY',
              headerStyle: {
                backgroundColor: '#0369a1',
              },
            }}
          />
          <Stack.Screen
            name="Inventory"
            component={InventoryScreen}
            options={{
              title: 'Inventario',
            }}
          />
          <Stack.Screen
            name="ProductDetail"
            component={ProductDetailScreen}
            options={{
              title: 'Detalle del Producto',
            }}
          />
          <Stack.Screen
            name="Template"
            component={TemplateScreen}
            options={{
              title: 'Plantilla Ideal',
            }}
          />
          <Stack.Screen
            name="Shopping"
            component={ShoppingScreen}
            options={{
              title: 'Lista de la Compra',
            }}
          />
          <Stack.Screen
            name="Expiry"
            component={ExpiryScreen}
            options={{
              title: 'Próximos a Caducar',
            }}
          />
          <Stack.Screen
            name="Export"
            component={ExportScreen}
            options={{
              title: 'Exportar Datos',
            }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              title: 'Configuración',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default AppNavigator;
