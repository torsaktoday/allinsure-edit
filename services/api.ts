
import { Company, InsurancePlan, Lead, User, CarMake, CarModel, ChatLog, SearchResult } from '../types';
import { SearchFilters } from './searchEngine';

const API_BASE = '/api';

// Helper to handle response
const handleResponse = async (res: Response) => {
    if (!res.ok) {
        // Try to parse error as JSON, fallback to status text
        const error = await res.json().catch(() => ({ error: res.statusText || 'Unknown error' }));
        throw new Error(error.error || error.message || 'Unknown error');
    }
    return res.json();
};

export const api = {
    // --- Setup & Sync ---
    syncDatabase: async (mode: 'SYNC' | 'RESET' = 'SYNC') => {
        // Use POST to trigger a state-changing operation
        return fetch(`${API_BASE}/setup`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode }) 
        }).then(handleResponse);
    },

    // --- Master Data (Users, Companies, Cars) ---
    getMasterData: async () => {
        return fetch(`${API_BASE}/master`).then(handleResponse);
    },
    
    updateMasterData: async (type: 'USER' | 'COMPANY' | 'MAKE' | 'MODEL' | 'KB' | 'SETTING', action: 'CREATE' | 'UPDATE' | 'DELETE', data: any) => {
        return fetch(`${API_BASE}/master`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, action, data })
        }).then(handleResponse);
    },

    // --- Plans ---
    getPlans: async () => {
        return fetch(`${API_BASE}/plans`).then(handleResponse);
    },
    
    savePlan: async (plan: InsurancePlan) => {
        return fetch(`${API_BASE}/plans`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'SAVE', plan })
        }).then(handleResponse);
    },

    deletePlan: async (id: string) => {
        return fetch(`${API_BASE}/plans`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'DELETE', id })
        }).then(handleResponse);
    },

    // NEW: Search Plans via Server-Side PlanKB
    searchPlans: async (criteria: { make: string; model: string; year: string; filters: SearchFilters }): Promise<InsurancePlan[]> => {
        return fetch(`${API_BASE}/plans`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'SEARCH', criteria })
        }).then(handleResponse);
    },

    // --- Leads ---
    getLeads: async () => {
        return fetch(`${API_BASE}/leads`).then(handleResponse);
    },

    saveLead: async (lead: Lead) => {
        return fetch(`${API_BASE}/leads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'SAVE', lead })
        }).then(handleResponse);
    },

    deleteLead: async (id: string) => {
        return fetch(`${API_BASE}/leads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'DELETE', id })
        }).then(handleResponse);
    },

    // --- Chat Logs ---
    getChatLogs: async () => {
        return fetch(`${API_BASE}/chat_logs`).then(handleResponse);
    },

    saveChatLog: async (log: Partial<ChatLog>) => {
        // Send asynchronously without awaiting to not block UI
        fetch(`${API_BASE}/chat_logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ log })
        }).catch(err => console.error("Log error", err));
    },

    // --- Migration Utility ---
    migrateData: async (allData: any) => {
        return fetch(`${API_BASE}/migrate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(allData)
        }).then(handleResponse);
    }
};
