import { Strategy as GoogleStragety } from 'passport-google-oauth2';
import { GoogleProfile } from '../models/google-profile.model';
import prisma from '../db/client';
import { RoleEnum } from '../../constants/auth/rolesEnum';
import { Role } from '@prisma/client';
import { RegistrationTypeEnum } from '../../constants/auth/registrationType.enum';
import { generateUserAccessToken, generateUserRefreshToken } from '../../services/authService';

export const googleStragety = new GoogleStragety(
  {
    clientID: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    scope: ['profile', 'email'],
    callbackURL: 'http://localhost:3000/api/auth/redirect/google'
  },
  async (accessToken, refreshToken, profile: GoogleProfile, done) => {
    try {
      if (!profile) {
        throw new Error('Something went wrong.');
      }

      const user = await prisma.user.findUnique({
        where: {
          email: profile?.email
        },
        include: {
          userRegistrations: {
            select: {
              registrationType: true
            }
          }
        }
      });

      if (!user) {
        const role = (await prisma.role.findFirst({
          where: {
            roleName: RoleEnum.User
          }
        })) as Role;

        const user = await prisma.user.create({
          data: {
            firstName: profile?.given_name,
            lastName: profile?.family_name,
            email: profile?.email,
            password: '',
            userRoles: {
              create: [
                {
                  roleId: role.id
                }
              ]
            },
            userRegistrations: {
              create: {
                registrationType: RegistrationTypeEnum.Google
              }
            }
          }
        });

        const accessToken = await generateUserAccessToken(user?.id);
        const refreshToken = await generateUserRefreshToken(user?.id);

        done(null, {
          refreshToken,
          accessToken
        });

        return;
      }

      const isGoogleRegistrationTypeExist = user?.userRegistrations?.some(
        (u) => u?.registrationType === RegistrationTypeEnum.Google
      );

      if (!isGoogleRegistrationTypeExist) {
        await prisma.userRegistration.create({
          data: {
            userId: user?.id,
            registrationType: RegistrationTypeEnum.Google
          }
        });
      }

      const refreshToken = await generateUserRefreshToken(user?.id);

      done(null, {
        refreshToken
      });
    } catch (err) {
      done(err);
    }
  }
);
