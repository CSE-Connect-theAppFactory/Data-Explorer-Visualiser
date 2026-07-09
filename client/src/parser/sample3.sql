-- ============================================================
-- Sample 3: E-commerce CMS (Messier schema for edge-case testing)
-- Week 3 parser stress test
-- ============================================================

-- Users with varied column types and constraints
CREATE TABLE users (
  id         INT          NOT NULL AUTO_INCREMENT,
  username   VARCHAR(50)  NOT NULL UNIQUE,
  email      VARCHAR(255) NOT NULL,
  bio        TEXT,
  is_active  BOOLEAN      DEFAULT TRUE,
  balance    DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Categories (self-referential: a category can have a parent)
CREATE TABLE categories (
  id        INT          NOT NULL AUTO_INCREMENT,
  name      VARCHAR(100) NOT NULL,
  slug      VARCHAR(100) NOT NULL UNIQUE,
  parent_id INT,
  PRIMARY KEY (id),
  CONSTRAINT fk_cat_parent FOREIGN KEY (parent_id) REFERENCES categories(id)
);

-- Products with multiple types and a named FK constraint
CREATE TABLE products (
  id          INT           NOT NULL AUTO_INCREMENT,
  title       VARCHAR(200)  NOT NULL,
  description TEXT,
  price       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  stock_qty   INT           DEFAULT 0,
  is_visible  BOOLEAN       DEFAULT TRUE,
  category_id INT,
  created_by  INT,
  PRIMARY KEY (id),
  CONSTRAINT fk_prod_category FOREIGN KEY (category_id) REFERENCES categories(id),
  CONSTRAINT fk_prod_creator  FOREIGN KEY (created_by)  REFERENCES users(id)
);

-- Orders
CREATE TABLE orders (
  id           INT           NOT NULL AUTO_INCREMENT,
  user_id      INT           NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  status       VARCHAR(20)   DEFAULT 'pending',
  notes        TEXT,
  placed_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Order line items (junction table: orders ↔ products)
CREATE TABLE order_items (
  id         INT           NOT NULL AUTO_INCREMENT,
  order_id   INT           NOT NULL,
  product_id INT           NOT NULL,
  quantity   INT           NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (order_id)   REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Reviews (users review products)
CREATE TABLE reviews (
  id         INT  NOT NULL AUTO_INCREMENT,
  user_id    INT  NOT NULL,
  product_id INT  NOT NULL,
  rating     INT  DEFAULT 5,
  body       TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id)    REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
