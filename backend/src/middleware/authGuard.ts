import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { redis } from '../db/redis';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    name: string;
    mobile: string;
  };
}

export async function authGuard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication required');
    }

    const token = authHeader.replace('Bearer ', '');

    // Check if token is blacklisted in Redis
    try {
      const isBlacklisted = await redis.get(`blacklist:${token}`);
      if (isBlacklisted) {
        throw new AppError(401, 'Token has been revoked');
      }
    } catch (redisErr) {
      // If Redis is down, allow the request (degraded mode)
    }

    const payload = jwt.verify(token, config.jwtSecret) as any;
    req.user = {
      id: payload.id,
      role: payload.role,
      name: payload.name,
      mobile: payload.mobile,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError(401, 'Invalid or expired token'));
  }
}
