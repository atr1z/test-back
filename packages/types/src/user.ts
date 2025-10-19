export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  name: string;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
}

export type UserResponse = Omit<User, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};
