import axios from 'axios';
import type { Member, DashboardStats, Trainer, Payment, User } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth
export const authService = {
    login: async (username: string, password: string) => {
        const { data } = await api.post('/auth/login', { username, password });
        localStorage.setItem('token', data.token);
        return data;
    },
    logout: () => {
        localStorage.removeItem('token');
    },
    getProfile: async () => {
        const { data } = await api.get('/auth/profile');
        return data;
    },
};

// Users (Staff Management - Admin only)
export const userService = {
    getAll: async () => {
        const { data } = await api.get<User[]>('/users');
        return data;
    },
    create: async (user: Partial<User> & { password: string }) => {
        const { data } = await api.post<User>('/users', user);
        return data;
    },
    update: async (id: string, user: Partial<User>) => {
        const { data } = await api.put<User>(`/users/${id}`, user);
        return data;
    },
    delete: async (id: string) => {
        await api.delete(`/users/${id}`);
    },
};

// Members
export const memberService = {
    getAll: async (filters?: { status?: string; search?: string }) => {
        const { data } = await api.get<Member[]>('/members', { params: filters });
        return data;
    },
    getById: async (id: string) => {
        const { data } = await api.get<Member>(`/members/${id}`);
        return data;
    },
    create: async (member: Partial<Member>) => {
        const { data } = await api.post<Member>('/members', member);
        return data;
    },
    update: async (id: string, member: Partial<Member>) => {
        const { data } = await api.put<Member>(`/members/${id}`, member);
        return data;
    },
    verify: (id: string) => api.patch<Member>(`/members/${id}/verify`).then(res => res.data),
    delete: (id: string) => api.delete(`/members/${id}`).then(res => res.data),
    renew: (id: string, data: any) => api.post<Member>(`/members/${id}/renew`, data).then(res => res.data),
};

// Dashboard
export const dashboardService = {
    getStats: () => api.get<DashboardStats & { unverifiedMembersCount: number, recentAdmissions: Member[] }>('/dashboard/stats').then(res => res.data),
    getExpiringMembers: async () => {
        const { data } = await api.get<Member[]>('/dashboard/expiring');
        return data;
    },
    getPendingDues: async () => {
        const { data } = await api.get<Member[]>('/dashboard/pending-dues');
        return data;
    },
    getUnverifiedMembers: () => api.get<Member[]>('/dashboard/unverified').then(res => res.data),
    getAnalytics: () => api.get('/dashboard/analytics').then(res => res.data),
};

// Trainers
export const trainerService = {
    getAll: async () => {
        const { data } = await api.get<Trainer[]>('/trainers');
        return data;
    },
    create: async (trainer: Partial<Trainer>) => {
        const { data } = await api.post<Trainer>('/trainers', trainer);
        return data;
    },
};

// Payments
export const paymentService = {
    getAll: async () => {
        const { data } = await api.get<Payment[]>('/payments');
        return data;
    },
    getByMember: async (memberId: string) => {
        const { data } = await api.get<Payment[]>(`/payments/member/${memberId}`);
        return data;
    },
    create: async (payment: Partial<Payment>) => {
        const { data } = await api.post<Payment>('/payments', payment);
        return data;
    },
};

export default api;
