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
