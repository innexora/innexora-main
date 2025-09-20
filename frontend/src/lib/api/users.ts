import { apiClient } from "../api";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "staff";
  hotelName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: "manager" | "staff";
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: "manager" | "staff";
  isActive?: boolean;
}

export interface ResetPasswordData {
  password: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// Get all users (Admin only)
export const getAllUsers = async (): Promise<User[]> => {
  const response = await apiClient.get<ApiResponse<User[]>>("/users");
  if (!response.success) {
    throw new Error(response.message || "Failed to fetch users");
  }
  return (response as any).data || [];
};

// Create a new user (Admin only)
export const createUser = async (userData: CreateUserData): Promise<User> => {
  const response = await apiClient.post<ApiResponse<User>>("/users", userData);
  if (!response.success) {
    throw new Error(response.message || "Failed to create user");
  }
  return (response as any).data!;
};

// Get single user (Admin only)
export const getUser = async (userId: string): Promise<User> => {
  const response = await apiClient.get<ApiResponse<User>>(`/users/${userId}`);
  if (!response.success) {
    throw new Error(response.message || "Failed to fetch user");
  }
  return (response as any).data!;
};

// Update user (Admin only)
export const updateUser = async (
  userId: string,
  userData: UpdateUserData
): Promise<User> => {
  const response = await apiClient.put<ApiResponse<User>>(
    `/users/${userId}`,
    userData
  );
  if (!response.success) {
    throw new Error(response.message || "Failed to update user");
  }
  return (response as any).data!;
};

// Delete user (Admin only)
export const deleteUser = async (userId: string): Promise<void> => {
  const response = await apiClient.delete<ApiResponse>(`/users/${userId}`);
  if (!response.success) {
    throw new Error(response.message || "Failed to delete user");
  }
};

// Reset user password (Admin only)
export const resetUserPassword = async (
  userId: string,
  passwordData: ResetPasswordData
): Promise<void> => {
  const response = await apiClient.put<ApiResponse>(
    `/users/${userId}/reset-password`,
    passwordData
  );
  if (!response.success) {
    throw new Error(response.message || "Failed to reset password");
  }
};
