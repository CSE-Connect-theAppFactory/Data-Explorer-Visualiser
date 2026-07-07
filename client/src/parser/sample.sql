CREATE TABLE customers (
  id INT PRIMARY KEY,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  email VARCHAR(100),
  signup_date DATE
);

CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  sku VARCHAR(20),
  price INT
);

CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer_id INT,
  product_id INT,
  quantity INT,
  order_date DATE,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

INSERT INTO customers (id, first_name, last_name, email, signup_date) VALUES
(1, 'Alice', 'Nguyen', 'alice.nguyen@example.com', '2024-01-15'),
(2, 'Ben', 'Carter', 'ben.carter@example.com', '2024-02-20'),
(3, 'Chloe', 'Diaz', 'chloe.diaz@example.com', '2024-03-11');

INSERT INTO products (id, name, sku, price) VALUES
(1, 'Wireless Mouse', 'SKU-001', 25),
(2, 'Mechanical Keyboard', 'SKU-002', 75),
(3, 'USB-C Hub', 'SKU-003', 40);

INSERT INTO orders (id, customer_id, product_id, quantity, order_date) VALUES
(1, 1, 2, 1, '2024-04-01'),
(2, 1, 1, 2, '2024-04-03'),
(3, 2, 3, 1, '2024-04-10'),
(4, 3, 2, 1, '2024-04-12');
