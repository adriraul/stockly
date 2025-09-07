import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';

interface PurchaseModalProps {
  visible: boolean;
  onClose: () => void;
  onPurchase: (quantity: number) => void;
  productName: string;
  needed: number;
  currentStock: number;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  visible,
  onClose,
  onPurchase,
  productName,
  needed,
  currentStock,
}) => {
  const [quantity, setQuantity] = useState('');

  const handlePurchase = () => {
    const purchaseQuantity = parseInt(quantity) || 0;

    if (purchaseQuantity <= 0) {
      Alert.alert('Error', 'La cantidad debe ser mayor a 0');
      return;
    }

    onPurchase(purchaseQuantity);
    onClose();
  };

  const handleClose = () => {
    setQuantity('');
    onClose();
  };

  return (
    <Modal visible={visible} onClose={handleClose} title="Marcar como Comprado">
      <View style={styles.container}>
        <Text style={styles.productName}>{productName}</Text>

        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Stock actual:</Text>
            <Text style={styles.infoValue}>{currentStock} unidades</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Necesitas:</Text>
            <Text style={styles.infoValue}>{needed} unidades</Text>
          </View>
        </View>

        <Input
          label="Cantidad comprada"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="number-pad"
          placeholder={`Ejemplo: ${needed}`}
        />

        <Text style={styles.helpText}>
          Esta cantidad se sumará al stock actual del producto
        </Text>

        <View style={styles.buttonContainer}>
          <Button
            title="Cancelar"
            onPress={handleClose}
            variant="outline"
            style={styles.button}
          />
          <Button
            title="Marcar Comprado"
            onPress={handlePurchase}
            variant="primary"
            style={styles.button}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  helpText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  button: {
    flex: 1,
    minWidth: 0,
  },
});
