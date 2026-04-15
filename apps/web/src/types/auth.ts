export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
}

export interface AuthTokenResponse {
  accessToken: string;
  user: AuthUser;
}
