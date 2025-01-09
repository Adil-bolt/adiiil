import { syncApi, SyncRequest, SyncResponse } from '../api/syncApi';

interface PendingChange {
  type: 'add' | 'update' | 'delete';
  entity: 'patients' | 'appointments' | 'supplies' | 'absences' | 'users' | 'payments';
  data: any;
  timestamp: number;
}

class SyncService {
  private pendingChanges: PendingChange[] = [];
  private lastSyncTimestamp: number = 0;
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;

  constructor() {
    // Écouter les changements de connexion
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Charger les modifications en attente du localStorage
    this.loadPendingChanges();
  }

  private handleOnline = async () => {
    this.isOnline = true;
    console.log('Connexion rétablie - Synchronisation des modifications en attente...');
    await this.syncPendingChanges();
  };

  private handleOffline = () => {
    this.isOnline = false;
    console.log('Connexion perdue - Les modifications seront mises en file d\'attente');
  };

  private loadPendingChanges() {
    const savedChanges = localStorage.getItem('pendingChanges');
    if (savedChanges) {
      this.pendingChanges = JSON.parse(savedChanges);
    }
  }

  private savePendingChanges() {
    localStorage.setItem('pendingChanges', JSON.stringify(this.pendingChanges));
  }

  private async syncPendingChanges() {
    if (!this.isOnline || this.syncInProgress || this.pendingChanges.length === 0) {
      return;
    }

    this.syncInProgress = true;

    try {
      // Préparer les modifications pour la synchronisation
      const changes: SyncRequest = {
        changes: {
          patients: { added: [], updated: [], deleted: [] },
          appointments: { added: [], updated: [], deleted: [] },
          supplies: { added: [], updated: [], deleted: [] },
          absences: { added: [], updated: [], deleted: [] },
          users: { added: [], updated: [], deleted: [] },
          payments: { added: [], updated: [], deleted: [] }
        },
        lastSyncTimestamp: this.lastSyncTimestamp
      };

      // Regrouper les modifications par type
      this.pendingChanges.forEach(change => {
        const entityChanges = changes.changes[change.entity];
        if (change.type === 'delete') {
          entityChanges.deleted.push(change.data.id);
        } else if (change.type === 'add') {
          entityChanges.added.push(change.data);
        } else {
          entityChanges.updated.push(change.data);
        }
      });

      // Envoyer les modifications au serveur
      const response = await syncApi.sendChanges(changes);
      
      // Mettre à jour le timestamp de dernière synchronisation
      this.lastSyncTimestamp = response.lastSyncTimestamp;
      
      // Vider la file d'attente des modifications
      this.pendingChanges = [];
      this.savePendingChanges();

      return response;
    } catch (error) {
      console.error('Erreur lors de la synchronisation des modifications en attente:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  public async queueChange(change: PendingChange) {
    this.pendingChanges.push(change);
    this.savePendingChanges();

    if (this.isOnline) {
      await this.syncPendingChanges();
    }
  }

  public async forceSyncNow() {
    if (!this.isOnline) {
      throw new Error('L\'application est hors ligne');
    }

    return this.syncPendingChanges();
  }

  public getConnectionStatus() {
    return {
      isOnline: this.isOnline,
      pendingChangesCount: this.pendingChanges.length,
      lastSyncTimestamp: this.lastSyncTimestamp
    };
  }
}

export const syncService = new SyncService();
