import { Response } from 'express';
import { AuthRequest } from '@mextrack/auth';
import * as trackingService from '../services/tracking.service';
import * as vehicleService from '../services/vehicle.service';
import { successResponse, errorResponse, createdResponse } from '@mextrack/utils';
import { z } from 'zod';

const addTrackingSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed: z.number().optional(),
  altitude: z.number().optional(),
  heading: z.number().min(0).max(360).optional(),
  accuracy: z.number().optional(),
  timestamp: z.string().datetime(),
});

export async function getTrackingData(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    const { vehicleId } = req.params;
    const { limit = '100', startDate, endDate } = req.query;

    // Verify vehicle belongs to user
    const vehicle = await vehicleService.getVehicleById(vehicleId, req.user.id);
    if (!vehicle) {
      return errorResponse(res, 'Vehicle not found', 404);
    }

    const tracking = await trackingService.getTrackingByVehicle(
      vehicleId,
      parseInt(limit as string),
      startDate as string,
      endDate as string
    );

    return successResponse(res, tracking);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch tracking data', 500);
  }
}

export async function addTrackingData(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    const { vehicleId } = req.params;

    // Verify vehicle belongs to user
    const vehicle = await vehicleService.getVehicleById(vehicleId, req.user.id);
    if (!vehicle) {
      return errorResponse(res, 'Vehicle not found', 404);
    }

    const data = addTrackingSchema.parse(req.body);
    const tracking = await trackingService.addTrackingData(vehicleId, data);

    return createdResponse(res, tracking, 'Tracking data added successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(res, 'Validation error', 400, error.errors);
    }
    return errorResponse(res, 'Failed to add tracking data', 500);
  }
}
