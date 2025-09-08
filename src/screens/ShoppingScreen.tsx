import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { PurchaseModal } from '../components/PurchaseModal';
import { databaseService } from '../services/database/database';
import { productsRepository } from '../services/repositories/products';
import { templateRepository } from '../services/repositories/template';
import { Product, TemplateItem } from '../types';
import { formatDateToDDMMYYYY } from '../utils/dateUtils';
import { theme } from '../constants/theme';
import { useTranslations } from '../utils/i18n';

interface ShoppingItem {
  product: Product;
  template: TemplateItem;
  needed: number;
}

const ShoppingScreenSimplified: React.FC = () => {
  const t = useTranslations();
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
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
      Alert.alert(
        t.common.error,
        'No se pudo actualizar el stock del producto',
      );
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
        return t.shopping.priority.high;
      case 'medium':
        return t.shopping.priority.medium;
      case 'low':
        return t.shopping.priority.low;
      default:
        return t.shopping.priority.none;
    }
  };

  const renderShoppingItem = ({ item }: { item: ShoppingItem }) => {
    const { product, template, needed } = item;

    return (
      <TouchableOpacity
        onPress={() => handleItemPress(item)}
        activeOpacity={0.7}
      >
        <Card style={styles.itemCard} variant="elevated">
          <View style={styles.itemHeader}>
            <View style={styles.itemTitleContainer}>
              <Text style={styles.itemName}>{product.name}</Text>
              <Text style={styles.itemCategory}>
                📂 {product.category || t.shopping.noCategory}
              </Text>
            </View>
            <Badge
              text={getPriorityText(template.priority)}
              variant={
                template.priority === 'high'
                  ? 'danger'
                  : template.priority === 'medium'
                  ? 'warning'
                  : 'info'
              }
              icon={
                template.priority === 'high'
                  ? '🔥'
                  : template.priority === 'medium'
                  ? '⚡'
                  : '📝'
              }
            />
          </View>

          <View style={styles.itemDetails}>
            {product.description && (
              <Text style={styles.itemDescription}>{product.description}</Text>
            )}
          </View>

          <View style={styles.stockInfo}>
            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>{t.shopping.currentStock}</Text>
              <Text style={styles.stockValue}>{product.currentStock}</Text>
            </View>
            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>{t.shopping.idealStock}</Text>
              <Text style={styles.stockValue}>{template.idealQuantity}</Text>
            </View>
            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>{t.shopping.needed}</Text>
              <Text style={[styles.stockValue, styles.neededValue]}>
                {needed}
              </Text>
            </View>
          </View>

          {product.expiryDate && (
            <View style={styles.itemFooter}>
              <Text style={styles.itemExpiry}>
                🗓️ {t.shopping.expires}:{' '}
                {formatDateToDDMMYYYY(product.expiryDate)}
              </Text>
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <Card style={styles.emptyCard} variant="filled">
      <Text style={styles.emptyIcon}>🎉</Text>
      <Text style={styles.emptyTitle}>{t.shopping.noItems}</Text>
      <Text style={styles.emptyDescription}>
        No hay productos que necesiten reposición. Tu inventario está al día.
      </Text>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🛒 {t.shopping.title}</Text>
          <Text style={styles.subtitle}>Tu lista inteligente de compras</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>🔄 {t.common.loading}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🛒 {t.shopping.title}</Text>
        <Text style={styles.subtitle}>{t.shopping.subtitle}</Text>
      </View>

      <FlatList
        data={shoppingItems}
        renderItem={renderShoppingItem}
        keyExtractor={item => item.product.id}
        contentContainerStyle={styles.listContainer}
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
    backgroundColor: theme.colors.background.secondary,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    ...theme.shadows.sm,
  },
  title: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
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
  listContainer: {
    padding: theme.spacing.md,
  },
  itemCard: {
    marginBottom: theme.spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  itemTitleContainer: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  itemName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  itemCategory: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  itemDetails: {
    marginBottom: theme.spacing.md,
  },
  itemDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    lineHeight:
      theme.typography.lineHeight.normal * theme.typography.fontSize.sm,
  },
  stockInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
  },
  stockItem: {
    flex: 1,
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  stockValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  neededValue: {
    color: theme.colors.error,
  },
  itemFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
    paddingTop: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  itemExpiry: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.warning,
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    padding: theme.spacing['2xl'],
    marginTop: theme.spacing['3xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight:
      theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
  },
});

export default ShoppingScreenSimplified;
