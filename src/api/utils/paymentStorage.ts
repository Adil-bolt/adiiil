import { PaymentData } from '../types/payment';

const STORAGE_KEY = 'payments_data';

class PaymentStorage {
  public static savePayments(payments: Record<string, PaymentData>): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paiements:', error);
    }
  }

  public static loadPayments(): Record<string, PaymentData> {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Erreur lors du chargement des paiements:', error);
      return {};
    }
  }

  public static updatePayment(appointmentId: string, data: PaymentData): void {
    try {
      const payments = this.loadPayments();
      payments[appointmentId] = data;
      this.savePayments(payments);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du paiement:', error);
    }
  }

  public static deletePayment(appointmentId: string): void {
    try {
      const payments = this.loadPayments();
      delete payments[appointmentId];
      this.savePayments(payments);
    } catch (error) {
      console.error('Erreur lors de la suppression du paiement:', error);
    }
  }

  public static clearPayments(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Erreur lors de la suppression des paiements:', error);
    }
  }
}

export default PaymentStorage;
