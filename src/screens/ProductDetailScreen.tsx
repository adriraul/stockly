import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';

import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { productsRepository } from '../services/repositories/products';
import { inventoryRepository } from '../services/repositories/inventory';
import { businessLogicService } from '../services/businessLogic';
import { RootStackParamList } from '../navigation/AppNavigator';

import { Product, InventoryItem } from '../types';

type ProductDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  'ProductDetail'
>;

const ProductDetailScreen: React.FC = () => {
  const route = useRoute<ProductDetailScreenRouteProp>();
  const { productId } = route.params;

  const [product, setProduct] = useState<Product | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form states
  const [quantity, setQuantity] = useState(0);
  const [expiryDate, setExpiryDate] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [location, setLocation] = useState('Despensa');
  const [notes, setNotes] = useState('');

  useFocusEffect(() => {
    loadProductData();
  });

  const loadProductData = async () => {
    try {
      const [productData, inventoryData] = await Promise.all([
        productsRepository.getById(productId),
        inventoryRepository.getByProductId(productId),
      ]);

      setProduct(productData);
      setInventoryItems(inventoryData);
    } catch (error) {
      console.error('Error loading product data:', error);
      Alert.alert('Error', 'No se pudo cargar la información del producto');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToInventory = async () => {
    if (!product) return;

    try {
      if (quantity <= 0) {
        Alert.alert('Error', 'La cantidad debe ser mayor a 0');
        return;
      }

      if (!expiryDate || !purchaseDate) {
        Alert.alert(
          'Error',
          'Debes especificar las fechas de compra y caducidad',
        );
        return;
      }

      await inventoryRepository.create({
        productId: product.id,
        quantity,
        expiryDate,
        purchaseDate,
        location,
        notes,
      });

      Alert.alert('Éxito', 'Producto agregado al inventario');
      setShowAddModal(false);
      resetForm();
      loadProductData();
    } catch (error) {
      console.error('Error adding to inventory:', error);
      Alert.alert('Error', 'No se pudo agregar el producto al inventario');
    }
  };

  const handleConsume = async (
    inventoryId: string,
    consumeQuantity: number,
  ) => {
    try {
      await businessLogicService.consumeProduct(productId, consumeQuantity);
      Alert.alert('Éxito', 'Producto consumido');
      loadProductData();
    } catch (error) {
      console.error('Error consuming product:', error);
      Alert.alert('Error', error.message || 'No se pudo consumir el producto');
    }
  };

  const handleDelete = async (inventoryId: string) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que quieres eliminar este item del inventario?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await inventoryRepository.delete(inventoryId);
              Alert.alert('Éxito', 'Item eliminado del inventario');
              loadProductData();
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'No se pudo eliminar el item');
            }
          },
        },
      ],
    );
  };

  const resetForm = () => {
    setQuantity(0);
    setExpiryDate('');
    setPurchaseDate('');
    setLocation('Despensa');
    setNotes('');
  };

  const getExpiryStatus = (expiryDate: string) => {
    const daysUntilExpiry = businessLogicService.getDaysUntilExpiry(expiryDate);
    if (daysUntilExpiry < 0)
      return { text: 'Caducado', variant: 'danger' as const };
    if (daysUntilExpiry <= 3)
      return { text: `${daysUntilExpiry} días`, variant: 'warning' as const };
    if (daysUntilExpiry <= 7)
      return { text: `${daysUntilExpiry} días`, variant: 'info' as const };
    return { text: `${daysUntilExpiry} días`, variant: 'success' as const };
  };

  const getTotalQuantity = () => {
    return inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando producto...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Producto no encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Product Info */}
      <Card style={styles.productCard}>
        <Text style={styles.productName}>{product.name}</Text>
        <View style={styles.productDetails}>
          <Text style={styles.productCategory}>📂 {product.category}</Text>
          <Text style={styles.productUnit}>📏 {product.unit}</Text>
        </View>
        <View style={styles.stockInfo}>
          <Text style={styles.stockLabel}>Stock actual:</Text>
          <Text style={styles.stockValue}>
            {getTotalQuantity()} {product.unit}
          </Text>
        </View>
        <View style={styles.rangeInfo}>
          <Text style={styles.rangeText}>
            Mín: {product.minQuantity} | Máx: {product.maxQuantity}
          </Text>
        </View>
      </Card>

      {/* Actions */}
      <Card style={styles.actionsCard}>
        <Button
          title="+ Agregar al Inventario"
          onPress={() => setShowAddModal(true)}
          variant="primary"
          style={styles.actionButton}
        />
        <Button
          title="✏️ Editar Producto"
          onPress={() => setShowEditModal(true)}
          variant="outline"
          style={styles.actionButton}
        />
      </Card>

      {/* Inventory Items */}
      <Card style={styles.inventoryCard}>
        <Text style={styles.sectionTitle}>Items en Inventario</Text>
        {inventoryItems.length === 0 ? (
          <Text style={styles.emptyText}>No hay items en el inventario</Text>
        ) : (
          inventoryItems.map(item => {
            const expiryStatus = getExpiryStatus(item.expiryDate);
            return (
              <View key={item.id} style={styles.inventoryItem}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemQuantity}>
                    {item.quantity} {product.unit}
                  </Text>
                  <Badge
                    text={expiryStatus.text}
                    variant={expiryStatus.variant}
                  />
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemLocation}>📍 {item.location}</Text>
                  <Text style={styles.itemDate}>
                    Comprado: {new Date(item.purchaseDate).toLocaleDateString()}
                  </Text>
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
                    onPress={() => handleConsume(item.id, 1)}
                    variant="secondary"
                    size="small"
                    style={styles.consumeButton}
                  />
                  <Button
                    title="Eliminar"
                    onPress={() => handleDelete(item.id)}
                    variant="danger"
                    size="small"
                    style={styles.deleteButton}
                  />
                </View>
              </View>
            );
          })
        )}
      </Card>

      {/* Add to Inventory Modal */}
      <Modal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Agregar al Inventario"
      >
        <View style={styles.modalForm}>
          <Input
            label="Cantidad"
            value={quantity.toString()}
            onChangeText={text => setQuantity(parseFloat(text) || 0)}
            keyboardType="numeric"
          />

          <Input
            label="Fecha de Compra"
            value={purchaseDate}
            onChangeText={setPurchaseDate}
            placeholder="YYYY-MM-DD"
          />

          <Input
            label="Fecha de Caducidad"
            value={expiryDate}
            onChangeText={setExpiryDate}
            placeholder="YYYY-MM-DD"
          />

          <Input
            label="Ubicación"
            value={location}
            onChangeText={setLocation}
            placeholder="Despensa, Refrigerador, etc."
          />

          <Input
            label="Notas (opcional)"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />

          <View style={styles.modalActions}>
            <Button
              title="Cancelar"
              onPress={() => {
                setShowAddModal(false);
                resetForm();
              }}
              variant="outline"
              style={styles.modalButton}
            />
            <Button
              title="Agregar"
              onPress={handleAddToInventory}
              variant="primary"
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  errorText: {
    fontSize: 18,
    color: '#dc2626',
  },
  productCard: {
    margin: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productCategory: {
    fontSize: 14,
    color: '#64748b',
  },
  productUnit: {
    fontSize: 14,
    color: '#64748b',
  },
  stockInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stockLabel: {
    fontSize: 16,
    color: '#374151',
  },
  stockValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0369a1',
  },
  rangeInfo: {
    alignItems: 'center',
  },
  rangeText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  actionsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    marginBottom: 8,
  },
  inventoryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  inventoryItem: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemLocation: {
    fontSize: 12,
    color: '#64748b',
  },
  itemDate: {
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
  consumeButton: {
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    flex: 1,
    marginLeft: 8,
  },
  modalForm: {
    gap: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default ProductDetailScreen;
