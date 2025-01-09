import { UnifiedRecord } from '../types/unifiedTable';
import { v4 as uuidv4 } from 'uuid';

export class UnifiedTableService {
  private static STORAGE_KEY = 'unified_table_records';

  static loadRecords(): UnifiedRecord[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erreur lors du chargement des enregistrements:', error);
      return [];
    }
  }

  static saveRecords(records: UnifiedRecord[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(records));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des enregistrements:', error);
    }
  }

  static createRecord(data: Omit<UnifiedRecord, 'id' | 'createdAt' | 'updatedAt'>): UnifiedRecord {
    const now = new Date().toISOString();
    const newRecord = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
      status: data.status || 'actif'
    } as UnifiedRecord;

    // Vérification et conversion des données
    if (newRecord.type === 'patient' && !newRecord.antecedents) {
      newRecord.antecedents = { active: false, liste: [] };
    }
    if (newRecord.type === 'appointment' && !newRecord.status) {
      newRecord.status = 'planifié';
    }

    return newRecord;
  }

  static migrateExistingData(): UnifiedRecord[] {
    const records: UnifiedRecord[] = [];
    
    try {
      // Migrer les patients
      const storedPatients = localStorage.getItem('patients');
      if (storedPatients) {
        const patients = JSON.parse(storedPatients);
        patients.forEach((patient: any) => {
          records.push({
            ...patient,
            type: 'patient',
            createdAt: patient.createdAt || new Date().toISOString(),
            updatedAt: patient.updatedAt || new Date().toISOString(),
            status: patient.status || 'actif',
            antecedents: patient.antecedents || { active: false, liste: [] }
          });
        });
      }

      // Migrer les rendez-vous
      const storedAppointments = localStorage.getItem('appointments');
      if (storedAppointments) {
        const appointments = JSON.parse(storedAppointments);
        appointments.forEach((appointment: any) => {
          records.push({
            ...appointment,
            type: 'appointment',
            createdAt: appointment.createdAt || new Date().toISOString(),
            updatedAt: appointment.updatedAt || new Date().toISOString(),
            status: appointment.status || 'planifié'
          });
        });
      }

      // Migrer les paiements
      const storedPayments = localStorage.getItem('payments');
      if (storedPayments) {
        const payments = JSON.parse(storedPayments);
        payments.forEach((payment: any) => {
          records.push({
            ...payment,
            type: 'payment',
            createdAt: payment.createdAt || new Date().toISOString(),
            updatedAt: payment.updatedAt || new Date().toISOString(),
            status: payment.status || 'complété'
          });
        });
      }

      return records;
    } catch (error) {
      console.error('Erreur lors de la migration des données:', error);
      return [];
    }
  }

  static filterRecords(records: UnifiedRecord[], filters: Partial<UnifiedRecord>): UnifiedRecord[] {
    return records.filter(record => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === undefined || value === null) return true;
        if (typeof value === 'object') {
          return JSON.stringify(record[key as keyof UnifiedRecord]) === JSON.stringify(value);
        }
        return record[key as keyof UnifiedRecord] === value;
      });
    });
  }

  static getRecordsByType(records: UnifiedRecord[], type: UnifiedRecord['type']): UnifiedRecord[] {
    return records.filter(record => record.type === type && !record.deleted);
  }

  static getPatientRecords(records: UnifiedRecord[], patientId: string): UnifiedRecord[] {
    return records.filter(record => 
      (record.type === 'appointment' || record.type === 'consultation' || record.type === 'payment') 
      && record.patientId === patientId 
      && !record.deleted
    ).sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt);
      const dateB = new Date(b.date || b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  }

  static getAppointmentRecords(records: UnifiedRecord[], appointmentId: string): UnifiedRecord[] {
    return records.filter(record => 
      record.appointmentId === appointmentId && !record.deleted
    ).sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  }
}
