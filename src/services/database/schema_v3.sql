-- Schema simplificado para StocklyApp v3
-- Un solo registro por producto con stock total y fecha de caducidad

-- Tabla de productos (simplificada)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  currentStock INTEGER DEFAULT 0,
  expiryDate TEXT, -- Fecha de caducidad del stock más antiguo
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Tabla de plantillas (sin cambios)
CREATE TABLE IF NOT EXISTS template (
  id TEXT PRIMARY KEY,
  productId TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  createdAt TEXT NOT NULL,
  FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE
);

-- Tabla de historial de movimientos (opcional, para auditoría)
CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  productId TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('add', 'remove', 'expired')),
  quantity INTEGER NOT NULL,
  reason TEXT,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE
);
