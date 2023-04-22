import * as jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      decodedToken: {
        userId: string;
      };
    }
  }
}
declare module 'jsonwebtoken' {
  export interface JwtPayload {
    userId: string;
  }
}
