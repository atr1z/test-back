export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface SessionInfo {
  userId: string;
  email: string;
  name: string;
  expiresAt: Date;
}
