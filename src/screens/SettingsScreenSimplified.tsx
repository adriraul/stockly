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
import { useNavigation } from '@react-navigation/native';
import { databaseService } from '../services/database/database_v4';
import { settingsRepository } from '../services/repositories/settings_simplified';

const SettingsScreenSimplified: React.FC = () => {
  const navigation = useNavigation();
  const [expiryAlertDays, setExpiryAlertDays] = useState(3);
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      await databaseService.init();

      // Cargar configuración desde la base de datos
      const [expiryDays, lowStock, notifications] = await Promise.all([
        settingsRepository.get('expiryAlertDays'),
        settingsRepository.get('lowStockAlert'),
        settingsRepository.get('notificationsEnabled'),
      ]);

      setExpiryAlertDays(expiryDays ? parseInt(expiryDays, 10) : 3);
      setLowStockAlert(lowStock === 'true');
      setNotificationsEnabled(notifications === 'true');

      setLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Guardar configuración en la base de datos
      await Promise.all([
        settingsRepository.set('expiryAlertDays', expiryAlertDays.toString()),
        settingsRepository.set('lowStockAlert', lowStockAlert.toString()),
        settingsRepository.set(
          'notificationsEnabled',
          notificationsEnabled.toString(),
        ),
      ]);

      // Configuración guardada silenciosamente
      console.log(
        'Settings - Días de anticipación guardados:',
        expiryAlertDays,
      );
      navigation.goBack();
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'No se pudo guardar la configuración');
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Restablecer Configuración',
      '¿Estás seguro de que quieres restablecer toda la configuración a los valores por defecto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: async () => {
            setExpiryAlertDays(3);
            setLowStockAlert(true);
            setNotificationsEnabled(true);

            // Guardar valores por defecto
            try {
              await Promise.all([
                settingsRepository.set('expiryAlertDays', '3'),
                settingsRepository.set('lowStockAlert', 'true'),
                settingsRepository.set('notificationsEnabled', 'true'),
              ]);
              // Configuración restablecida silenciosamente
            } catch (error) {
              console.error('Error resetting settings:', error);
              Alert.alert('Error', 'No se pudo restablecer la configuración');
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
          <Text style={styles.title}>Configuración</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando configuración...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Configuración</Text>
        <Text style={styles.subtitle}>Personaliza tu experiencia</Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Alertas de Caducidad</Text>

          <View style={styles.setting}>
            <Text style={styles.settingLabel}>Días de anticipación</Text>
            <Input
              value={expiryAlertDays > 0 ? expiryAlertDays.toString() : ''}
              onChangeText={text => {
                if (text === '') {
                  setExpiryAlertDays(0);
                } else {
                  const num = parseInt(text) || 0;
                  if (num >= 0 && num <= 30) {
                    setExpiryAlertDays(num);
                  }
                }
              }}
              keyboardType="numeric"
              style={styles.numberInput}
              placeholder="3"
            />
            <Text style={styles.settingDescription}>
              Recibe alertas cuando los productos caduquen en los próximos días
            </Text>
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Notificaciones</Text>

          <View style={styles.setting}>
            <View style={styles.switchContainer}>
              <Text style={styles.settingLabel}>Alertas de stock bajo</Text>
              <Switch
                value={lowStockAlert}
                onValueChange={setLowStockAlert}
                trackColor={{ false: '#e2e8f0', true: '#0369a1' }}
                thumbColor={lowStockAlert ? '#ffffff' : '#ffffff'}
              />
            </View>
            <Text style={styles.settingDescription}>
              Recibe notificaciones cuando el stock esté bajo
            </Text>
          </View>

          <View style={styles.setting}>
            <View style={styles.switchContainer}>
              <Text style={styles.settingLabel}>
                Notificaciones habilitadas
              </Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#e2e8f0', true: '#0369a1' }}
                thumbColor={notificationsEnabled ? '#ffffff' : '#ffffff'}
              />
            </View>
            <Text style={styles.settingDescription}>
              Activa o desactiva todas las notificaciones
            </Text>
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Datos</Text>

          <View style={styles.setting}>
            <Text style={styles.settingLabel}>
              Información de la aplicación
            </Text>
            <Text style={styles.appInfo}>
              Stockly v1.0.0{'\n'}
              Creada por Adrián Bravo{'\n'}
              Gestión de inventario simplificada
            </Text>
          </View>
        </Card>

        <View style={styles.actions}>
          <Button
            title="Guardar Cambios"
            onPress={handleSave}
            variant="primary"
            style={styles.actionButton}
          />
          <Button
            title="Restablecer"
            onPress={handleReset}
            variant="outline"
            style={styles.actionButton}
          />
        </View>
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
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  setting: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  settingDescription: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  numberInput: {
    width: 80,
    textAlign: 'center',
  },
  appInfo: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    width: '100%',
  },
});

export default SettingsScreenSimplified;
