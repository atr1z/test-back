-- Development seed: Mextrack test data

-- Test vehicles
INSERT INTO vehicles (id, user_id, plate, brand, model, year, status)
VALUES 
    ('vehicle_001', 'user_test_001', 'ABC-123', 'Toyota', 'Camry', 2023, 'active'),
    ('vehicle_002', 'user_test_001', 'XYZ-789', 'Honda', 'Civic', 2022, 'active'),
    ('vehicle_003', 'user_test_001', 'DEF-456', 'Ford', 'F-150', 2024, 'maintenance')
ON CONFLICT (id) DO NOTHING;

-- Test tracking data
INSERT INTO tracking (id, vehicle_id, latitude, longitude, speed, heading, timestamp)
VALUES 
    ('tracking_001', 'vehicle_001', 19.0414398, -98.2062727, 45.5, 180.0, NOW() - INTERVAL '1 hour'),
    ('tracking_002', 'vehicle_001', 19.0424398, -98.2072727, 50.2, 185.0, NOW() - INTERVAL '30 minutes'),
    ('tracking_003', 'vehicle_002', 19.0434398, -98.2082727, 35.8, 90.0, NOW() - INTERVAL '15 minutes')
ON CONFLICT (id) DO NOTHING;

-- Test geofence
INSERT INTO geofences (id, user_id, name, type, coordinates, radius, active)
VALUES 
    (
        'geofence_001',
        'user_test_001',
        'Downtown Zone',
        'circle',
        '{"lat": 19.0414398, "lng": -98.2062727}',
        5000.0,
        true
    )
ON CONFLICT (id) DO NOTHING;
