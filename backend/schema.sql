-- ============================================
-- Smart Parking SaaS - Database Setup Script
-- ============================================
-- This script will:
-- 1. Create the database `smart_park_saas`
-- 2. Create all required tables
-- 3. Insert a few sample records (one super admin, one company, one company admin, one customer, sample slots)
--
-- How to run (from terminal / MySQL shell):
--   mysql -u your_user -p < backend/schema.sql
--
-- Then in your .env set:
--   DB_NAME=smart_park_saas

-- 1) Create database and use it
CREATE DATABASE IF NOT EXISTS smart_park_saas
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_park_saas;

-- 2) Tables

-- Companies (tenants)
CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10,8) DEFAULT NULL,
  longitude DECIMAL(11,8) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users
-- role values used by backend: 'super_admin', 'company_admin', 'customer'
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'company_admin', 'customer') NOT NULL DEFAULT 'customer',
  tenant_id INT NOT NULL,
  company_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES companies(id)
);

-- Parking slots
CREATE TABLE IF NOT EXISTS slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  slot_number VARCHAR(50) NOT NULL,
  floor VARCHAR(50) NOT NULL,
  type VARCHAR(50) NOT NULL,
  status ENUM('available', 'occupied', 'maintenance') NOT NULL DEFAULT 'available',
  price_per_hour DECIMAL(10,2) NOT NULL DEFAULT 5.00,
  FOREIGN KEY (tenant_id) REFERENCES companies(id)
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  user_id INT NOT NULL,
  slot_id INT NOT NULL,
  vehicle_number VARCHAR(50) NOT NULL,
  start_time DATETIME NOT NULL,
  duration INT NOT NULL,
  end_time DATETIME NULL,
  status ENUM('active', 'completed', 'cancelled') NOT NULL DEFAULT 'active',
  total_amount DECIMAL(10,2) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES companies(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (slot_id) REFERENCES slots(id)
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  booking_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(50) NOT NULL,
  status ENUM('paid', 'pending', 'refunded') NOT NULL DEFAULT 'paid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES companies(id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- 3) Seed data (simple demo)

-- One company / tenant
INSERT INTO companies (name, latitude, longitude)
VALUES ('Downtown Parking Co.', 28.6315, 77.2167)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Capture tenant id (assumes first row)
SET @tenant1 := (SELECT id FROM companies WHERE name = 'Downtown Parking Co.' LIMIT 1);

-- Super admin (global)
INSERT INTO users (name, email, password, role, tenant_id, company_name)
VALUES ('Super Admin', 'super@demo.com', 'password', 'super_admin', @tenant1, 'Platform')
ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role);

-- Company admin
INSERT INTO users (name, email, password, role, tenant_id, company_name)
VALUES ('Company Admin', 'admin@demo.com', 'password', 'company_admin', @tenant1, 'Downtown Parking Co.')
ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role);

-- Customer user
INSERT INTO users (name, email, password, role, tenant_id, company_name)
VALUES ('John Customer', 'user@demo.com', 'password', 'customer', @tenant1, 'Downtown Parking Co.')
ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role);

-- Some demo slots
INSERT INTO slots (tenant_id, slot_number, floor, type, status, price_per_hour)
VALUES
  (@tenant1, 'A-01', '1', 'Car', 'available', 5.00),
  (@tenant1, 'A-02', '1', 'Car', 'occupied', 5.00),
  (@tenant1, 'B-01', '2', 'Bike', 'available', 3.00),
  (@tenant1, 'C-01', '3', 'SUV', 'maintenance', 7.00)
ON DUPLICATE KEY UPDATE price_per_hour = VALUES(price_per_hour);

