import { Response } from 'express';
import { AuthRequest } from '@mextrack/auth';
import * as vehicleService from '../services/vehicle.service';
import { successResponse, errorResponse, createdResponse } from '@mextrack/utils';
import { z } from 'zod';

const createVehicleSchema = z.object({
  plate: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  vin: z.string().optional(),
  color: z.string().optional(),
  notes: z.string().optional(),
});

const updateVehicleSchema = createVehicleSchema.partial();

export async function getVehicles(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    const vehicles = await vehicleService.getVehiclesByUserId(req.user.id);
    return successResponse(res, vehicles);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch vehicles', 500);
  }
}

export async function getVehicle(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    const vehicle = await vehicleService.getVehicleById(req.params.id, req.user.id);

    if (!vehicle) {
      return errorResponse(res, 'Vehicle not found', 404);
    }

    return successResponse(res, vehicle);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch vehicle', 500);
  }
}

export async function createVehicle(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    const data = createVehicleSchema.parse(req.body);
    const vehicle = await vehicleService.createVehicle(req.user.id, data);

    return createdResponse(res, vehicle, 'Vehicle created successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(res, 'Validation error', 400, error.errors);
    }
    return errorResponse(res, 'Failed to create vehicle', 500);
  }
}

export async function updateVehicle(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    const data = updateVehicleSchema.parse(req.body);
    const vehicle = await vehicleService.updateVehicle(req.params.id, req.user.id, data);

    if (!vehicle) {
      return errorResponse(res, 'Vehicle not found', 404);
    }

    return successResponse(res, vehicle, 'Vehicle updated successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(res, 'Validation error', 400, error.errors);
    }
    return errorResponse(res, 'Failed to update vehicle', 500);
  }
}

export async function deleteVehicle(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    const deleted = await vehicleService.deleteVehicle(req.params.id, req.user.id);

    if (!deleted) {
      return errorResponse(res, 'Vehicle not found', 404);
    }

    return successResponse(res, null, 'Vehicle deleted successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to delete vehicle', 500);
  }
}
