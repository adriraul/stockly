import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { DatePicker } from '../components/DatePicker';
import { databaseService } from '../services/database/database';
import { productsRepository } from '../services/repositories/products';
import {
  parseDateFromDDMMYYYY,
  isValidDDMMYYYY,
  formatDateToDDMMYYYY,
} from '../utils/dateUtils';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Product } from '../types';

type ProductDetailScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ProductDetail'
>;
type ProductDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  'ProductDetail'
>;

interface Props {
  navigation: ProductDetailScreenNavigationProp;
  route: ProductDetailScreenRouteProp;
}

export default function ProductDetailScreen({ navigation, route }: Props) {
  const { productId } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    expiryDate: undefined as string | undefined,
  });

  useEffect(() => {
    loadProductData();
  }, [productId]);

  const loadProductData = async () => {
    try {
      setLoading(true);
      const productData = await productsRepository.getById(productId);
      if (productData) {
        setProduct(productData);
        setFormData({
          name: productData.name,
          category: productData.category,
          description: productData.description || '',
          expiryDate: productData.expiryDate,
        });
      } else {
        Alert.alert('Error', 'Producto no encontrado');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading product data:', error);
      Alert.alert('Error', 'No se pudo cargar la información del producto');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!product) return;

    // La fecha ya viene en formato ISO del DatePicker
    const parsedExpiryDate = formData.expiryDate;

    try {
      const updates: Partial<Product> = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        description: formData.description.trim() || undefined,
        expiryDate: parsedExpiryDate,
      };

      await productsRepository.update(product.id, updates);
      await loadProductData();
      setEditing(false);
      navigation.goBack();
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', 'No se pudo actualizar el producto');
    }
  };

  const handleCancel = () => {
    if (product) {
      setFormData({
        name: product.name,
        category: product.category,
        description: product.description || '',
        expiryDate: product.expiryDate,
      });
    }
    setEditing(false);
  };

  const handleDelete = () => {
    if (!product) return;

    Alert.alert(
      'Eliminar Producto',
      `¿Estás seguro de que quieres eliminar "${product.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await productsRepository.delete(product.id);
              Alert.alert('Éxito', 'Producto eliminado correctamente');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'No se pudo eliminar el producto');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Cargando...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            Cargando información del producto...
          </Text>
        </View>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Producto no encontrado</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{product.name}</Text>
        <View style={styles.headerActions}>
          {editing ? (
            <>
              <Button
                title="Cancelar"
                onPress={handleCancel}
                variant="outline"
                size="small"
                style={styles.headerButton}
              />
              <Button
                title="Guardar"
                onPress={handleSave}
                variant="primary"
                size="small"
                style={styles.headerButton}
              />
            </>
          ) : (
            <Button
              title="Editar"
              onPress={() => setEditing(true)}
              variant="primary"
              size="small"
              style={styles.headerButton}
            />
          )}
        </View>
      </View>

      <View style={styles.content}>
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Información General</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Nombre</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={text => setFormData({ ...formData, name: text })}
                placeholder="Nombre del producto"
              />
            ) : (
              <Text style={styles.fieldValue}>{product.name}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Categoría</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={formData.category}
                onChangeText={text =>
                  setFormData({ ...formData, category: text })
                }
                placeholder="Categoría del producto"
              />
            ) : (
              <Text style={styles.fieldValue}>{product.category}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Descripción</Text>
            {editing ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={text =>
                  setFormData({ ...formData, description: text })
                }
                placeholder="Descripción del producto (opcional)"
                multiline
                numberOfLines={3}
              />
            ) : (
              <Text style={styles.fieldValue}>
                {product.description || 'Sin descripción'}
              </Text>
            )}
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Stock y Caducidad</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Stock Actual</Text>
            <Text style={styles.stockValue}>
              {product.currentStock} unidades
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Fecha de Caducidad</Text>
            {editing ? (
              <DatePicker
                value={formData.expiryDate}
                onChange={value =>
                  setFormData({ ...formData, expiryDate: value })
                }
                placeholder="Seleccionar fecha (opcional)"
              />
            ) : (
              <Text style={styles.fieldValue}>
                {product.expiryDate
                  ? formatDateToDDMMYYYY(product.expiryDate)
                  : 'Sin fecha'}
              </Text>
            )}
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Sistema</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Creado</Text>
            <Text style={styles.fieldValue}>
              {new Date(product.createdAt).toLocaleDateString('es-ES')}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Última actualización</Text>
            <Text style={styles.fieldValue}>
              {new Date(product.updatedAt).toLocaleDateString('es-ES')}
            </Text>
          </View>
        </Card>

        {editing && (
          <View style={styles.dangerSection}>
            <Button
              title="Eliminar Producto"
              onPress={handleDelete}
              variant="danger"
              style={styles.deleteButton}
            />
          </View>
        )}
      </View>
    </ScrollView>
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
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
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
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: '#1e293b',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  stockValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0369a1',
  },
  dangerSection: {
    marginTop: 16,
  },
  deleteButton: {
    backgroundColor: '#dc2626',
  },
});
