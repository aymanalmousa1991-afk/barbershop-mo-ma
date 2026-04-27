import type { Appointment, BookingFormData, LoginCredentials, AuthResponse, Stats } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper function for API calls
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

// Auth API
export const authAPI = {
  login: (credentials: LoginCredentials) => 
    fetchAPI<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
};

// Appointments API
export const appointmentsAPI = {
  getAll: (params?: { date?: string; future?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append('date', params.date);
    if (params?.future) queryParams.append('future', 'true');
    
    return fetchAPI<{ success: boolean; data: Appointment[] }>(`/appointments?${queryParams.toString()}`);
  },
  
  // Public endpoint to get appointments for a specific date (no auth required)
  getAllPublic: (date: string, barber_name?: string) => {
    const queryParams = new URLSearchParams();
    queryParams.append('date', date);
    if (barber_name) queryParams.append('barber_name', barber_name);
    
    return fetchAPI<{ success: boolean; data: Appointment[] }>(`/appointments/public?${queryParams.toString()}`);
  },
  
  getAvailableSlots: (date: string, barber_name: string, service?: string) => {
    const queryParams = new URLSearchParams();
    queryParams.append('date', date);
    queryParams.append('barber_name', barber_name);
    if (service) queryParams.append('service', service);
    
    return fetchAPI<{ success: boolean; data: { date: string; barber_name: string; availableSlots: string[]; bookedSlots: string[] } }>(
      `/appointments/available-slots?${queryParams.toString()}`
    );
  },
  
  create: (data: BookingFormData & { barber_name?: string }) =>
    fetchAPI<{ success: boolean; message: string; data: Appointment }>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: number, data: Partial<BookingFormData & { barber_name?: string }>) =>
    fetchAPI<{ success: boolean; message: string }>(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: number) =>
    fetchAPI<{ success: boolean; message: string }>(`/appointments/${id}`, {
      method: 'DELETE',
    }),
};

// Stats API
export const statsAPI = {
  get: () => fetchAPI<{ success: boolean; data: { stats: Stats; todayAppointments: Appointment[] } }>('/stats'),
};
