export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userId: string;
  username: string;
  fullName: string;
  email: string;
  roles: string[];
  mustChangePassword: boolean;
}
