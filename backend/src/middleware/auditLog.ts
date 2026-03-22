import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/AuditLog';
import { AuthRequest } from './authGuard';

export function auditLog(action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE', resource: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Run the actual route FIRST, then log on response finish
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      // Log after response
      if (req.user && res.statusCode < 400) {
        const resourceId = req.params.id || body?.id || body?.farmId || body?.fieldId;
        AuditLog.create({
          userId: req.user.id,
          action,
          resource,
          resourceId: resourceId || 'unknown',
          ipAddress: req.ip || req.socket.remoteAddress || '',
          userAgent: req.headers['user-agent'] || '',
          timestamp: new Date(),
        }).catch(console.error);
      }
      return originalJson(body);
    };
    next();
  };
}
