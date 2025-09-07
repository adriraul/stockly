import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { databaseService } from '../services/database/database';
import { productsRepository } from '../services/repositories/products';
import { templateRepository } from '../services/repositories/template';
import { settingsRepository } from '../services/repositories/settings';
import { businessLogicService } from '../services/businessLogic';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Product } from '../types';

type DashboardScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Dashboard'
>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

interface DashboardStats {
  expiringSoon: number;
  lowStock: number;
}

export default function DashboardScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    expiringSoon: 0,
    lowStock: 0,
  });
  const [expiryAlertDays, setExpiryAlertDays] = useState(7);

  useEffect(() => {
    initializeApp();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        loadDashboardData();
      }
    }, [loading]),
  );

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
      const [products, templates, expiryAlertDays] = await Promise.all([
        productsRepository.getAll(),
        templateRepository.getAll(),
        settingsRepository.get('expiryAlertDays'),
      ]);

      // Obtener días de anticipación configurados (por defecto 7)
      const alertDays = expiryAlertDays ? parseInt(expiryAlertDays, 10) : 7;
      console.log('Dashboard - Días de anticipación configurados:', alertDays);
      setExpiryAlertDays(alertDays);

      // Productos que caducan en los próximos X días (configurable)
      const expiringSoon = products.filter(product => {
        if (!product.expiryDate) return false;
        const daysUntilExpiry = businessLogicService.getDaysUntilExpiry(
          product.expiryDate,
        );
        return daysUntilExpiry >= 0 && daysUntilExpiry <= alertDays;
      }).length;

      // Productos con stock bajo basado en plantillas
      const lowStock = products.filter(product => {
        const template = templates.find(t => t.productId === product.id);
        if (!template) return false; // Solo contar si hay plantilla definida
        return product.currentStock < template.idealQuantity;
      }).length;

      setStats({
        expiringSoon,
        lowStock,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'No se pudieron cargar las estadísticas');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleQuickAction = (screen: keyof RootStackParamList) => {
    if (screen === 'Export' || screen === 'Shopping') {
      navigation.navigate(screen);
    } else {
      navigation.navigate(screen);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando estadísticas...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Resumen de tu inventario</Text>
      </View>

      <View style={styles.content}>
        {/* Estadísticas principales */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text
              style={[
                styles.statNumber,
                stats.expiringSoon > 0 ? styles.warningText : null,
              ]}
            >
              {stats.expiringSoon}
            </Text>
            <Text style={styles.statLabel}>Caducan pronto</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text
              style={[
                styles.statNumber,
                stats.lowStock > 0 ? styles.dangerText : null,
              ]}
            >
              {stats.lowStock}
            </Text>
            <Text style={styles.statLabel}>Stock bajo</Text>
          </Card>
        </View>

        {/* Acciones rápidas */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          {/* Acciones principales */}
          <View style={styles.primaryActions}>
            <Button
              title="📦 Ver Inventario"
              onPress={() => handleQuickAction('Inventory')}
              variant="primary"
              style={styles.primaryButton}
            />
            <Button
              title="🛒 Lista de Compra"
              onPress={() => handleQuickAction('Shopping')}
              variant="primary"
              style={styles.primaryButton}
            />
          </View>

          {/* Plantillas - justo debajo de los principales */}
          <View style={styles.templateSection}>
            <Button
              title="📋 Plantillas Ideales"
              onPress={() => handleQuickAction('Template')}
              variant="outline"
              style={styles.templateButton}
            />
          </View>

          {/* Acciones secundarias */}
          <View style={styles.secondaryActions}>
            <Button
              title="📊 Exportar"
              onPress={() => handleQuickAction('Export')}
              variant="outline"
              style={styles.secondaryButton}
            />
            <Button
              title="⏰ Caducados"
              onPress={() => handleQuickAction('Expiry')}
              variant="outline"
              style={styles.secondaryButton}
            />
            <Button
              title="⚙️"
              onPress={() => handleQuickAction('Settings')}
              variant="outline"
              style={styles.settingsButton}
            />
          </View>
        </Card>

        {/* Alertas */}
        {(stats.expiringSoon > 0 || stats.lowStock > 0) && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Alertas</Text>
            <View style={styles.alertsContainer}>
              {stats.expiringSoon > 0 && (
                <View style={styles.alert}>
                  <Badge
                    text={`${stats.expiringSoon} productos`}
                    variant="warning"
                  />
                  <Text style={styles.alertText}>
                    caducan en los próximos {expiryAlertDays} días
                  </Text>
                </View>
              )}
              {stats.lowStock > 0 && (
                <View style={styles.alert}>
                  <Badge
                    text={`${stats.lowStock} productos`}
                    variant="danger"
                  />
                  <Text style={styles.alertText}>tienen stock bajo</Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Estado vacío */}
        {stats.expiringSoon === 0 && stats.lowStock === 0 && (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>¡Bienvenido a Stockly!</Text>
            <Text style={styles.emptyDescription}>
              Comienza agregando tu primer producto para gestionar tu inventario
            </Text>
            <Button
              title="Agregar Primer Producto"
              onPress={() => handleQuickAction('Inventory')}
              variant="primary"
              style={styles.emptyButton}
            />
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  content: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  warningText: {
    color: '#f59e0b',
  },
  dangerText: {
    color: '#dc2626',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  primaryActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 16,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
  },
  settingsButton: {
    width: 50,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  templateSection: {
    marginBottom: 12,
  },
  templateButton: {
    paddingVertical: 10,
    opacity: 1,
  },
  alertsContainer: {
    gap: 12,
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertText: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    marginTop: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  emptyButton: {
    paddingHorizontal: 24,
  },
});
