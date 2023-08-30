import { UserPermissions } from '../constants/auth/permissionsEnum';
import { ResponseStatusEnum } from '../constants/responseStatusEnum';
import { createResponseBody } from '../utils/utils';
import { asyncHandler } from './asyncHandler';
import jwt, { JwtPayload } from 'jsonwebtoken';

export const isAuthenticated = asyncHandler((req, res, next) => {
  const accessToken = req?.headers?.authorization?.split(' ')?.[1];

  if (!accessToken) {
    res.status(401).json(createResponseBody(ResponseStatusEnum.Fail, null, ['Session timed out.']));

    return;
  }

  try {
    const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET as string) as JwtPayload;

    req.decodedToken = decodedToken;

    next();
  } catch (err) {
    res.status(401).json(createResponseBody(ResponseStatusEnum.Fail, null, ['Session timed out.']));

    return;
  }
});

export const isAuthorized = (permissions: Array<UserPermissions>) => {
  return asyncHandler((req, res, next) => {
    const userPermissions = req.decodedToken?.permissions;

    const areAllPermissionsAvailable = permissions?.every((p) => userPermissions?.indexOf(p) !== -1);

    if (areAllPermissionsAvailable) {
      next();
      return;
    }

    res.status(403).json(createResponseBody(ResponseStatusEnum.Fail, null, ['Unauthorized.']));
  });
};
