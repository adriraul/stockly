import { databaseService } from '../database/database';
import { Settings } from '../../types';

export class SettingsRepository {
  async getAll(): Promise<Settings[]> {
    const db = databaseService.getDatabase();
    const results = await db.getAllAsync(
      'SELECT * FROM settings ORDER BY key ASC',
    );
    return results as Settings[];
  }

  async getByKey(key: string): Promise<string | null> {
    const db = databaseService.getDatabase();
    const result = await db.getFirstAsync(
      'SELECT value FROM settings WHERE key = ?',
      [key],
    );

    return result?.value || null;
  }

  async set(key: string, value: string): Promise<void> {
    const db = databaseService.getDatabase();
    const now = new Date().toISOString();

    // Check if setting exists
    const existing = await db.getFirstAsync(
      'SELECT id FROM settings WHERE key = ?',
      [key],
    );

    if (existing) {
      // Update existing setting
      await db.runAsync(
        'UPDATE settings SET value = ?, updatedAt = ? WHERE key = ?',
        [value, now, key],
      );
    } else {
      // Create new setting
      const id = `setting_${key}_${Date.now()}`;
      await db.runAsync(
        'INSERT INTO settings (id, key, value, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
        [id, key, value, now, now],
      );
    }
  }

  async delete(key: string): Promise<void> {
    const db = databaseService.getDatabase();
    await db.runAsync('DELETE FROM settings WHERE key = ?', [key]);
  }

  // Helper methods for common settings
  async getExpiryAlertDays(): Promise<number> {
    const value = await this.getByKey('expiryAlertDays');
    return value ? parseInt(value, 10) : 3;
  }

  async setExpiryAlertDays(days: number): Promise<void> {
    await this.set('expiryAlertDays', days.toString());
  }

  async getLowStockAlert(): Promise<boolean> {
    const value = await this.getByKey('lowStockAlert');
    return value === 'true';
  }

  async setLowStockAlert(enabled: boolean): Promise<void> {
    await this.set('lowStockAlert', enabled.toString());
  }

  async getNotificationsEnabled(): Promise<boolean> {
    const value = await this.getByKey('notificationsEnabled');
    return value === 'true';
  }

  async setNotificationsEnabled(enabled: boolean): Promise<void> {
    await this.set('notificationsEnabled', enabled.toString());
  }
}

export const settingsRepository = new SettingsRepository();
