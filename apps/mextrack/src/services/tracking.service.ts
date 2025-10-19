import { sql } from '@mextrack/database';
import { nanoid } from 'nanoid';

interface AddTrackingData {
  latitude: number;
  longitude: number;
  speed?: number;
  altitude?: number;
  heading?: number;
  accuracy?: number;
  timestamp: string;
}

export async function getTrackingByVehicle(
  vehicleId: string,
  limit: number = 100,
  startDate?: string,
  endDate?: string
) {
  if (startDate && endDate) {
    return await sql`
      SELECT * FROM tracking 
      WHERE vehicle_id = ${vehicleId}
        AND timestamp >= ${startDate}
        AND timestamp <= ${endDate}
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `;
  }

  return await sql`
    SELECT * FROM tracking 
    WHERE vehicle_id = ${vehicleId}
    ORDER BY timestamp DESC
    LIMIT ${limit}
  `;
}

export async function addTrackingData(vehicleId: string, data: AddTrackingData) {
  const trackingId = nanoid(15);

  const tracking = await sql`
    INSERT INTO tracking (
      id, vehicle_id, latitude, longitude, speed, altitude, heading, accuracy, timestamp
    ) VALUES (
      ${trackingId}, ${vehicleId}, ${data.latitude}, ${data.longitude},
      ${data.speed || null}, ${data.altitude || null}, ${data.heading || null},
      ${data.accuracy || null}, ${data.timestamp}
    )
    RETURNING *
  `;

  return tracking[0];
}

export async function getLatestTracking(vehicleId: string) {
  const tracking = await sql`
    SELECT * FROM tracking 
    WHERE vehicle_id = ${vehicleId}
    ORDER BY timestamp DESC
    LIMIT 1
  `;

  return tracking[0] || null;
}
