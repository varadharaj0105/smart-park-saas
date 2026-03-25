-- ============================================
-- Smart Parking SaaS - PostgreSQL Seed Data
-- ============================================

-- Add more companies with coordinates so they appear on the map
INSERT INTO companies (name, latitude, longitude) VALUES
  ('Uptown Parking Solutions', 12.9716, 77.5946),
  ('Metro Park Inc.', 12.9352, 77.6245),
  ('Airport Long-term Parking', 13.1986, 77.7066)
ON CONFLICT DO NOTHING;

-- Add admin and customer users for each company
INSERT INTO users (name, email, password, role, tenant_id, company_name)
SELECT 'Alice Admin', 'alice@uptown.com', '$2a$10$3tKovVvE9eWbAONr.1Z1F.zO78P44f5P4.hDkX6kK/W70x9S35O8G', 'company_admin', id, 'Uptown Parking Solutions'
FROM companies WHERE name = 'Uptown Parking Solutions' LIMIT 1
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (name, email, password, role, tenant_id, company_name)
SELECT 'Bob User', 'bob@m.com', '$2a$10$3tKovVvE9eWbAONr.1Z1F.zO78P44f5P4.hDkX6kK/W70x9S35O8G', 'customer', id, 'Uptown Parking Solutions'
FROM companies WHERE name = 'Uptown Parking Solutions' LIMIT 1
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (name, email, password, role, tenant_id, company_name)
SELECT 'Charlie Admin', 'charlie@metro.com', '$2a$10$3tKovVvE9eWbAONr.1Z1F.zO78P44f5P4.hDkX6kK/W70x9S35O8G', 'company_admin', id, 'Metro Park Inc.'
FROM companies WHERE name = 'Metro Park Inc.' LIMIT 1
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (name, email, password, role, tenant_id, company_name)
SELECT 'Dave User', 'dave@m.com', '$2a$10$3tKovVvE9eWbAONr.1Z1F.zO78P44f5P4.hDkX6kK/W70x9S35O8G', 'customer', id, 'Metro Park Inc.'
FROM companies WHERE name = 'Metro Park Inc.' LIMIT 1
ON CONFLICT (email) DO NOTHING;

-- Slots for Downtown Parking Co.
INSERT INTO slots (tenant_id, slot_number, floor, type, status, price_per_hour)
SELECT id, 'A-03', '1', 'Car', 'available', 5.00 FROM companies WHERE name = 'Downtown Parking Co.' LIMIT 1;
INSERT INTO slots (tenant_id, slot_number, floor, type, status, price_per_hour)
SELECT id, 'B-02', '2', 'Bike', 'available', 3.00 FROM companies WHERE name = 'Downtown Parking Co.' LIMIT 1;
INSERT INTO slots (tenant_id, slot_number, floor, type, status, price_per_hour)
SELECT id, 'C-02', '3', 'SUV', 'available', 7.00 FROM companies WHERE name = 'Downtown Parking Co.' LIMIT 1;

-- Slots for Uptown Parking Solutions
INSERT INTO slots (tenant_id, slot_number, floor, type, status, price_per_hour)
SELECT id, 'L1-01', '1', 'Car', 'available', 6.00 FROM companies WHERE name = 'Uptown Parking Solutions' LIMIT 1;
INSERT INTO slots (tenant_id, slot_number, floor, type, status, price_per_hour)
SELECT id, 'L1-02', '1', 'Car', 'occupied', 6.00 FROM companies WHERE name = 'Uptown Parking Solutions' LIMIT 1;
INSERT INTO slots (tenant_id, slot_number, floor, type, status, price_per_hour)
SELECT id, 'L2-01', '2', 'SUV', 'available', 8.50 FROM companies WHERE name = 'Uptown Parking Solutions' LIMIT 1;

-- Slots for Metro Park Inc.
INSERT INTO slots (tenant_id, slot_number, floor, type, status, price_per_hour)
SELECT id, 'P1', 'Ground', 'Car', 'available', 4.50 FROM companies WHERE name = 'Metro Park Inc.' LIMIT 1;
INSERT INTO slots (tenant_id, slot_number, floor, type, status, price_per_hour)
SELECT id, 'P2', 'Ground', 'Bike', 'available', 2.50 FROM companies WHERE name = 'Metro Park Inc.' LIMIT 1;
