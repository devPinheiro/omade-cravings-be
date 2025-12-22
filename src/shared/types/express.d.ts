import { User } from '../../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      rateLimit?: {
        limit: number;
        remaining: number;
        reset: Date;
        used: number;
      };
    }
  }
}