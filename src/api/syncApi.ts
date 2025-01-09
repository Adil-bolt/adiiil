import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface SyncResponse {
  patients: any[];
  appointments: any[];
  supplies: any[];
  absences: any[];
  users: any[];
  payments: any[];
  lastSyncTimestamp: number;
}

export interface SyncRequest {
  changes: {
    patients?: { added: any[]; updated: any[]; deleted: string[] };
    appointments?: { added: any[]; updated: any[]; deleted: string[] };
    supplies?: { added: any[]; updated: any[]; deleted: string[] };
    absences?: { added: any[]; updated: any[]; deleted: string[] };
    users?: { added: any[]; updated: any[]; deleted: string[] };
    payments?: { added: any[]; updated: any[]; deleted: string[] };
  };
  lastSyncTimestamp: number;
}

export const syncApi = {
  // Récupérer les dernières données du serveur
  getLatestData: async (): Promise<SyncResponse> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/sync`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      throw error;
    }
  },

  // Envoyer les modifications au serveur
  sendChanges: async (changes: SyncRequest): Promise<SyncResponse> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/sync`, changes);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'envoi des modifications:', error);
      throw error;
    }
  },

  // Mettre à jour les données
  updateData: async (changes: SyncRequest): Promise<SyncResponse> => {
    try {
      const response = await axios.put(`${API_BASE_URL}/sync`, changes);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des données:', error);
      throw error;
    }
  }
};
