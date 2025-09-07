import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { DatePicker } from './DatePicker';
import { productsRepository } from '../services/repositories/products';
import { parseDateFromDDMMYYYY, isValidDDMMYYYY } from '../utils/dateUtils';

interface AddProductModalProps {
  visible: boolean;
  onClose: () => void;
  onProductAdded: () => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  visible,
  onClose,
  onProductAdded,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    initialStock: '',
    expiryDate: undefined as string | undefined,
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'El nombre del producto es obligatorio');
      return;
    }

    // Categoría es opcional, usar "Sin categoría" si está vacía
    const category = formData.category.trim() || 'Sin categoría';

    const initialStock = parseInt(formData.initialStock) || 0;
    if (initialStock < 0) {
      Alert.alert('Error', 'El stock inicial no puede ser negativo');
      return;
    }

    // La fecha ya viene en formato ISO del DatePicker
    const parsedExpiryDate = formData.expiryDate;

    try {
      setLoading(true);

      // Crear el producto con stock inicial
      await productsRepository.create({
        name: formData.name.trim(),
        category: category,
        description: formData.description.trim() || undefined,
        currentStock: initialStock,
        expiryDate: parsedExpiryDate,
      });

      onProductAdded();
      onClose();

      // Reset form
      setFormData({
        name: '',
        category: '',
        description: '',
        initialStock: '',
        expiryDate: undefined,
      });
    } catch (error) {
      console.error('Error adding product:', error);
      Alert.alert('Error', 'No se pudo agregar el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Agregar Producto">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <Input
            label="Nombre del Producto *"
            value={formData.name}
            onChangeText={value => handleInputChange('name', value)}
            placeholder="Ej: Leche, Pan, Manzanas..."
          />

          <Input
            label="Descripción (opcional)"
            value={formData.description}
            onChangeText={value => handleInputChange('description', value)}
            placeholder="Descripción del producto..."
            multiline
            numberOfLines={2}
          />

          <Input
            label="Categoría (opcional)"
            value={formData.category}
            onChangeText={value => handleInputChange('category', value)}
            placeholder="Ej: Lácteos, Panadería, Frutas... (dejar vacío para 'Sin categoría')"
          />

          <Input
            label="Stock Inicial (unidades)"
            value={formData.initialStock}
            onChangeText={value => handleInputChange('initialStock', value)}
            keyboardType="number-pad"
            placeholder="Ejemplo: 10"
          />

          <DatePicker
            label="Fecha de Caducidad (opcional)"
            value={formData.expiryDate}
            onChange={value =>
              setFormData(prev => ({ ...prev, expiryDate: value }))
            }
            placeholder="Seleccionar fecha"
          />

          <View style={styles.buttonContainer}>
            <Button
              title="Cancelar"
              onPress={onClose}
              variant="outline"
              style={styles.button}
            />
            <Button
              title={loading ? 'Agregando...' : 'Agregar Producto'}
              onPress={handleSubmit}
              variant="primary"
              style={styles.button}
              disabled={loading}
            />
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  button: {
    flex: 1,
    minWidth: 0,
  },
});
