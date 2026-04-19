export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  betaAccess: boolean;
  role: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  user: AuthUser;
}
