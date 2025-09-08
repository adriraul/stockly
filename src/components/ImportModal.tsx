import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';

import { Modal } from './Modal';
import { Button } from './Button';
import { useTranslations } from '../utils/i18n';
import { productsRepository } from '../services/repositories/products';

interface ImportModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

const exampleJSON = `[
  {
    "name": "Leche entera",
    "description": "Leche fresca de vaca",
    "category": "Lácteos",
    "currentStock": 5,
    "expiryDate": "15/12/2025"
  },
  {
    "name": "Pan integral",
    "description": "Pan de molde integral",
    "category": "Panadería",
    "currentStock": 2,
    "expiryDate": "10/12/2025"
  },
  {
    "name": "Manzanas",
    "description": "Manzanas rojas frescas",
    "category": "Frutas",
    "currentStock": 8
  }
]`;

export const ImportModal: React.FC<ImportModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const t = useTranslations();
  const [jsonText, setJsonText] = useState(exampleJSON);
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!jsonText.trim()) {
      Alert.alert(t.common.error, t.import.emptyJson);
      return;
    }

    setLoading(true);
    try {
      const data = JSON.parse(jsonText);

      if (!Array.isArray(data)) {
        Alert.alert(t.common.error, t.import.invalidFormat);
        return;
      }

      let successCount = 0;
      const errors: string[] = [];

      for (const item of data) {
        try {
          // Validar que tenga nombre
          if (
            !item.name ||
            typeof item.name !== 'string' ||
            !item.name.trim()
          ) {
            errors.push(`${t.import.missingName}: ${JSON.stringify(item)}`);
            continue;
          }

          // Validar y convertir fecha de expiración
          let expiryDate = null;
          if (item.expiryDate && typeof item.expiryDate === 'string') {
            // Intentar convertir la fecha del formato dd/MM/yyyy a ISO
            try {
              const dateParts = item.expiryDate.split('/');
              if (dateParts.length === 3) {
                const day = parseInt(dateParts[0], 10);
                const month = parseInt(dateParts[1], 10);
                const year = parseInt(dateParts[2], 10);

                // Validar que los números sean válidos
                if (
                  day >= 1 &&
                  day <= 31 &&
                  month >= 1 &&
                  month <= 12 &&
                  year >= 2020
                ) {
                  const date = new Date(year, month - 1, day);
                  // Verificar que la fecha es válida
                  if (!isNaN(date.getTime())) {
                    expiryDate = item.expiryDate; // Mantener formato dd/MM/yyyy
                  }
                }
              }
            } catch (error) {
              console.warn('Invalid date format:', item.expiryDate);
            }
          }

          // Crear el producto con los datos disponibles
          const productData = {
            name: item.name.trim(),
            description: item.description || '',
            category: item.category || '',
            currentStock:
              typeof item.currentStock === 'number' ? item.currentStock : 0,
            expiryDate: expiryDate,
          };

          await productsRepository.create(productData);
          successCount++;
        } catch (error) {
          console.error('Error importing product:', error);
          errors.push(`${item.name}: ${error}`);
        }
      }

      if (successCount > 0) {
        onSuccess(successCount);
        setJsonText(exampleJSON); // Reset to example
      }

      if (errors.length > 0) {
        Alert.alert(
          t.import.partialSuccess,
          `${t.import.importedCount.replace(
            '{count}',
            successCount.toString(),
          )}\n\n${t.import.errors}:\n${errors.slice(0, 3).join('\n')}${
            errors.length > 3 ? '\n...' : ''
          }`,
        );
      }
    } catch (error) {
      console.error('Error parsing JSON:', error);
      Alert.alert(t.common.error, t.import.invalidJson);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setJsonText('');
  };

  const handleCancel = () => {
    setJsonText(exampleJSON);
    onClose();
  };

  return (
    <Modal visible={visible} onClose={handleCancel}>
      <View style={styles.container}>
        <Text style={styles.title}>{t.import.title}</Text>
        <Text style={styles.description}>{t.import.description}</Text>

        <ScrollView style={styles.jsonContainer}>
          <TextInput
            style={styles.jsonInput}
            value={jsonText}
            onChangeText={setJsonText}
            placeholder={t.import.placeholder}
            multiline
            textAlignVertical="top"
            autoCorrect={false}
            autoCapitalize="none"
          />
        </ScrollView>

        <View style={styles.buttons}>
          <Button
            title={t.import.clear}
            onPress={handleClear}
            variant="outline"
            style={styles.button}
          />
          <Button
            title={t.import.import}
            onPress={handleImport}
            variant="primary"
            style={styles.button}
            loading={loading}
          />
        </View>

        <Button
          title={t.common.cancel}
          onPress={handleCancel}
          variant="outline"
          style={styles.cancelButton}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    maxHeight: '80%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
    lineHeight: 20,
  },
  jsonContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    maxHeight: 200,
  },
  jsonInput: {
    padding: 12,
    fontSize: 12,
    fontFamily: 'monospace',
    minHeight: 150,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    width: '100%',
  },
});
