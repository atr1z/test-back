import { sql } from '@mextrack/database';
import { nanoid } from 'nanoid';

interface CreateVehicleData {
  plate: string;
  brand: string;
  model: string;
  year: number;
  vin?: string;
  color?: string;
  notes?: string;
}

interface UpdateVehicleData extends Partial<CreateVehicleData> {}

export async function getVehiclesByUserId(userId: string) {
  return await sql`
    SELECT * FROM vehicles 
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
}

export async function getVehicleById(vehicleId: string, userId: string) {
  const vehicles = await sql`
    SELECT * FROM vehicles 
    WHERE id = ${vehicleId} AND user_id = ${userId}
  `;
  return vehicles[0] || null;
}

export async function createVehicle(userId: string, data: CreateVehicleData) {
  const vehicleId = nanoid(15);

  const vehicles = await sql`
    INSERT INTO vehicles (
      id, user_id, plate, brand, model, year, vin, color, notes
    ) VALUES (
      ${vehicleId}, ${userId}, ${data.plate}, ${data.brand}, 
      ${data.model}, ${data.year}, ${data.vin || null}, 
      ${data.color || null}, ${data.notes || null}
    )
    RETURNING *
  `;

  return vehicles[0];
}

export async function updateVehicle(
  vehicleId: string,
  userId: string,
  data: UpdateVehicleData
) {
  if (Object.keys(data).length === 0) {
    return await getVehicleById(vehicleId, userId);
  }

  const vehicles = await sql`
    UPDATE vehicles 
    SET ${sql(Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined)))}
    WHERE id = ${vehicleId} AND user_id = ${userId}
    RETURNING *
  `;

  return vehicles[0] || null;
}

export async function deleteVehicle(vehicleId: string, userId: string) {
  const result = await sql`
    DELETE FROM vehicles 
    WHERE id = ${vehicleId} AND user_id = ${userId}
    RETURNING id
  `;

  return result.length > 0;
}
