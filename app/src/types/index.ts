export interface Appointment {
  id: number;
  name: string;
  email: string;
  phone?: string;
  service: string;
  barber_name?: string;
  barberId?: number;
  date: string;
  time: string;
  notes?: string;
  created_at?: string;
  status?: string;
}

export interface User {
  id: number;
  username: string;
  role: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: string;
  icon: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface BookingFormData {
  name: string;
  email: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  notes: string;
}

export interface Stats {
  total: number;
  upcoming: number;
  past: number;
}
