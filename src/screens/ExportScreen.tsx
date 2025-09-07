import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { databaseService } from '../services/database/database';
import { productsRepository } from '../services/repositories/products';
import { templateRepository } from '../services/repositories/template';
import { Product, TemplateItem } from '../types';
import { formatDateToDDMMYYYY } from '../utils/dateUtils';

const ExportScreenSimplified: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, []),
  );

  const loadData = async () => {
    try {
      setLoading(true);
      await databaseService.init();

      const [productsData, templatesData] = await Promise.all([
        productsRepository.getAll(),
        templateRepository.getAll(),
      ]);

      setProducts(productsData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const generateInventoryJSON = () => {
    const inventoryData = products.map(product => ({
      id: product.id,
      nombre: product.name,
      categoria: product.category,
      descripcion: product.description || '',
      stock_actual: product.currentStock,
      fecha_caducidad: product.expiryDate
        ? formatDateToDDMMYYYY(product.expiryDate)
        : null,
      fecha_creacion: formatDateToDDMMYYYY(product.createdAt),
      fecha_actualizacion: formatDateToDDMMYYYY(product.updatedAt),
    }));

    return JSON.stringify(inventoryData, null, 2);
  };

  const generateShoppingList = () => {
    const shoppingItems = products
      .map(product => {
        const template = templates.find(t => t.productId === product.id);
        if (!template) return null;

        const needed = template.idealQuantity - product.currentStock;
        if (needed <= 0) return null;

        return {
          producto: product.name,
          categoria: product.category,
          stock_actual: product.currentStock,
          stock_ideal: template.idealQuantity,
          cantidad_necesaria: needed,
          prioridad: template.priority,
        };
      })
      .filter(Boolean);

    return shoppingItems;
  };

  const exportInventoryJSON = async () => {
    try {
      const jsonData = generateInventoryJSON();
      const fileName = `inventario_${
        new Date().toISOString().split('T')[0]
      }.json`;

      await Share.share({
        message: jsonData,
        title: 'Exportar Inventario',
        url: `data:application/json;base64,${btoa(jsonData)}`,
      });
    } catch (error) {
      console.error('Error exporting JSON:', error);
      Alert.alert('Error', 'No se pudo exportar el archivo JSON');
    }
  };

  const exportShoppingList = async () => {
    try {
      const shoppingItems = generateShoppingList();

      if (shoppingItems.length === 0) {
        Alert.alert('Lista vacía', 'No hay productos con stock bajo');
        return;
      }

      const shoppingListText = shoppingItems
        .map(
          item =>
            `• ${item.producto} (${item.categoria})\n` +
            `  Stock actual: ${item.stock_actual} | Ideal: ${item.stock_ideal}\n` +
            `  Necesitas: ${item.cantidad_necesaria} unidades\n` +
            `  Prioridad: ${item.prioridad}\n`,
        )
        .join('\n');

      const fullText = `LISTA DE COMPRA - ${new Date().toLocaleDateString(
        'es-ES',
      )}\n\n${shoppingListText}`;

      await Share.share({
        message: fullText,
        title: 'Lista de Compra',
      });
    } catch (error) {
      console.error('Error exporting shopping list:', error);
      Alert.alert('Error', 'No se pudo exportar la lista de compra');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Exportar Datos</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Exportar Datos</Text>
        <Text style={styles.subtitle}>
          Exporta tu inventario y genera listas de compra
        </Text>
      </View>

      <View style={styles.content}>
        {/* Exportar Inventario */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>📦 Exportar Inventario</Text>
          <Text style={styles.sectionDescription}>
            Exporta todos los productos en formato JSON con información completa
          </Text>
          <Text style={styles.statsText}>
            {products.length} productos disponibles para exportar
          </Text>
          <Button
            title="Exportar JSON"
            onPress={exportInventoryJSON}
            variant="primary"
            style={styles.exportButton}
          />
        </Card>

        {/* Lista de Compra */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>🛒 Lista de Compra</Text>
          <Text style={styles.sectionDescription}>
            Genera una lista de productos que necesitas comprar según las
            plantillas ideales
          </Text>
          <Text style={styles.statsText}>
            {generateShoppingList().length} productos necesitan reposición
          </Text>
          <Button
            title="Generar Lista"
            onPress={exportShoppingList}
            variant="outline"
            style={styles.exportButton}
          />
        </Card>

        {/* Vista previa de datos */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Resumen de Datos</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{products.length}</Text>
              <Text style={styles.summaryLabel}>Productos</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>
                {products.reduce((sum, p) => sum + p.currentStock, 0)}
              </Text>
              <Text style={styles.summaryLabel}>Unidades</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{templates.length}</Text>
              <Text style={styles.summaryLabel}>Plantillas</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>
                {generateShoppingList().length}
              </Text>
              <Text style={styles.summaryLabel}>Por Comprar</Text>
            </View>
          </View>
        </Card>
      </View>
    </ScrollView>
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
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 20,
  },
  statsText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
    marginBottom: 16,
  },
  exportButton: {
    marginTop: 8,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
});

export default ExportScreenSimplified;
