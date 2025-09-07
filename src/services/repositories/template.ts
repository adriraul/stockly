import { databaseService } from '../database/database';
import { TemplateItem } from '../../types';

export class TemplateRepository {
  async getAll(): Promise<TemplateItem[]> {
    const db = databaseService.getDatabase();
    const [results] = await db.runAsync(
      `SELECT t.*, p.name as productName, p.category, p.unit 
       FROM template t 
       JOIN products p ON t.productId = p.id 
       ORDER BY t.priority DESC, p.name ASC`,
    );

    const items: TemplateItem[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      items.push(results.rows.item(i));
    }
    return items;
  }

  async getById(id: string): Promise<TemplateItem | null> {
    const db = databaseService.getDatabase();
    const [results] = await db.runAsync(
      `SELECT t.*, p.name as productName, p.category, p.unit 
       FROM template t 
       JOIN products p ON t.productId = p.id 
       WHERE t.id = ?`,
      [id],
    );

    if (results.rows.length > 0) {
      return results.rows.item(0);
    }
    return null;
  }

  async getByProductId(productId: string): Promise<TemplateItem | null> {
    const db = databaseService.getDatabase();
    const [results] = await db.runAsync(
      `SELECT t.*, p.name as productName, p.category, p.unit 
       FROM template t 
       JOIN products p ON t.productId = p.id 
       WHERE t.productId = ?`,
      [productId],
    );

    if (results.rows.length > 0) {
      return results.rows.item(0);
    }
    return null;
  }

  async create(
    item: Omit<TemplateItem, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<string> {
    const db = databaseService.getDatabase();
    const id = `template_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO template (id, productId, idealQuantity, priority, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, item.productId, item.idealQuantity, item.priority, now, now],
    );

    return id;
  }

  async update(
    id: string,
    updates: Partial<Omit<TemplateItem, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<void> {
    const db = databaseService.getDatabase();
    const now = new Date().toISOString();

    const fields = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = Object.values(updates);

    await db.runAsync(
      `UPDATE template SET ${fields}, updatedAt = ? WHERE id = ?`,
      [...values, now, id],
    );
  }

  async delete(id: string): Promise<void> {
    const db = databaseService.getDatabase();
    await db.runAsync('DELETE FROM template WHERE id = ?', [id]);
  }

  async deleteByProductId(productId: string): Promise<void> {
    const db = databaseService.getDatabase();
    await db.runAsync('DELETE FROM template WHERE productId = ?', [productId]);
  }

  async getByPriority(
    priority: 'high' | 'medium' | 'low',
  ): Promise<TemplateItem[]> {
    const db = databaseService.getDatabase();
    const [results] = await db.runAsync(
      `SELECT t.*, p.name as productName, p.category, p.unit 
       FROM template t 
       JOIN products p ON t.productId = p.id 
       WHERE t.priority = ? 
       ORDER BY p.name ASC`,
      [priority],
    );

    const items: TemplateItem[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      items.push(results.rows.item(i));
    }
    return items;
  }
}

export const templateRepository = new TemplateRepository();
