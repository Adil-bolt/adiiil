import { UnifiedRecord } from '../types/unifiedRecord';

export interface RecordVersion {
  id: string;
  recordId: string;
  changes: Partial<UnifiedRecord>;
  source: string;
  timestamp: string;
  userId?: string;
}

export class VersioningService {
  private static readonly VERSION_KEY = 'recordVersions';

  static saveVersion(recordId: string, changes: Partial<UnifiedRecord>, source: string, userId?: string): RecordVersion {
    try {
      const versions = this.getVersions();
      const newVersion: RecordVersion = {
        id: crypto.randomUUID(),
        recordId,
        changes,
        source,
        timestamp: new Date().toISOString(),
        userId
      };

      versions.push(newVersion);
      localStorage.setItem(this.VERSION_KEY, JSON.stringify(versions));
      return newVersion;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la version:', error);
      throw new Error('Impossible de sauvegarder la version');
    }
  }

  static getVersions(): RecordVersion[] {
    try {
      const versionsStr = localStorage.getItem(this.VERSION_KEY);
      return versionsStr ? JSON.parse(versionsStr) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des versions:', error);
      return [];
    }
  }

  static getRecordVersions(recordId: string): RecordVersion[] {
    return this.getVersions()
      .filter(version => version.recordId === recordId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  static getLatestVersion(recordId: string): RecordVersion | null {
    const versions = this.getRecordVersions(recordId);
    return versions.length > 0 ? versions[0] : null;
  }

  static getVersionsBetweenDates(startDate: string, endDate: string): RecordVersion[] {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    return this.getVersions()
      .filter(version => {
        const versionTime = new Date(version.timestamp).getTime();
        return versionTime >= start && versionTime <= end;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  static getVersionsBySource(source: string): RecordVersion[] {
    return this.getVersions()
      .filter(version => version.source === source)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  static clearVersions(): void {
    localStorage.removeItem(this.VERSION_KEY);
  }

  static deleteVersionsOlderThan(date: string): void {
    const threshold = new Date(date).getTime();
    const versions = this.getVersions()
      .filter(version => new Date(version.timestamp).getTime() >= threshold);
    
    localStorage.setItem(this.VERSION_KEY, JSON.stringify(versions));
  }
}
