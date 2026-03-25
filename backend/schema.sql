-- ============================================
-- Smart Parking SaaS - PostgreSQL Schema
-- ============================================
-- Run with: psql -U postgres -f backend/schema.sql

-- 1) Create database (run as superuser if needed)
-- CREATE DATABASE smart_park_saas;
-- \c smart_park_saas

-- 2) Tables

-- Companies (tenants)
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10,8) DEFAULT NULL,
  longitude DECIMAL(11,8) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'customer' CHECK (role IN ('super_admin', 'company_admin', 'customer')),
  tenant_id INT REFERENCES companies(id),
  company_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Slots
CREATE TABLE IF NOT EXISTS slots (
  id SERIAL PRIMARY KEY,
  tenant_id INT NOT NULL REFERENCES companies(id),
  slot_number VARCHAR(50) NOT NULL,
  floor VARCHAR(50),
  type VARCHAR(50) DEFAULT 'Car',
  status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
  price_per_hour DECIMAL(8,2) DEFAULT 5.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  tenant_id INT NOT NULL REFERENCES companies(id),
  user_id INT NOT NULL REFERENCES users(id),
  slot_id INT NOT NULL REFERENCES slots(id),
  vehicle_number VARCHAR(50) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  duration INT NOT NULL DEFAULT 1,
  end_time TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  total_amount DECIMAL(8,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  tenant_id INT NOT NULL REFERENCES companies(id),
  booking_id INT NOT NULL REFERENCES bookings(id),
  amount DECIMAL(8,2) NOT NULL,
  method VARCHAR(50) DEFAULT 'card',
  status VARCHAR(50) NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'refunded')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3) Seed data

-- One company / tenant
INSERT INTO companies (name, latitude, longitude)
VALUES ('Downtown Parking Co.', 28.6315, 77.2167)
ON CONFLICT DO NOTHING;

-- Super admin
INSERT INTO users (name, email, password, role, tenant_id, company_name)
SELECT 'Super Admin', 'super@demo.com', 'password', 'super_admin', id, 'Platform'
FROM companies WHERE name = 'Downtown Parking Co.' LIMIT 1
ON CONFLICT (email) DO NOTHING;

-- Company admin
INSERT INTO users (name, email, password, role, tenant_id, company_name)
SELECT 'Company Admin', 'admin@demo.com', 'password', 'company_admin', id, 'Downtown Parking Co.'
FROM companies WHERE name = 'Downtown Parking Co.' LIMIT 1
ON CONFLICT (email) DO NOTHING;

-- Customer
INSERT INTO users (name, email, password, role, tenant_id, company_name)
SELECT 'John Customer', 'user@demo.com', 'password', 'customer', id, 'Downtown Parking Co.'
FROM companies WHERE name = 'Downtown Parking Co.' LIMIT 1
ON CONFLICT (email) DO NOTHING;

-- Demo slots
INSERT INTO slots (tenant_id, slot_number, floor, type, status, price_per_hour)
SELECT id, 'A-01', '1', 'Car', 'available', 5.00 FROM companies WHERE name = 'Downtown Parking Co.' LIMIT 1;
INSERT INTO slots (tenant_id, slot_number, floor, type, status, price_per_hour)
SELECT id, 'A-02', '1', 'Car', 'occupied', 5.00 FROM companies WHERE name = 'Downtown Parking Co.' LIMIT 1;
INSERT INTO slots (tenant_id, slot_number, floor, type, status, price_per_hour)
SELECT id, 'B-01', '2', 'Bike', 'available', 3.00 FROM companies WHERE name = 'Downtown Parking Co.' LIMIT 1;
INSERT INTO slots (tenant_id, slot_number, floor, type, status, price_per_hour)
SELECT id, 'C-01', '3', 'SUV', 'maintenance', 7.00 FROM companies WHERE name = 'Downtown Parking Co.' LIMIT 1;
