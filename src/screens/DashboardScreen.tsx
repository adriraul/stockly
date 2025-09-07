import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { StatCard } from '../components/StatCard';
import { Logo } from '../components/Logo';
import { databaseService } from '../services/database/database';
import { productsRepository } from '../services/repositories/products';
import { templateRepository } from '../services/repositories/template';
import { settingsRepository } from '../services/repositories/settings';
import { businessLogicService } from '../services/businessLogic';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Product } from '../types';
import { theme } from '../constants/theme';

const { width } = Dimensions.get('window');

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
          <Logo size={80} style={styles.logo} />
          <Text style={styles.subtitle}>
            Tu asistente de inventario inteligente
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>🔄 Cargando estadísticas...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Logo size={80} style={styles.logo} />
        <Text style={styles.subtitle}>
          Tu asistente de inventario inteligente
        </Text>
      </View>

      <View style={styles.content}>
        {/* Estadísticas principales */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Caducan pronto"
            value={stats.expiringSoon}
            subtitle={`En los próximos ${expiryAlertDays} días`}
            icon="⏰"
            color={stats.expiringSoon > 0 ? 'warning' : 'success'}
            delay={0}
          />

          <StatCard
            title="Stock bajo"
            value={stats.lowStock}
            subtitle="Necesitan reposición"
            icon="📦"
            color={stats.lowStock > 0 ? 'error' : 'success'}
            delay={100}
          />
        </View>

        {/* Acciones rápidas */}
        <Card style={styles.section} variant="elevated">
          {/* Acciones principales */}
          <View style={styles.primaryActions}>
            <Button
              title="Ver Inventario"
              onPress={() => handleQuickAction('Inventory')}
              variant="primary"
              size="large"
              icon="📦"
              style={styles.primaryButton}
            />
            <Button
              title="Lista de Compra"
              onPress={() => handleQuickAction('Shopping')}
              variant="primary"
              size="large"
              icon="🛒"
              style={styles.primaryButton}
            />
          </View>

          {/* Plantillas */}
          <View style={styles.templateSection}>
            <Button
              title="Plantillas Ideales"
              onPress={() => handleQuickAction('Template')}
              variant="outline"
              size="small"
              icon="📋"
              style={styles.templateButton}
            />
          </View>

          {/* Acciones secundarias */}
          <View style={styles.secondaryActions}>
            <Button
              title="Exportar"
              onPress={() => handleQuickAction('Export')}
              variant="ghost"
              size="small"
              icon="📈"
              style={styles.secondaryButton}
            />
            <Button
              title="Caducados"
              onPress={() => handleQuickAction('Expiry')}
              variant="ghost"
              size="small"
              icon="⏱️"
              style={styles.secondaryButton}
            />
            <Button
              title=""
              onPress={() => handleQuickAction('Settings')}
              variant="ghost"
              size="small"
              icon="⚙"
              style={styles.settingsButton}
            />
          </View>
        </Card>

        {/* Alertas */}
        {(stats.expiringSoon > 0 || stats.lowStock > 0) && (
          <Card style={styles.section} variant="outlined">
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⚠️ Alertas</Text>
              <Text style={styles.sectionSubtitle}>Acción requerida</Text>
            </View>
            <View style={styles.alertsContainer}>
              {stats.expiringSoon > 0 && (
                <View style={styles.alert}>
                  <Badge
                    text={`${stats.expiringSoon} productos`}
                    variant="warning"
                    icon="⏰"
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
                    icon="📦"
                  />
                  <Text style={styles.alertText}>tienen stock bajo</Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Estado vacío */}
        {stats.expiringSoon === 0 && stats.lowStock === 0 && (
          <Card style={styles.emptyCard} variant="filled">
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyTitle}>¡Bienvenido a Stockly!</Text>
            <Text style={styles.emptyDescription}>
              Tu asistente personal para gestionar el inventario de alimentos.
              Comienza agregando tu primer producto y mantén todo organizado.
            </Text>
            <Button
              title="Agregar Primer Producto"
              onPress={() => handleQuickAction('Inventory')}
              variant="primary"
              size="medium"
              icon="➕"
              style={styles.emptyButton}
            />
          </Card>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    ...theme.shadows.sm,
  },
  logo: {
    alignSelf: 'center',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing['2xl'],
  },
  loadingText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  content: {
    padding: theme.spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  section: {
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  sectionHeader: {
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  primaryActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  primaryButton: {
    flex: 1,
    minHeight: 60,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 44,
  },
  settingsButton: {
    width: 40,
    aspectRatio: 1,
  },
  templateSection: {
    marginBottom: theme.spacing.sm,
  },
  templateButton: {
    width: '100%',
    minHeight: 48,
  },
  alertsContainer: {
    gap: theme.spacing.sm,
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    padding: theme.spacing.xs,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
  },
  alertText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    flex: 1,
    fontWeight: theme.typography.fontWeight.medium,
  },
  emptyCard: {
    alignItems: 'center',
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: theme.spacing.sm,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    lineHeight:
      theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
  },
  emptyButton: {
    paddingHorizontal: theme.spacing.lg,
  },
});
