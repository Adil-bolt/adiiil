export interface CacheConfig {
  ttl: number; // Time To Live en millisecondes
  maxSize?: number; // Taille maximale du cache
}

export class CacheService {
  private static instance: CacheService;
  private cache: Map<string, { data: any; timestamp: number }>;
  private config: CacheConfig;

  private constructor(config: CacheConfig) {
    this.cache = new Map();
    this.config = config;
  }

  static getInstance(config: CacheConfig = { ttl: 5 * 60 * 1000 }): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService(config);
    }
    return CacheService.instance;
  }

  set(key: string, data: any): void {
    this.cleanup(); // Nettoyer les entrées expirées

    if (this.config.maxSize && this.cache.size >= this.config.maxSize) {
      // Supprimer l'entrée la plus ancienne si le cache est plein
      const oldestKey = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Vérifier si l'entrée est expirée
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    return this.cache.has(key) && !this.isExpired(key);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private isExpired(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;
    return Date.now() - entry.timestamp > this.config.ttl;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Méthodes utilitaires pour le cache
  getSize(): number {
    return this.cache.size;
  }

  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  getStats(): { size: number; oldestEntry: number; newestEntry: number } {
    const entries = Array.from(this.cache.values());
    if (entries.length === 0) {
      return { size: 0, oldestEntry: 0, newestEntry: 0 };
    }

    const timestamps = entries.map(entry => entry.timestamp);
    return {
      size: this.cache.size,
      oldestEntry: Math.min(...timestamps),
      newestEntry: Math.max(...timestamps)
    };
  }
}
