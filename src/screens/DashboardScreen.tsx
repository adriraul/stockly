import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { databaseService } from '../services/database/database';
import { businessLogicService } from '../services/businessLogic';
import { RootStackParamList } from '../navigation/AppNavigator';
import { DashboardStats } from '../types';

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await databaseService.init();
      await loadDashboardData();
    } catch (error) {
      console.error('Error initializing app:', error);
      Alert.alert('Error', 'No se pudo inicializar la aplicación');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const dashboardStats = await businessLogicService.getDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getStatusColor = (count: number) => {
    if (count === 0) return 'success';
    if (count <= 3) return 'warning';
    return 'danger';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando STOCKLY...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>STOCKLY</Text>
        <Text style={styles.subtitle}>Tu inventario de alimentos personal</Text>
      </View>

      {/* Stats Cards */}
      {stats && (
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalProducts}</Text>
            <Text style={styles.statLabel}>Productos</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalItems}</Text>
            <Text style={styles.statLabel}>Items en Stock</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.recentPurchases}</Text>
            <Text style={styles.statLabel}>Compras Recientes</Text>
          </Card>
        </View>
      )}

      {/* Alerts */}
      {stats && (stats.expiringSoon > 0 || stats.lowStock > 0) && (
        <Card style={styles.alertsCard}>
          <Text style={styles.sectionTitle}>Alertas</Text>
          {stats.expiringSoon > 0 && (
            <View style={styles.alertItem}>
              <Badge
                text={`${stats.expiringSoon} próximos a caducar`}
                variant={getStatusColor(stats.expiringSoon)}
              />
            </View>
          )}
          {stats.lowStock > 0 && (
            <View style={styles.alertItem}>
              <Badge
                text={`${stats.lowStock} con stock bajo`}
                variant={getStatusColor(stats.lowStock)}
              />
            </View>
          )}
        </Card>
      )}

      {/* Quick Actions */}
      <Card style={styles.actionsCard}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.buttonGrid}>
          <Button
            title="📦 Inventario"
            onPress={() => navigation.navigate('Inventory')}
            variant="primary"
            style={styles.actionButton}
          />
          <Button
            title="📋 Plantilla"
            onPress={() => navigation.navigate('Template')}
            variant="secondary"
            style={styles.actionButton}
          />
          <Button
            title="🛒 Lista Compra"
            onPress={() => navigation.navigate('Shopping')}
            variant="secondary"
            style={styles.actionButton}
          />
          <Button
            title="⏰ Caducidades"
            onPress={() => navigation.navigate('Expiry')}
            variant="secondary"
            style={styles.actionButton}
          />
          <Button
            title="📤 Exportar"
            onPress={() => navigation.navigate('Export')}
            variant="outline"
            style={styles.actionButton}
          />
          <Button
            title="⚙️ Configuración"
            onPress={() => navigation.navigate('Settings')}
            variant="outline"
            style={styles.actionButton}
          />
        </View>
      </Card>

      {/* Welcome Message */}
      {stats && stats.totalProducts === 0 && (
        <Card style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>¡Bienvenido a STOCKLY!</Text>
          <Text style={styles.welcomeText}>
            Comienza agregando productos a tu inventario o configurando tu
            plantilla ideal.
          </Text>
          <Button
            title="Agregar Primer Producto"
            onPress={() => navigation.navigate('Inventory')}
            variant="primary"
            style={styles.welcomeButton}
          />
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 18,
    color: '#64748b',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0369a1',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0369a1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  alertsCard: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  alertItem: {
    marginBottom: 8,
  },
  actionsCard: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    marginBottom: 12,
  },
  welcomeCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  welcomeButton: {
    width: '100%',
  },
});

export default DashboardScreen;
