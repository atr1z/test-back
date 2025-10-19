-- Migration: Mextrack fleet tracking tables
-- Created at: 2024-01-01

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plate TEXT NOT NULL UNIQUE,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    vin TEXT,
    color TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tracking data table
CREATE TABLE IF NOT EXISTS tracking (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    speed DECIMAL(5, 2),
    altitude DECIMAL(7, 2),
    heading DECIMAL(5, 2),
    accuracy DECIMAL(5, 2),
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Geofences table
CREATE TABLE IF NOT EXISTS geofences (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('circle', 'polygon')),
    coordinates JSONB NOT NULL,
    radius DECIMAL(10, 2),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('speed', 'geofence', 'maintenance', 'custom')),
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    message TEXT NOT NULL,
    metadata JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_tracking_vehicle_id ON tracking(vehicle_id);
CREATE INDEX idx_tracking_timestamp ON tracking(timestamp DESC);
CREATE INDEX idx_tracking_vehicle_timestamp ON tracking(vehicle_id, timestamp DESC);
CREATE INDEX idx_geofences_user_id ON geofences(user_id);
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_vehicle_id ON alerts(vehicle_id);
CREATE INDEX idx_alerts_read ON alerts(read);

-- Triggers for updated_at
CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_geofences_updated_at
    BEFORE UPDATE ON geofences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE vehicles IS 'Fleet vehicles to be tracked';
COMMENT ON TABLE tracking IS 'GPS tracking data for vehicles';
COMMENT ON TABLE geofences IS 'Geographical boundaries for alerts';
COMMENT ON TABLE alerts IS 'System alerts and notifications';
