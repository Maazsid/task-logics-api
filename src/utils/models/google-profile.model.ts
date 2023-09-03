export interface GoogleProfile {
  provider: string;
  sub: string;
  id: string;
  displayName: string;
  name: { givenName: string; familyName: string };
  given_name: string;
  family_name: string;
  email_verified: boolean;
  verified: boolean;
  language: string;
  locale: string;
  email: string;
}
