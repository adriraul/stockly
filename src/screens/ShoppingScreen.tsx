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
import { ShoppingListItem } from '../types';

const ShoppingScreen: React.FC = () => {
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      generateShoppingList();
    }, [])
  );

  const generateShoppingList = async () => {
    try {
      const list = await businessLogicService.generateShoppingList();
      setShoppingList(list);
    } catch (error) {
      console.error('Error generating shopping list:', error);
      Alert.alert('Error', 'No se pudo generar la lista de la compra');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await generateShoppingList();
    setRefreshing(false);
  };

  const handleMarkAsPurchased = (productId: string) => {
    Alert.alert(
      'Producto Comprado',
      '¿Has comprado este producto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí',
          onPress: () => {
            // TODO: Implementar lógica para marcar como comprado
            Alert.alert('Próximamente', 'Función de marcar como comprado en desarrollo');
          },
        },
      ]
    );
  };

  const handleClearList = () => {
    Alert.alert(
      'Limpiar Lista',
      '¿Estás seguro de que quieres limpiar toda la lista de la compra?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: () => {
            setShoppingList([]);
            Alert.alert('Éxito', 'Lista de la compra limpiada');
          },
        },
      ]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Baja';
      default: return priority;
    }
  };

  const groupByCategory = (items: ShoppingListItem[]) => {
    const grouped: { [key: string]: ShoppingListItem[] } = {};
    items.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    return grouped;
  };

  const renderShoppingItem = ({ item }: { item: ShoppingListItem }) => {
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
            Cantidad necesaria: {item.neededQuantity}
          </Text>
        </View>
        <View style={styles.itemActions}>
          <Button
            title="✓ Comprado"
            onPress={() => handleMarkAsPurchased(item.productId)}
            variant="success"
            size="small"
            style={styles.actionButton}
          />
        </View>
      </Card>
    );
  };

  const renderCategorySection = (category: string, items: ShoppingListItem[]) => (
    <View key={category} style={styles.categorySection}>
      <Text style={styles.categoryTitle}>📂 {category}</Text>
      {items.map((item) => (
        <View key={item.productId}>
          {renderShoppingItem({ item })}
        </View>
      ))}
    </View>
  );

  const renderEmptyState = () => (
    <Card style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>🛒 Lista Vacía</Text>
      <Text style={styles.emptyText}>
        ¡Excelente! No necesitas comprar nada en este momento.
        Tu inventario está al día con tu plantilla ideal.
      </Text>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Generando lista de la compra...</Text>
      </View>
    );
  }

  const groupedItems = groupByCategory(shoppingList);

  return (
    <View style={styles.container}>
      {shoppingList.length > 0 && (
        <View style={styles.header}>
          <Button
            title="🗑️ Limpiar Lista"
            onPress={handleClearList}
            variant="danger"
            style={styles.clearButton}
          />
        </View>
      )}

      <FlatList
        data={Object.entries(groupedItems)}
        renderItem={({ item: [category, items] }) => renderCategorySection(category, items)}
        keyExtractor={([category]) => category}
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
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  clearButton: {
    width: '100%',
  },
  listContainer: {
    padding: 16,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
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
    marginBottom: 12,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#0369a1',
    fontWeight: '600',
  },
  itemActions: {
    alignItems: 'flex-end',
  },
  actionButton: {
    minWidth: 100,
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

export default ShoppingScreen;
