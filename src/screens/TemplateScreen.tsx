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
import { AddTemplateModal } from '../components/AddTemplateModal';
import { templateRepository } from '../services/repositories/template';
import { productsRepository } from '../services/repositories/products';
import { inventoryRepository } from '../services/repositories/inventory';
import { businessLogicService } from '../services/businessLogic';
import { TemplateItem } from '../types';

const TemplateScreen: React.FC = () => {
  const [templateItems, setTemplateItems] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadTemplate();
    }, []),
  );

  const loadTemplate = async () => {
    try {
      const items = await templateRepository.getAll();
      setTemplateItems(items);
    } catch (error) {
      console.error('Error loading template:', error);
      Alert.alert('Error', 'No se pudo cargar la plantilla');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTemplate();
    setRefreshing(false);
  };

  const handleAddProduct = () => {
    setShowAddModal(true);
  };

  const handleTemplateAdded = () => {
    loadTemplate();
  };

  const handleEditItem = (item: TemplateItem) => {
    // TODO: Implementar modal de edición
    Alert.alert('Próximamente', 'Función de edición en desarrollo');
  };

  const handleDeleteItem = (itemId: string) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que quieres eliminar este producto de la plantilla?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await templateRepository.delete(itemId);
              Alert.alert('Éxito', 'Producto eliminado de la plantilla');
              loadTemplate();
            } catch (error) {
              console.error('Error deleting template item:', error);
              Alert.alert('Error', 'No se pudo eliminar el producto');
            }
          },
        },
      ],
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
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
        return priority;
    }
  };

  const renderTemplateItem = ({ item }: { item: TemplateItem }) => {
    return (
      <Card style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>{item.productName}</Text>
          <Badge
            text={getPriorityText(item.priority)}
            variant={getPriorityColor(item.priority)}
          />
        </View>
        <View style={styles.itemDetails}>
          <Text style={styles.itemQuantity}>
            Cantidad ideal: {item.idealQuantity} {item.unit}
          </Text>
          <Text style={styles.itemCategory}>📂 {item.category}</Text>
        </View>
        <View style={styles.itemActions}>
          <Button
            title="Editar"
            onPress={() => handleEditItem(item)}
            variant="outline"
            size="small"
            style={styles.actionButton}
          />
          <Button
            title="Eliminar"
            onPress={() => handleDeleteItem(item.id)}
            variant="danger"
            size="small"
            style={styles.actionButton}
          />
        </View>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <Card style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>📋 Plantilla Vacía</Text>
      <Text style={styles.emptyText}>
        No tienes productos en tu plantilla ideal. Agrega productos para definir
        las cantidades que siempre quieres tener disponibles.
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
        <Text style={styles.loadingText}>Cargando plantilla...</Text>
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
        data={templateItems}
        renderItem={renderTemplateItem}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <AddTemplateModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onTemplateAdded={handleTemplateAdded}
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
    marginBottom: 12,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#0369a1',
    fontWeight: '600',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 12,
    color: '#64748b',
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
    marginBottom: 20,
    lineHeight: 24,
  },
  emptyButton: {
    width: '100%',
  },
});

export default TemplateScreen;
