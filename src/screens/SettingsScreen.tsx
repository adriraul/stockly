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
import { databaseService } from '../services/database/database';
import { settingsRepository } from '../services/repositories/settings';
import { useTranslations } from '../utils/i18n';

const SettingsScreenSimplified: React.FC = () => {
  const t = useTranslations();
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
      Alert.alert(t.common.error, 'No se pudo guardar la configuración');
    }
  };

  const handleReset = () => {
    Alert.alert(t.settings.resetConfirmation, t.settings.resetMessage, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.settings.reset,
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
            Alert.alert(
              t.common.error,
              'No se pudo restablecer la configuración',
            );
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t.settings.title}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t.common.loading}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.settings.title}</Text>
        <Text style={styles.subtitle}>{t.settings.subtitle}</Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.expiryAlerts}</Text>

          <View style={styles.setting}>
            <Text style={styles.settingLabel}>{t.settings.expiryDays}</Text>
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
              keyboardType="number-pad"
              style={styles.numberInput}
              placeholder="Ej: 3"
            />
            <Text style={styles.settingDescription}>
              {t.settings.expiryDaysDescription}
            </Text>
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.notifications}</Text>

          <View style={styles.setting}>
            <View style={styles.switchContainer}>
              <Text style={styles.settingLabel}>
                {t.settings.lowStockAlerts}
              </Text>
              <Switch
                value={lowStockAlert}
                onValueChange={setLowStockAlert}
                trackColor={{ false: '#e2e8f0', true: '#0369a1' }}
                thumbColor={lowStockAlert ? '#ffffff' : '#ffffff'}
              />
            </View>
            <Text style={styles.settingDescription}>
              {t.settings.lowStockAlertsDescription}
            </Text>
          </View>

          <View style={styles.setting}>
            <View style={styles.switchContainer}>
              <Text style={styles.settingLabel}>
                {t.settings.notificationsEnabled}
              </Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#e2e8f0', true: '#0369a1' }}
                thumbColor={notificationsEnabled ? '#ffffff' : '#ffffff'}
              />
            </View>
            <Text style={styles.settingDescription}>
              {t.settings.notificationsEnabledDescription}
            </Text>
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.data}</Text>

          <View style={styles.setting}>
            <Text style={styles.settingLabel}>{t.settings.appInformation}</Text>
            <Text style={styles.appInfo}>{t.settings.appInfo}</Text>
          </View>
        </Card>

        <View style={styles.actions}>
          <Button
            title={t.settings.save}
            onPress={handleSave}
            variant="primary"
            style={styles.actionButton}
          />
          <Button
            title={t.settings.reset}
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
