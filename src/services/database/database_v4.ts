import * as SQLite from 'expo-sqlite';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    try {
      console.log('OPEN database: StocklyDB_v4.db');
      this.db = await SQLite.openDatabaseAsync('StocklyDB_v4.db');
      console.log(
        'SQLite.open({"name":"StocklyDB_v4.db","location":"default","dblocation":"nosync"})',
      );

      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const createProductsTable = `
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        currentStock INTEGER DEFAULT 0,
        expiryDate TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `;

    const createTemplateTable = `
      CREATE TABLE IF NOT EXISTS template (
        id TEXT PRIMARY KEY,
        productId TEXT NOT NULL,
        idealQuantity INTEGER NOT NULL DEFAULT 0,
        priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE
      );
    `;

    const createStockMovementsTable = `
      CREATE TABLE IF NOT EXISTS stock_movements (
        id TEXT PRIMARY KEY,
        productId TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('add', 'remove', 'expired')),
        quantity INTEGER NOT NULL,
        reason TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE
      );
    `;

    const createSettingsTable = `
      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `;

    await this.db.execAsync(createProductsTable);
    await this.db.execAsync(createTemplateTable);
    await this.db.execAsync(createStockMovementsTable);
    await this.db.execAsync(createSettingsTable);

    // Insert default settings
    await this.insertDefaultSettings();
  }

  private async insertDefaultSettings(): Promise<void> {
    if (!this.db) return;

    const defaultSettings = [
      { key: 'expiryAlertDays', value: '3' },
      { key: 'lowStockAlert', value: 'true' },
      { key: 'notificationsEnabled', value: 'true' },
    ];

    for (const setting of defaultSettings) {
      const checkQuery = 'SELECT COUNT(*) as count FROM settings WHERE key = ?';
      const result = await this.db.getFirstAsync(checkQuery, [setting.key]);
      const count = result?.count || 0;

      if (count === 0) {
        const insertQuery = `
          INSERT INTO settings (id, key, value, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?)
        `;
        const now = new Date().toISOString();
        const id = `setting_${setting.key}_${Date.now()}`;
        await this.db.runAsync(insertQuery, [
          id,
          setting.key,
          setting.value,
          now,
          now,
        ]);
      }
    }
  }

  getDatabase(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

export const databaseService = new DatabaseService();
