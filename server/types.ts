export type UserRole = 'active' | 'exec' | 'admin';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}

export interface MemberProfile {
  id: string;
  userId: string;
  name: string;
  photoUrl?: string;
  major?: string;
  gradYear?: number;
  hometown?: string;
  birthday?: string;
  bio?: string;
  linkedin?: string;
  instagram?: string;
  phone?: string;
  pledgeClass?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Update {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  location?: string;
  type: 'general' | 'social' | 'professional' | 'exec' | 'mandatory';
  createdBy: string;
  createdAt: string;
}

export interface DbSchema {
  users: User[];
  profiles: MemberProfile[];
  updates: Update[];
  events: CalendarEvent[];
}
