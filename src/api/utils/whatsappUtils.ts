import { formatPhoneNumber } from './phoneUtils';
import { ExcelService } from './excelUtils';

interface WhatsAppMessage {
  phoneNumber: string;
  message: string;
  variables?: Record<string, string>;
}

export class WhatsAppService {
  private static formatPhoneNumber(phone: string): string {
    let number = phone.replace(/\D/g, '');
    
    if (number.startsWith('0')) {
      number = '212' + number.substring(1);
    } else if (number.startsWith('212')) {
      number = number;
    } else if (number.length === 9) {
      number = '212' + number;
    }
    
    return number;
  }

  private static validatePhoneNumber(phone: string): boolean {
    const formattedNumber = this.formatPhoneNumber(phone);
    return /^212[5-7]\d{8}$/.test(formattedNumber);
  }

  private static replaceVariables(message: string, variables?: Record<string, string>): string {
    if (!variables) return message;
    
    return Object.entries(variables).reduce((msg, [key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      return msg.replace(regex, value || '');
    }, message);
  }

  public static async sendMessage({ phoneNumber, message, variables }: WhatsAppMessage): Promise<boolean> {
    try {
      console.log('Début de l\'envoi du message WhatsApp');
      
      if (!phoneNumber) {
        console.error('Numéro de téléphone manquant');
        return false;
      }

      if (!this.validatePhoneNumber(phoneNumber)) {
        console.error('Numéro de téléphone invalide:', phoneNumber);
        return false;
      }

      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      const processedMessage = this.replaceVariables(message, variables);
      
      // D'abord, enregistrer dans le fichier CSV
      console.log('Tentative d\'enregistrement dans le fichier CSV');
      const logSuccess = ExcelService.logWhatsAppMessage(phoneNumber, processedMessage);
      
      if (!logSuccess) {
        console.error('Échec de l\'enregistrement dans le fichier CSV');
        return false;
      }

      console.log('Message enregistré avec succès, ouverture de WhatsApp');
      
      // Ensuite, ouvrir WhatsApp
      const encodedMessage = encodeURIComponent(processedMessage);
      const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
      
      // Ouvrir dans un nouvel onglet pour éviter les problèmes de navigation
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message WhatsApp:', error);
      return false;
    }
  }

  // Méthode alternative pour ouvrir dans un nouvel onglet si nécessaire
  public static async sendMessageInNewTab({ phoneNumber, message, variables }: WhatsAppMessage): Promise<boolean> {
    try {
      if (!phoneNumber) {
        console.error('Numéro de téléphone manquant');
        return false;
      }

      if (!this.validatePhoneNumber(phoneNumber)) {
        console.error('Numéro de téléphone invalide:', phoneNumber);
        return false;
      }

      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      const processedMessage = this.replaceVariables(message, variables);
      
      // Logger le message dans Excel
      ExcelService.logWhatsAppMessage(phoneNumber, processedMessage);

      // Utiliser wa.me pour un envoi plus direct
      const encodedMessage = encodeURIComponent(processedMessage);
      const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
      
      // Ouvrir dans un nouvel onglet
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message WhatsApp:', error);
      ExcelService.logWhatsAppMessage(phoneNumber, message, 'Échec');
      return false;
    }
  }
}
