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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { AddProductModal } from '../components/AddProductModal';
import { inventoryRepository } from '../services/repositories/inventory';
import { productsRepository } from '../services/repositories/products';
import { businessLogicService } from '../services/businessLogic';
import { RootStackParamList } from '../navigation/AppNavigator';
import { InventoryItem } from '../types';

type InventoryScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Inventory'
>;

const InventoryScreen: React.FC = () => {
  const navigation = useNavigation<InventoryScreenNavigationProp>();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadInventory();
    }, []),
  );

  const loadInventory = async () => {
    try {
      const items = await inventoryRepository.getAll();
      setInventoryItems(items);
    } catch (error) {
      console.error('Error loading inventory:', error);
      Alert.alert('Error', 'No se pudo cargar el inventario');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInventory();
    setRefreshing(false);
  };

  const handleAddProduct = () => {
    setShowAddModal(true);
  };

  const handleProductAdded = () => {
    loadInventory();
  };

  const handleItemPress = (item: InventoryItem) => {
    navigation.navigate('ProductDetail', { productId: item.productId });
  };

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) {
      return { text: 'Sin fecha', variant: 'default' as const };
    }
    const daysUntilExpiry = businessLogicService.getDaysUntilExpiry(expiryDate);
    if (daysUntilExpiry < 0)
      return { text: 'Caducado', variant: 'danger' as const };
    if (daysUntilExpiry <= 3)
      return { text: `${daysUntilExpiry}d`, variant: 'warning' as const };
    if (daysUntilExpiry <= 7)
      return { text: `${daysUntilExpiry}d`, variant: 'info' as const };
    return { text: `${daysUntilExpiry}d`, variant: 'success' as const };
  };

  const renderInventoryItem = ({ item }: { item: InventoryItem }) => {
    const expiryStatus = getExpiryStatus(item.expiryDate);

    return (
      <TouchableOpacity onPress={() => handleItemPress(item)}>
        <Card style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemName}>{item.productName}</Text>
            <Badge text={expiryStatus.text} variant={expiryStatus.variant} />
          </View>
          <View style={styles.itemDetails}>
            <Text style={styles.itemQuantity}>{item.quantity} unidades</Text>
            <Text style={styles.itemCategory}>📂 {item.category}</Text>
          </View>
          <View style={styles.itemFooter}>
            {item.expiryDate && (
              <Text style={styles.itemExpiry}>
                Caduca: {new Date(item.expiryDate).toLocaleDateString()}
              </Text>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <Card style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>📦 Inventario Vacío</Text>
      <Text style={styles.emptyText}>
        No tienes productos en tu inventario. Agrega algunos productos para
        comenzar.
      </Text>
      <Button
        title="Agregar Producto"
        onPress={handleAddProduct}
        variant="primary"
        style={styles.emptyButton}
      />
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando inventario...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button
          title="+ Agregar Producto"
          onPress={handleAddProduct}
          variant="primary"
          style={styles.addButton}
        />
      </View>

      <FlatList
        data={inventoryItems}
        renderItem={renderInventoryItem}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <AddProductModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onProductAdded={handleProductAdded}
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
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  addButton: {
    width: '100%',
  },
  listContainer: {
    padding: 16,
  },
  itemCard: {
    marginBottom: 12,
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
    alignItems: 'center',
    marginBottom: 8,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
  },
  itemCategory: {
    fontSize: 12,
    color: '#64748b',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemExpiry: {
    fontSize: 12,
    color: '#9ca3af',
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
    marginBottom: 20,
    lineHeight: 24,
  },
  emptyButton: {
    width: '100%',
  },
});

export default InventoryScreen;
