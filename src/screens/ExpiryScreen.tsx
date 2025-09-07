import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { databaseService } from '../services/database/database';
import { productsRepository } from '../services/repositories/products';
import { settingsRepository } from '../services/repositories/settings';
import { formatDateToDDMMYYYY } from '../utils/dateUtils';
import { businessLogicService } from '../services/businessLogic';
import { Product } from '../types';

const ExpiryScreenSimplified: React.FC = () => {
  const [expiringItems, setExpiringItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expiryAlertDays, setExpiryAlertDays] = useState(7);

  useFocusEffect(
    useCallback(() => {
      loadExpiringItems();
    }, []),
  );

  const loadExpiringItems = async () => {
    try {
      setLoading(true);
      await databaseService.init();

      const [allProducts, expiryAlertDays] = await Promise.all([
        productsRepository.getAll(),
        settingsRepository.get('expiryAlertDays'),
      ]);

      // Obtener días de anticipación configurados (por defecto 7)
      const alertDays = expiryAlertDays ? parseInt(expiryAlertDays, 10) : 7;
      console.log('Expiry - Días de anticipación configurados:', alertDays);
      setExpiryAlertDays(alertDays);

      // Filtrar productos que caducan en los próximos X días (configurable)
      const expiring = allProducts.filter(product => {
        if (!product.expiryDate) return false;
        const daysUntilExpiry = businessLogicService.getDaysUntilExpiry(
          product.expiryDate,
        );
        return daysUntilExpiry >= 0 && daysUntilExpiry <= alertDays;
      });

      // Ordenar por días hasta caducidad
      expiring.sort((a, b) => {
        if (!a.expiryDate || !b.expiryDate) return 0;
        const daysA = businessLogicService.getDaysUntilExpiry(a.expiryDate);
        const daysB = businessLogicService.getDaysUntilExpiry(b.expiryDate);
        return daysA - daysB;
      });

      setExpiringItems(expiring);
    } catch (error) {
      console.error('Error loading expiring items:', error);
      Alert.alert(
        'Error',
        'No se pudieron cargar los productos próximos a caducar',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadExpiringItems();
    setRefreshing(false);
  };

  const getExpiryStatus = (expiryDate: string) => {
    const daysUntilExpiry = businessLogicService.getDaysUntilExpiry(expiryDate);
    if (daysUntilExpiry < 0)
      return { text: 'Caducado', variant: 'danger' as const };
    if (daysUntilExpiry === 0)
      return { text: 'Hoy', variant: 'danger' as const };
    if (daysUntilExpiry <= 3)
      return { text: `${daysUntilExpiry}d`, variant: 'warning' as const };
    return { text: `${daysUntilExpiry}d`, variant: 'info' as const };
  };

  const renderExpiringItem = ({ item }: { item: Product }) => {
    const expiryStatus = getExpiryStatus(item.expiryDate!);

    return (
      <Card style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Badge text={expiryStatus.text} variant={expiryStatus.variant} />
        </View>
        <View style={styles.itemDetails}>
          <Text style={styles.itemCategory}>📂 {item.category}</Text>
          <Text style={styles.itemStock}>
            Stock: {item.currentStock} unidades
          </Text>
          {item.description && (
            <Text style={styles.itemDescription}>{item.description}</Text>
          )}
        </View>
        <View style={styles.itemFooter}>
          <Text style={styles.itemExpiry}>
            Caduca: {formatDateToDDMMYYYY(item.expiryDate!)}
          </Text>
        </View>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <Card style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>¡Excelente!</Text>
      <Text style={styles.emptyDescription}>
        No tienes productos próximos a caducar en los próximos {expiryAlertDays}{' '}
        días
      </Text>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Próximos a Caducar</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando productos...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Próximos a Caducar</Text>
        <Text style={styles.subtitle}>
          {expiringItems.length} productos caducan en los próximos{' '}
          {expiryAlertDays} días
        </Text>
      </View>

      <FlatList
        data={expiringItems}
        renderItem={renderExpiringItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
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
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  itemCard: {
    marginBottom: 12,
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  itemDetails: {
    marginBottom: 12,
  },
  itemCategory: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  itemStock: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0369a1',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
  },
  itemFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
  },
  itemExpiry: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    marginTop: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default ExpiryScreenSimplified;
