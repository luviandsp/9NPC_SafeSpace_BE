import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { User } from '@supabase/supabase-js';

declare global {
  namespace Express {
    export interface Request {
      user?: User;
    }
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const jwt = req.headers.authorization?.split(' ')[1];

  const { data, error } = await supabase.auth.getUser(jwt);

  if (error || !data.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  req.user = data.user;
  next();
};

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const jwt = req.headers.authorization?.split(' ')[1];

  const { data, error } = await supabase.auth.getUser(jwt);

  if (error || !data.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const adminRole = data.user.user_metadata?.role;

  if (adminRole !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  req.user = data.user;
  next();
};
