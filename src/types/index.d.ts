import * as jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      decodedToken: {
        userId: number;
      };
    }
  }
}
declare module 'jsonwebtoken' {
  export interface JwtPayload {
    userId: number;
  }
}
