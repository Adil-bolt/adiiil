export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'docteur' | 'secretaire';
  photoUrl?: string | null;
  specialite?: string;
  email?: string;
  createdAt: string;
  updatedAt?: string;
}