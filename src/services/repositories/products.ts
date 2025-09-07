import { databaseService } from '../database/database';
import { Product } from '../../types';

export class ProductsRepository {
  async getAll(): Promise<Product[]> {
    const db = databaseService.getDatabase();
    const results = await db.getAllAsync(
      'SELECT * FROM products ORDER BY name ASC',
    );
    return results as Product[];
  }

  async getById(id: string): Promise<Product | null> {
    const db = databaseService.getDatabase();
    const result = await db.getFirstAsync(
      'SELECT * FROM products WHERE id = ?',
      [id],
    );

    return (result as Product) || null;
  }

  async create(
    product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<string> {
    const db = databaseService.getDatabase();
    const id = `product_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO products (id, name, category, unit, minQuantity, maxQuantity, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        product.name,
        product.category,
        product.unit,
        product.minQuantity,
        product.maxQuantity,
        now,
        now,
      ],
    );

    return id;
  }

  async update(
    id: string,
    updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<void> {
    const db = databaseService.getDatabase();
    const now = new Date().toISOString();

    const fields = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = Object.values(updates);

    await db.runAsync(
      `UPDATE products SET ${fields}, updatedAt = ? WHERE id = ?`,
      [...values, now, id],
    );
  }

  async delete(id: string): Promise<void> {
    const db = databaseService.getDatabase();
    await db.runAsync('DELETE FROM products WHERE id = ?', [id]);
  }

  async getByCategory(category: string): Promise<Product[]> {
    const db = databaseService.getDatabase();
    const results = await db.getAllAsync(
      'SELECT * FROM products WHERE category = ? ORDER BY name ASC',
      [category],
    );
    return results as Product[];
  }

  async search(query: string): Promise<Product[]> {
    const db = databaseService.getDatabase();
    const results = await db.getAllAsync(
      'SELECT * FROM products WHERE name LIKE ? OR category LIKE ? ORDER BY name ASC',
      [`%${query}%`, `%${query}%`],
    );
    return results as Product[];
  }
}

export const productsRepository = new ProductsRepository();
