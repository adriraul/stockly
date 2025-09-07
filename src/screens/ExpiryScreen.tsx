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
import { businessLogicService } from '../services/businessLogic';
import { InventoryItem } from '../types';

const ExpiryScreen: React.FC = () => {
  const [expiringItems, setExpiringItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadExpiringItems();
    }, [])
  );

  const loadExpiringItems = async () => {
    try {
      const items = await businessLogicService.getExpiringSoonItems();
      setExpiringItems(items);
    } catch (error) {
      console.error('Error loading expiring items:', error);
      Alert.alert('Error', 'No se pudo cargar los productos próximos a caducar');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExpiringItems();
    setRefreshing(false);
  };

  const handleConsume = async (item: InventoryItem) => {
    Alert.alert(
      'Consumir Producto',
      `¿Quieres consumir 1 ${item.unit} de ${item.productName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Consumir',
          onPress: async () => {
            try {
              await businessLogicService.consumeProduct(item.productId, 1);
              Alert.alert('Éxito', 'Producto consumido');
              loadExpiringItems();
            } catch (error) {
              console.error('Error consuming product:', error);
              Alert.alert('Error', error.message || 'No se pudo consumir el producto');
            }
          },
        },
      ]
    );
  };

  const handleDiscard = async (item: InventoryItem) => {
    Alert.alert(
      'Descartar Producto',
      `¿Estás seguro de que quieres descartar ${item.quantity} ${item.unit} de ${item.productName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Descartar',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implementar descarte de producto
              Alert.alert('Próximamente', 'Función de descarte en desarrollo');
            } catch (error) {
              console.error('Error discarding product:', error);
              Alert.alert('Error', 'No se pudo descartar el producto');
            }
          },
        },
      ]
    );
  };

  const getExpiryStatus = (expiryDate: string) => {
    const daysUntilExpiry = businessLogicService.getDaysUntilExpiry(expiryDate);
    
    if (daysUntilExpiry < 0) {
      return { text: 'Caducado', variant: 'danger' as const, color: '#dc2626' };
    } else if (daysUntilExpiry === 0) {
      return { text: 'Caduca hoy', variant: 'danger' as const, color: '#dc2626' };
    } else if (daysUntilExpiry === 1) {
      return { text: 'Caduca mañana', variant: 'warning' as const, color: '#d97706' };
    } else if (daysUntilExpiry <= 3) {
      return { text: `${daysUntilExpiry} días`, variant: 'warning' as const, color: '#d97706' };
    } else {
      return { text: `${daysUntilExpiry} días`, variant: 'info' as const, color: '#2563eb' };
    }
  };

  const groupByExpiryStatus = (items: InventoryItem[]) => {
    const expired: InventoryItem[] = [];
    const today: InventoryItem[] = [];
    const tomorrow: InventoryItem[] = [];
    const thisWeek: InventoryItem[] = [];
    const nextWeek: InventoryItem[] = [];

    items.forEach(item => {
      const daysUntilExpiry = businessLogicService.getDaysUntilExpiry(item.expiryDate);
      
      if (daysUntilExpiry < 0) {
        expired.push(item);
      } else if (daysUntilExpiry === 0) {
        today.push(item);
      } else if (daysUntilExpiry === 1) {
        tomorrow.push(item);
      } else if (daysUntilExpiry <= 7) {
        thisWeek.push(item);
      } else {
        nextWeek.push(item);
      }
    });

    return { expired, today, tomorrow, thisWeek, nextWeek };
  };

  const renderExpiryItem = ({ item }: { item: InventoryItem }) => {
    const expiryStatus = getExpiryStatus(item.expiryDate);
    
    return (
      <Card style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>{item.productName}</Text>
          <Badge text={expiryStatus.text} variant={expiryStatus.variant} />
        </View>
        <View style={styles.itemDetails}>
          <Text style={styles.itemQuantity}>
            {item.quantity} {item.unit}
          </Text>
          <Text style={styles.itemLocation}>📍 {item.location}</Text>
        </View>
        <Text style={styles.itemExpiry}>
          Caduca: {new Date(item.expiryDate).toLocaleDateString()}
        </Text>
        {item.notes && (
          <Text style={styles.itemNotes}>📝 {item.notes}</Text>
        )}
        <View style={styles.itemActions}>
          <Button
            title="Consumir"
            onPress={() => handleConsume(item)}
            variant="secondary"
            size="small"
            style={styles.actionButton}
          />
          <Button
            title="Descartar"
            onPress={() => handleDiscard(item)}
            variant="danger"
            size="small"
            style={styles.actionButton}
          />
        </View>
      </Card>
    );
  };

  const renderExpirySection = (title: string, items: InventoryItem[], color: string) => {
    if (items.length === 0) return null;

    return (
      <View key={title} style={styles.section}>
        <Text style={[styles.sectionTitle, { color }]}>
          {title} ({items.length})
        </Text>
        {items.map((item) => (
          <View key={item.id}>
            {renderExpiryItem({ item })}
          </View>
        ))}
      </View>
    );
  };

  const renderEmptyState = () => (
    <Card style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>✅ Todo al Día</Text>
      <Text style={styles.emptyText}>
        ¡Excelente! No tienes productos próximos a caducar.
        Tu inventario está bien gestionado.
      </Text>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando productos próximos a caducar...</Text>
      </View>
    );
  }

  const { expired, today, tomorrow, thisWeek, nextWeek } = groupByExpiryStatus(expiringItems);

  return (
    <View style={styles.container}>
      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={() => (
          <>
            {renderExpirySection('🚨 Caducados', expired, '#dc2626')}
            {renderExpirySection('⚠️ Caducan Hoy', today, '#dc2626')}
            {renderExpirySection('⏰ Caducan Mañana', tomorrow, '#d97706')}
            {renderExpirySection('📅 Esta Semana', thisWeek, '#d97706')}
            {renderExpirySection('📆 Próxima Semana', nextWeek, '#2563eb')}
          </>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContainer}
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
  listContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingLeft: 8,
  },
  itemCard: {
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
  },
  itemLocation: {
    fontSize: 12,
    color: '#64748b',
  },
  itemExpiry: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  itemNotes: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default ExpiryScreen;
