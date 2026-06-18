export type Role = 'Admin' | 'Faculty' | 'Student' | 'Librarian' | 'Finance';

export interface UserProfile {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  phone?: string;
  designation?: string;
}

export interface MetricCardData {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
}
