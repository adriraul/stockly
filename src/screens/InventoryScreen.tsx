import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { AddProductModal } from '../components/AddProductModal';
import { SearchInput } from '../components/SearchInput';
import { databaseService } from '../services/database/database';
import { productsRepository } from '../services/repositories/products';
import { formatDateToDDMMYYYY } from '../utils/dateUtils';
import { businessLogicService } from '../services/businessLogic';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Product } from '../types';

type InventoryScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Inventory'
>;

interface Props {
  navigation: InventoryScreenNavigationProp;
}

export default function InventoryScreen({ navigation }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, []),
  );

  const loadProducts = async () => {
    try {
      setLoading(true);
      const allProducts = await productsRepository.getAll();
      setProducts(allProducts);
      setFilteredProducts(allProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(
      product =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase()) ||
        (product.description &&
          product.description.toLowerCase().includes(query.toLowerCase())),
    );
    setFilteredProducts(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const handleAddProduct = () => {
    setShowAddModal(true);
  };

  const handleProductAdded = () => {
    loadProducts();
    setShowAddModal(false);
    setSearchQuery('');
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  const handleAddStock = async (product: Product) => {
    try {
      const newStock = product.currentStock + 1;
      await productsRepository.updateStock(product.id, newStock);
      await loadProducts();
    } catch (error) {
      console.error('Error adding stock:', error);
      Alert.alert('Error', 'No se pudo agregar stock');
    }
  };

  const handleRemoveStock = async (product: Product) => {
    if (product.currentStock <= 0) return;

    try {
      const newStock = Math.max(0, product.currentStock - 1);
      await productsRepository.updateStock(product.id, newStock);
      await loadProducts();
    } catch (error) {
      console.error('Error removing stock:', error);
      Alert.alert('Error', 'No se pudo quitar stock');
    }
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

  const renderProductItem = ({ item }: { item: Product }) => {
    const expiryStatus = getExpiryStatus(item.expiryDate);

    return (
      <TouchableOpacity
        onPress={() => handleProductPress(item)}
        style={styles.itemContainer}
      >
        <Card style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Badge text={expiryStatus.text} variant={expiryStatus.variant} />
          </View>
          <View style={styles.itemDetails}>
            <Text style={styles.itemCategory}>📂 {item.category}</Text>
            <Text style={styles.itemDescription}>
              {item.description || 'Sin descripción'}
            </Text>
          </View>
          <View style={styles.stockControls}>
            <Button
              title="-"
              onPress={() => handleRemoveStock(item)}
              variant="outline"
              size="small"
              disabled={item.currentStock <= 0}
              style={styles.stockButton}
            />
            <Text style={styles.stockText}>{item.currentStock} unidades</Text>
            <Button
              title="+"
              onPress={() => handleAddStock(item)}
              variant="primary"
              size="small"
              style={styles.stockButton}
            />
          </View>
          {item.expiryDate && (
            <View style={styles.itemFooter}>
              <Text style={styles.itemExpiry}>
                Caduca: {formatDateToDDMMYYYY(item.expiryDate)}
              </Text>
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <Card style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No se encontraron productos' : 'No hay productos'}
      </Text>
      <Text style={styles.emptyDescription}>
        {searchQuery
          ? 'Intenta con otros términos de búsqueda'
          : 'Agrega tu primer producto para comenzar a gestionar tu inventario'}
      </Text>
      {!searchQuery && (
        <Button
          title="Agregar Producto"
          onPress={handleAddProduct}
          style={styles.emptyButton}
        />
      )}
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Inventario</Text>
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
        <Text style={styles.title}>Inventario</Text>
        <Button
          title="Agregar"
          onPress={handleAddProduct}
          variant="primary"
          size="small"
        />
      </View>
      <SearchInput
        value={searchQuery}
        onChangeText={filterProducts}
        placeholder="Buscar productos..."
      />

      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      <AddProductModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onProductAdded={handleProductAdded}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  itemContainer: {
    marginBottom: 12,
  },
  itemCard: {
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
  itemDescription: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
  },
  stockControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    paddingVertical: 8,
  },
  stockButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  stockText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginHorizontal: 16,
    minWidth: 80,
    textAlign: 'center',
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
    marginBottom: 24,
    lineHeight: 24,
  },
  emptyButton: {
    paddingHorizontal: 24,
  },
});
