import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { PurchaseModal } from '../components/PurchaseModal';
import { databaseService } from '../services/database/database_v4';
import { productsRepository } from '../services/repositories/products_simplified';
import { templateRepository } from '../services/repositories/template_simplified';
import { Product, TemplateItem } from '../types/simplified';
import { formatDateToDDMMYYYY } from '../utils/dateUtils';

interface ShoppingItem {
  product: Product;
  template: TemplateItem;
  needed: number;
}

const ShoppingScreenSimplified: React.FC = () => {
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchaseModal, setPurchaseModal] = useState<{
    visible: boolean;
    item: ShoppingItem | null;
  }>({ visible: false, item: null });

  useFocusEffect(
    React.useCallback(() => {
      loadShoppingList();
    }, []),
  );

  const loadShoppingList = async () => {
    try {
      setLoading(true);
      await databaseService.init();

      const [products, templates] = await Promise.all([
        productsRepository.getAll(),
        templateRepository.getAll(),
      ]);

      // Generar lista de compra
      const items: ShoppingItem[] = products
        .map(product => {
          const template = templates.find(t => t.productId === product.id);
          if (!template) return null;

          const needed = template.idealQuantity - product.currentStock;
          if (needed <= 0) return null;

          return {
            product,
            template,
            needed,
          };
        })
        .filter(Boolean) as ShoppingItem[];

      // Ordenar por prioridad
      items.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return (
          priorityOrder[b.template.priority] -
          priorityOrder[a.template.priority]
        );
      });

      setShoppingItems(items);
    } catch (error) {
      console.error('Error loading shopping list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadShoppingList();
    setRefreshing(false);
  };

  const handlePurchase = async (quantity: number) => {
    if (!purchaseModal.item) return;

    try {
      const { product } = purchaseModal.item;
      const newStock = product.currentStock + quantity;

      await productsRepository.update(product.id, {
        currentStock: newStock,
      });

      // Recargar la lista para actualizar los datos
      await loadShoppingList();
    } catch (error) {
      console.error('Error updating stock:', error);
      Alert.alert('Error', 'No se pudo actualizar el stock del producto');
    }
  };

  const handleItemPress = (item: ShoppingItem) => {
    setPurchaseModal({ visible: true, item });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#dc2626';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#059669';
      default:
        return '#6b7280';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      case 'low':
        return 'Baja';
      default:
        return 'Sin prioridad';
    }
  };

  const renderShoppingItem = ({ item }: { item: ShoppingItem }) => {
    const { product, template, needed } = item;

    return (
      <TouchableOpacity onPress={() => handleItemPress(item)}>
        <Card style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemName}>{product.name}</Text>
            <Badge
              text={getPriorityText(template.priority)}
              variant={template.priority === 'high' ? 'danger' : 'warning'}
            />
          </View>

          <View style={styles.itemDetails}>
            <Text style={styles.itemCategory}>📂 {product.category}</Text>
            {product.description && (
              <Text style={styles.itemDescription}>{product.description}</Text>
            )}
          </View>

          <View style={styles.stockInfo}>
            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>Stock actual:</Text>
              <Text style={styles.stockValue}>{product.currentStock}</Text>
            </View>
            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>Stock ideal:</Text>
              <Text style={styles.stockValue}>{template.idealQuantity}</Text>
            </View>
            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>Necesitas:</Text>
              <Text style={[styles.stockValue, styles.neededValue]}>
                {needed} unidades
              </Text>
            </View>
          </View>

          {product.expiryDate && (
            <View style={styles.itemFooter}>
              <Text style={styles.itemExpiry}>
                Caduca: {formatDateToDDMMYYYY(product.expiryDate)}
              </Text>
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <Card style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>¡Lista de compra vacía!</Text>
      <Text style={styles.emptyDescription}>
        No hay productos que necesiten reposición. Tu inventario está al día.
      </Text>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Lista de Compra</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando lista...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lista de Compra</Text>
        <Text style={styles.subtitle}>
          Productos que necesitas comprar según las plantillas ideales
        </Text>
      </View>

      <FlatList
        data={shoppingItems}
        renderItem={renderShoppingItem}
        keyExtractor={item => item.product.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      <PurchaseModal
        visible={purchaseModal.visible}
        onClose={() => setPurchaseModal({ visible: false, item: null })}
        onPurchase={handlePurchase}
        productName={purchaseModal.item?.product.name || ''}
        needed={purchaseModal.item?.needed || 0}
        currentStock={purchaseModal.item?.product.currentStock || 0}
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
  listContainer: {
    padding: 16,
  },
  itemCard: {
    marginBottom: 12,
    opacity: 0.95,
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
    color: '#6b7280',
    fontStyle: 'italic',
  },
  stockInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stockItem: {
    flex: 1,
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  stockValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  neededValue: {
    color: '#dc2626',
  },
  itemFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
  },
  itemExpiry: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    marginTop: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ShoppingScreenSimplified;
