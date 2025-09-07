import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';

import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { settingsRepository } from '../services/repositories/settings';

const SettingsScreen: React.FC = () => {
  const [expiryAlertDays, setExpiryAlertDays] = useState(3);
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useFocusEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [alertDays, lowStock, notifications] = await Promise.all([
        settingsRepository.getExpiryAlertDays(),
        settingsRepository.getLowStockAlert(),
        settingsRepository.getNotificationsEnabled(),
      ]);

      setExpiryAlertDays(alertDays);
      setLowStockAlert(lowStock);
      setNotificationsEnabled(notifications);
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'No se pudo cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await Promise.all([
        settingsRepository.setExpiryAlertDays(expiryAlertDays),
        settingsRepository.setLowStockAlert(lowStockAlert),
        settingsRepository.setNotificationsEnabled(notificationsEnabled),
      ]);

      Alert.alert('Éxito', 'Configuración guardada correctamente');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'No se pudo guardar la configuración');
    }
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Restablecer Configuración',
      '¿Estás seguro de que quieres restablecer toda la configuración a los valores por defecto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: () => {
            setExpiryAlertDays(3);
            setLowStockAlert(true);
            setNotificationsEnabled(true);
            Alert.alert('Éxito', 'Configuración restablecida');
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Eliminar Todos los Datos',
      '⚠️ ADVERTENCIA: Esta acción eliminará TODOS los datos de la aplicación y no se puede deshacer.\n\n¿Estás completamente seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar Todo',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Próximamente', 'Función de eliminación de datos en desarrollo');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando configuración...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Alertas y Notificaciones */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>🔔 Alertas y Notificaciones</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Días de alerta de caducidad</Text>
            <Text style={styles.settingDescription}>
              Recibe alertas cuando los productos estén próximos a caducar
            </Text>
          </View>
          <Input
            value={expiryAlertDays.toString()}
            onChangeText={(text) => setExpiryAlertDays(parseInt(text) || 3)}
            keyboardType="numeric"
            style={styles.numberInput}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Alertas de stock bajo</Text>
            <Text style={styles.settingDescription}>
              Recibe alertas cuando el stock esté por debajo del mínimo
            </Text>
          </View>
          <Switch
            value={lowStockAlert}
            onValueChange={setLowStockAlert}
            trackColor={{ false: '#e2e8f0', true: '#0369a1' }}
            thumbColor={lowStockAlert ? '#ffffff' : '#f4f4f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Notificaciones habilitadas</Text>
            <Text style={styles.settingDescription}>
              Permite que la aplicación envíe notificaciones
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#e2e8f0', true: '#0369a1' }}
            thumbColor={notificationsEnabled ? '#ffffff' : '#f4f4f4'}
          />
        </View>
      </Card>

      {/* Acciones */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>⚙️ Acciones</Text>
        
        <Button
          title="💾 Guardar Configuración"
          onPress={handleSaveSettings}
          variant="primary"
          style={styles.actionButton}
        />

        <Button
          title="🔄 Restablecer Configuración"
          onPress={handleResetSettings}
          variant="outline"
          style={styles.actionButton}
        />
      </Card>

      {/* Información de la App */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>ℹ️ Información</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Versión</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Desarrollado por</Text>
          <Text style={styles.infoValue}>STOCKLY Team</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Tipo de aplicación</Text>
          <Text style={styles.infoValue}>Inventario personal</Text>
        </View>
      </Card>

      {/* Zona de Peligro */}
      <Card style={[styles.card, styles.dangerCard]}>
        <Text style={styles.dangerTitle}>⚠️ Zona de Peligro</Text>
        
        <Button
          title="🗑️ Eliminar Todos los Datos"
          onPress={handleClearData}
          variant="danger"
          style={styles.dangerButton}
        />
        
        <Text style={styles.dangerText}>
          Esta acción eliminará permanentemente todos los productos, inventario, plantillas y configuración.
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
  card: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  numberInput: {
    width: 80,
    textAlign: 'center',
  },
  actionButton: {
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#374151',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  dangerCard: {
    borderColor: '#dc2626',
    borderWidth: 1,
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 16,
  },
  dangerButton: {
    marginBottom: 12,
  },
  dangerText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SettingsScreen;
