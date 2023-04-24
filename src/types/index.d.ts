import * as jwt from 'jsonwebtoken';
import { UserPermissions } from '../constants/permissionsEnum';

declare global {
  namespace Express {
    interface Request {
      decodedToken: {
        userId: number;
        permissions: Array<UserPermissions>
      };
    }
  }
}
declare module 'jsonwebtoken' {
  export interface JwtPayload {
    userId: number;
    permissions: Array<UserPermissions>
  }
}
