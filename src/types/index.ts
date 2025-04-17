
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  avatar_url?: string; // Add this line to include avatar_url
}
