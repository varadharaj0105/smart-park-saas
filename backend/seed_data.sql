USE smart_park_saas;

-- Add More Companies
INSERT INTO companies (name) VALUES 
('Uptown Parking Solutions'),
('Metro Park Inc.'),
('Airport Long-term Parking');

-- Capture the new tenant IDs
SET @tenant2 := (SELECT id FROM companies WHERE name = 'Uptown Parking Solutions' LIMIT 1);
SET @tenant3 := (SELECT id FROM companies WHERE name = 'Metro Park Inc.' LIMIT 1);

-- Add Users
INSERT INTO users (name, email, password, role, tenant_id, company_name) VALUES 
('Alice Admin', 'alice@uptown.com', 'password123', 'company_admin', @tenant2, 'Uptown Parking Solutions'),
('Bob User', 'bob@m.com', 'password123', 'customer', @tenant2, 'Uptown Parking Solutions'),
('Charlie Admin', 'charlie@metro.com', 'password123', 'company_admin', @tenant3, 'Metro Park Inc.'),
('Dave User', 'dave@m.com', 'password123', 'customer', @tenant3, 'Metro Park Inc.');

-- Add Slots for Tenant 1 (Downtown Parking Co.)
SET @tenant1 := (SELECT id FROM companies WHERE name = 'Downtown Parking Co.' LIMIT 1);
INSERT INTO slots (tenant_id, slot_number, floor, type, status, price_per_hour) VALUES
(@tenant1, 'A-03', '1', 'Car', 'available', 5.00),
(@tenant1, 'A-04', '1', 'Car', 'available', 5.00),
(@tenant1, 'A-05', '1', 'Car', 'available', 5.00),
(@tenant1, 'B-02', '2', 'Bike', 'available', 3.00),
(@tenant1, 'B-03', '2', 'Bike', 'available', 3.00),
(@tenant1, 'B-04', '2', 'Bike', 'available', 3.00),
(@tenant1, 'C-02', '3', 'SUV', 'available', 7.00),
(@tenant1, 'C-03', '3', 'SUV', 'available', 7.00);


-- Add Slots for Tenant 2 (Uptown)
INSERT INTO slots (tenant_id, slot_number, floor, type, status, price_per_hour) VALUES
(@tenant2, 'L1-01', '1', 'Car', 'available', 6.00),
(@tenant2, 'L1-02', '1', 'Car', 'occupied', 6.00),
(@tenant2, 'L1-03', '1', 'Car', 'available', 6.00),
(@tenant2, 'L2-01', '2', 'SUV', 'available', 8.50),
(@tenant2, 'L2-02', '2', 'Bike', 'available', 4.00);

-- Add Slots for Tenant 3 (Metro)
INSERT INTO slots (tenant_id, slot_number, floor, type, status, price_per_hour) VALUES
(@tenant3, 'P1', 'Ground', 'Car', 'available', 4.50),
(@tenant3, 'P2', 'Ground', 'Car', 'available', 4.50),
(@tenant3, 'P3', 'Ground', 'SUV', 'available', 6.50),
(@tenant3, 'P4', 'Ground', 'Bike', 'available', 2.50);

-- Add Bookings and Payments
-- Find some users and slots to book
SET @user1 := (SELECT id FROM users WHERE email = 'bob@m.com' LIMIT 1);
SET @slot1 := (SELECT id FROM slots WHERE tenant_id = @tenant2 AND slot_number = 'L1-02' LIMIT 1);

-- Active Booking
INSERT INTO bookings (tenant_id, user_id, slot_id, vehicle_number, start_time, duration, status) VALUES
(@tenant2, @user1, @slot1, 'XYZ-1234', DATE_SUB(NOW(), INTERVAL 1 HOUR), 3, 'active');

-- Completed Booking
SET @user2 := (SELECT id FROM users WHERE email = 'user@demo.com' LIMIT 1);
SET @slot2 := (SELECT id FROM slots WHERE tenant_id = @tenant1 AND slot_number = 'A-02' LIMIT 1);

INSERT INTO bookings (tenant_id, user_id, slot_id, vehicle_number, start_time, duration, end_time, status, total_amount) VALUES
(@tenant1, @user2, @slot2, 'DEF-5678', DATE_SUB(NOW(), INTERVAL 4 HOUR), 2, DATE_SUB(NOW(), INTERVAL 2 HOUR), 'completed', 10.00);

SET @booking1 := LAST_INSERT_ID();

INSERT INTO payments (tenant_id, booking_id, amount, method, status) VALUES
(@tenant1, @booking1, 10.00, 'card', 'paid');
