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

import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Input } from '../components/Input';
import { AddProductModal } from '../components/AddProductModal';
import { SearchInput } from '../components/SearchInput';
import { databaseService } from '../services/database/database_v4';
import { productsRepository } from '../services/repositories/products_simplified';
import { templateRepository } from '../services/repositories/template_simplified';
import { Product, TemplateItem } from '../types/simplified';

const TemplateScreenSimplified: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [idealQuantities, setIdealQuantities] = useState<
    Record<string, number>
  >({});
  const [priorities, setPriorities] = useState<
    Record<string, 'high' | 'medium' | 'low'>
  >({});

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const loadData = async () => {
    try {
      setLoading(true);
      await databaseService.init();

      const allProducts = await productsRepository.getAll();
      setProducts(allProducts);
      setFilteredProducts(allProducts);

      // Cargar plantillas existentes
      const existingTemplates = await templateRepository.getAll();
      setTemplates(existingTemplates);

      // Inicializar estados de edición con datos de plantillas o valores por defecto
      const quantities: Record<string, number> = {};
      const priorityMap: Record<string, 'high' | 'medium' | 'low'> = {};

      allProducts.forEach(product => {
        const template = existingTemplates.find(
          t => t.productId === product.id,
        );
        // Stock ideal es para alertas, no se inicializa con el stock actual
        quantities[product.id] = template?.idealQuantity || 0;
        priorityMap[product.id] = template?.priority || 'medium';
      });

      setIdealQuantities(quantities);
      setPriorities(priorityMap);
    } catch (error) {
      console.error('Error loading template data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleProductAdded = () => {
    loadData();
    setShowAddModal(false);
    setSearchQuery('');
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

  const handleEditProduct = (productId: string) => {
    setEditingProduct(productId);
  };

  const handleSaveProduct = async (productId: string) => {
    try {
      const idealQuantity = idealQuantities[productId] || 0;
      const priority = priorities[productId] || 'medium';

      await templateRepository.upsert({
        productId,
        idealQuantity,
        priority,
      });

      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving template:', error);
      Alert.alert('Error', 'No se pudo guardar la plantilla');
    }
  };

  const handleQuantityChange = (productId: string, quantity: string) => {
    const numQuantity = parseInt(quantity) || 0;
    setIdealQuantities(prev => ({
      ...prev,
      [productId]: numQuantity,
    }));
  };

  const handlePriorityChange = (
    productId: string,
    priority: 'high' | 'medium' | 'low',
  ) => {
    setPriorities(prev => ({
      ...prev,
      [productId]: priority,
    }));
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return '#dc2626';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#64748b';
    }
  };

  const getPriorityText = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      case 'low':
        return 'Baja';
      default:
        return 'Media';
    }
  };

  const renderTemplateItem = ({ item }: { item: Product }) => {
    const isEditing = editingProduct === item.id;
    const idealQuantity = idealQuantities[item.id] || 0;
    const priority = priorities[item.id] || 'medium';
    const isLowStock = item.currentStock < idealQuantity;

    return (
      <Card style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Badge
            text={getPriorityText(priority)}
            variant={isLowStock ? 'warning' : 'default'}
          />
        </View>

        <View style={styles.itemDetails}>
          <Text style={styles.itemCategory}>📂 {item.category}</Text>
          <Text style={styles.stockInfo}>
            Stock actual: {item.currentStock} unidades
          </Text>
        </View>

        <View style={styles.templateControls}>
          <View style={styles.quantitySection}>
            <Text style={styles.controlLabel}>Stock ideal:</Text>
            {isEditing ? (
              <Input
                value={idealQuantity.toString()}
                onChangeText={text => handleQuantityChange(item.id, text)}
                keyboardType="numeric"
                style={styles.quantityInput}
              />
            ) : (
              <Text style={styles.quantityText}>{idealQuantity} unidades</Text>
            )}
          </View>

          <View style={styles.prioritySection}>
            <Text style={styles.controlLabel}>Prioridad:</Text>
            <View style={styles.priorityButtons}>
              {(['high', 'medium', 'low'] as const).map(p => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityButton,
                    priority === p && styles.priorityButtonActive,
                    { borderColor: getPriorityColor(p) },
                  ]}
                  onPress={() => handlePriorityChange(item.id, p)}
                >
                  <Text
                    style={[
                      styles.priorityButtonText,
                      priority === p && { color: getPriorityColor(p) },
                    ]}
                  >
                    {getPriorityText(p)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.itemActions}>
          {isEditing ? (
            <Button
              title="Guardar"
              onPress={() => handleSaveProduct(item.id)}
              variant="primary"
              size="small"
              style={styles.actionButton}
            />
          ) : (
            <Button
              title="Editar"
              onPress={() => handleEditProduct(item.id)}
              variant="outline"
              size="small"
              style={styles.actionButton}
            />
          )}
        </View>
      </Card>
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
          : 'Agrega productos en el inventario para configurar sus plantillas ideales. El stock ideal es independiente del stock actual del producto.'}
      </Text>
      {!searchQuery && (
        <Button
          title="Agregar Producto"
          onPress={() => setShowAddModal(true)}
          style={styles.emptyButton}
        />
      )}
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Plantillas Ideales</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando plantillas...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Plantillas Ideales</Text>
        <Button
          title="Agregar Producto"
          onPress={() => setShowAddModal(true)}
          variant="primary"
          size="small"
        />
      </View>
      <SearchInput
        value={searchQuery}
        onChangeText={filterProducts}
        placeholder="Buscar productos..."
      />
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>
          Configura el stock ideal para cada producto
        </Text>
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderTemplateItem}
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
};

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
    flex: 1,
  },
  subtitleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
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
  stockInfo: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0369a1',
  },
  templateControls: {
    marginBottom: 12,
    gap: 12,
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  quantityInput: {
    width: 80,
    textAlign: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  prioritySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: '#ffffff',
  },
  priorityButtonActive: {
    backgroundColor: '#f0f9ff',
  },
  priorityButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  itemActions: {
    alignItems: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 16,
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

export default TemplateScreenSimplified;
