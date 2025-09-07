import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';

import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { inventoryRepository } from '../services/repositories/inventory';
import { productsRepository } from '../services/repositories/products';
import { templateRepository } from '../services/repositories/template';
import { settingsRepository } from '../services/repositories/settings';

const ExportScreen: React.FC = () => {
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [includeTemplate, setIncludeTemplate] = useState(true);
  const [includeSettings, setIncludeSettings] = useState(true);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      
      const [products, inventoryItems, templateItems, settings] = await Promise.all([
        productsRepository.getAll(),
        inventoryRepository.getAll(),
        includeTemplate ? templateRepository.getAll() : [],
        includeSettings ? settingsRepository.getAll() : [],
      ]);

      const exportData = {
        products,
        inventory: inventoryItems,
        template: includeTemplate ? templateItems : undefined,
        settings: includeSettings ? settings : undefined,
        exportDate: new Date().toISOString(),
        version: '1.0.0',
      };

      if (exportFormat === 'json') {
        await exportToJSON(exportData);
      } else {
        await exportToCSV(exportData);
      }

      Alert.alert('Éxito', 'Datos exportados correctamente');
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'No se pudo exportar los datos');
    } finally {
      setExporting(false);
    }
  };

  const exportToJSON = async (data: any) => {
    const jsonString = JSON.stringify(data, null, 2);
    const fileName = `stockly_export_${new Date().toISOString().split('T')[0]}.json`;
    
    // TODO: Implementar descarga real del archivo
    console.log('JSON Export:', jsonString);
    Alert.alert('Exportación JSON', `Archivo: ${fileName}\n\nLos datos se han preparado para descarga.`);
  };

  const exportToCSV = async (data: any) => {
    let csvContent = '';
    
    // Products CSV
    csvContent += 'PRODUCTOS\n';
    csvContent += 'ID,Nombre,Categoría,Unidad,Cantidad Mínima,Cantidad Máxima,Fecha Creación\n';
    data.products.forEach((product: any) => {
      csvContent += `${product.id},${product.name},${product.category},${product.unit},${product.minQuantity},${product.maxQuantity},${product.createdAt}\n`;
    });
    
    csvContent += '\nINVENTARIO\n';
    csvContent += 'ID,Producto ID,Cantidad,Fecha Caducidad,Fecha Compra,Ubicación,Notas\n';
    data.inventory.forEach((item: any) => {
      csvContent += `${item.id},${item.productId},${item.quantity},${item.expiryDate},${item.purchaseDate},${item.location},${item.notes || ''}\n`;
    });

    if (data.template) {
      csvContent += '\nPLANTILLA\n';
      csvContent += 'ID,Producto ID,Cantidad Ideal,Prioridad\n';
      data.template.forEach((item: any) => {
        csvContent += `${item.id},${item.productId},${item.idealQuantity},${item.priority}\n`;
      });
    }

    if (data.settings) {
      csvContent += '\nCONFIGURACIÓN\n';
      csvContent += 'Clave,Valor\n';
      data.settings.forEach((setting: any) => {
        csvContent += `${setting.key},${setting.value}\n`;
      });
    }

    const fileName = `stockly_export_${new Date().toISOString().split('T')[0]}.csv`;
    
    // TODO: Implementar descarga real del archivo
    console.log('CSV Export:', csvContent);
    Alert.alert('Exportación CSV', `Archivo: ${fileName}\n\nLos datos se han preparado para descarga.`);
  };

  const handleImport = () => {
    Alert.alert('Próximamente', 'Función de importación en desarrollo');
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>📤 Exportar Datos</Text>
        <Text style={styles.sectionDescription}>
          Exporta todos tus datos de STOCKLY para hacer copias de seguridad o migrar a otro dispositivo.
        </Text>

        <View style={styles.optionsContainer}>
          <Text style={styles.optionLabel}>Formato de exportación:</Text>
          <View style={styles.radioGroup}>
            <Button
              title="CSV"
              onPress={() => setExportFormat('csv')}
              variant={exportFormat === 'csv' ? 'primary' : 'outline'}
              style={styles.radioButton}
            />
            <Button
              title="JSON"
              onPress={() => setExportFormat('json')}
              variant={exportFormat === 'json' ? 'primary' : 'outline'}
              style={styles.radioButton}
            />
          </View>
        </View>

        <View style={styles.optionsContainer}>
          <Text style={styles.optionLabel}>Incluir en la exportación:</Text>
          <View style={styles.checkboxContainer}>
            <Text style={styles.checkboxText}>✓ Plantilla ideal</Text>
            <Text style={styles.checkboxText}>✓ Configuración</Text>
          </View>
        </View>

        <Button
          title={exporting ? "Exportando..." : "Exportar Datos"}
          onPress={handleExport}
          variant="primary"
          disabled={exporting}
          style={styles.exportButton}
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>📥 Importar Datos</Text>
        <Text style={styles.sectionDescription}>
          Importa datos desde un archivo de exportación anterior.
        </Text>

        <Button
          title="Importar Archivo"
          onPress={handleImport}
          variant="outline"
          style={styles.importButton}
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>ℹ️ Información</Text>
        <Text style={styles.infoText}>
          • Los archivos CSV son compatibles con Excel y Google Sheets{'\n'}
          • Los archivos JSON contienen toda la información en formato estructurado{'\n'}
          • Las exportaciones incluyen la fecha y versión de la aplicación{'\n'}
          • Guarda tus archivos de exportación en un lugar seguro
        </Text>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  card: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 24,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  radioButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  checkboxContainer: {
    paddingLeft: 16,
  },
  checkboxText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  exportButton: {
    width: '100%',
    marginTop: 10,
  },
  importButton: {
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
});

export default ExportScreen;
