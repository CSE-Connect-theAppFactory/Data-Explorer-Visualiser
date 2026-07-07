CREATE TABLE departments (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  budget INT
);

CREATE TABLE employees (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  department_id INT,
  manager_id INT,
  salary INT,
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (manager_id) REFERENCES employees(id)
);

CREATE TABLE projects (
  id INT PRIMARY KEY,
  title VARCHAR(150),
  department_id INT,
  start_date DATE,
  end_date DATE,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE assignments (
  id INT PRIMARY KEY,
  employee_id INT,
  project_id INT,
  hours_allocated INT,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

INSERT INTO departments (id, name, budget) VALUES
(1, 'Engineering', 500000),
(2, 'Marketing', 150000);

INSERT INTO employees (id, name, department_id, manager_id, salary) VALUES
(1, 'Dana Price', 1, NULL, 95000),
(2, 'Evan Shaw', 1, 1, 72000),
(3, 'Fiona Reyes', 2, NULL, 68000);

INSERT INTO projects (id, title, department_id, start_date, end_date) VALUES
(1, 'Platform Migration', 1, '2024-01-01', '2024-06-30'),
(2, 'Brand Refresh', 2, '2024-02-01', '2024-05-01');

INSERT INTO assignments (id, employee_id, project_id, hours_allocated) VALUES
(1, 2, 1, 120),
(2, 1, 1, 40),
(3, 3, 2, 80);
