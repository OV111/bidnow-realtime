import type { UserDto } from "@shared/types";

export interface MockUser extends UserDto {
  avatarUrl: string | null;
}

const users: Record<string, MockUser> = {
  'u-vahe': { id: 'u-vahe', name: 'Vahe', avatarUrl: 'https://i.pravatar.cc/100?u=u-vahe' },
  'u-selvi': { id: 'u-selvi', name: 'Selvi', avatarUrl: 'https://i.pravatar.cc/100?u=u-selvi' },
  'u-anna': { id: 'u-anna', name: 'Anna', avatarUrl: 'https://i.pravatar.cc/100?u=u-anna' },
  'u-seller': { id: 'u-seller', name: 'Seller', avatarUrl: null },
};

export const mockUsers = Object.values(users)

export function getUser(userId: string): MockUser | null {
  return users[userId] ?? null;
}