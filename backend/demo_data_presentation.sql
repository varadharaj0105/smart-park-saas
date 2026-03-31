-- ============================================
-- Presentation Demo Data (Run in Neon.tech SQL Editor)
-- ============================================

-- 1. Create Demo Companies
INSERT INTO companies (name, latitude, longitude) VALUES ('Grand Mall Parking', 28.5355, 77.3910);
INSERT INTO companies (name, latitude, longitude) VALUES ('Central Plaza Garage', 28.4595, 77.0266);
INSERT INTO companies (name, latitude, longitude) VALUES ('Silver Towers Parking', 28.7041, 77.1025);
INSERT INTO companies (name, latitude, longitude) VALUES ('Airport Express Parking', 28.5823, 77.2994);

-- 2. Create Slots for Company 2 (Assuming ID 2)
-- Note: You may need to adjust IDs depending on your current Neon table state.
INSERT INTO slots (tenant_id, slot_number, floor, type, status, price_per_hour)
SELECT id, 'L1-01', '1', 'Car', 'available', 5.00 FROM companies WHERE name = 'Grand Mall Parking';
INSERT INTO slots (tenant_id, slot_number, floor, type, status, price_per_hour)
SELECT id, 'L1-02', '1', 'SUV', 'available', 8.00 FROM companies WHERE name = 'Grand Mall Parking';
INSERT INTO slots (tenant_id, slot_number, floor, type, status, price_per_hour)
SELECT id, 'L1-03', '1', 'Bike', 'available', 2.50 FROM companies WHERE name = 'Grand Mall Parking';

-- (And many more...)
-- I'll generate a few representative historical bookings/payments here
-- to ensure graphs look great immediately.

DO $$
DECLARE
    comp_id INT;
    slot_id INT;
    user_id INT;
    i INT;
    day_offset INT;
    start_time TIMESTAMP;
    total_amt DECIMAL;
BEGIN
    -- Get the first customer
    SELECT id INTO user_id FROM users WHERE role = 'customer' LIMIT 1;
    
    FOR comp_id IN (SELECT id FROM companies WHERE name != 'Downtown Parking Co.') LOOP
        -- Add some slots if they don't exist
        FOR i IN 1..10 LOOP
            INSERT INTO slots (tenant_id, slot_number, floor, type, status, price_per_hour)
            VALUES (comp_id, 'S-' || i, '1', 'Car', 'available', 5.00) RETURNING id INTO slot_id;
            
            -- Generate 30 days of data for this slot
            FOR day_offset IN 0..30 LOOP
                -- 2 bookings per day
                FOR i IN 1..2 LOOP
                    start_time := NOW() - (day_offset || ' days')::interval - ((6 + (RANDOM() * 12)) || ' hours')::interval;
                    total_amt := 5.0 * (1 + FLOOR(RANDOM() * 3));
                    
                    INSERT INTO bookings (tenant_id, user_id, slot_id, vehicle_number, start_time, duration, status, total_amount, created_at)
                    VALUES (comp_id, user_id, slot_id, 'DL' || (1000 + FLOOR(RANDOM() * 8000)), start_time, 1, 'completed', total_amt, start_time)
                    RETURNING id INTO i;
                    
                    INSERT INTO payments (tenant_id, booking_id, amount, method, status, created_at)
                    VALUES (comp_id, i, total_amt, 'card', 'paid', start_time);
                END LOOP;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;
