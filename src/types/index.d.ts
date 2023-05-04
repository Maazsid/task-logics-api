import { UserPermissions } from '../constants/permissionsEnum';
import { ParsedQueryParams } from '../interfaces/models/parsed-query-params.model';

declare global {
  namespace Express {
    interface Request {
      decodedToken: {
        userId: number;
        permissions: Array<UserPermissions>;
      };
      parsedQueryParams?: ParsedQueryParams;
    }
  }
}
declare module 'jsonwebtoken' {
  export interface JwtPayload {
    userId: number;
    permissions: Array<UserPermissions>;
  }
}
