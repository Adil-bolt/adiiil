import * as fs from 'fs';
import * as path from 'path';
import { format, parseISO } from 'date-fns';

interface WhatsAppMessageLog {
  date: string;
  phoneNumber: string;
  message: string;
  status: string;
}

interface ExportData {
  date: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  contact: string;
  city: string;
  message: string;
  whatsappLink: string;
  status: string;
  doctorName?: string;
  clinicName?: string;
  patientPhone?: string;
  appointmentType?: string;
  patientCIN?: string;
  patientMutuelle?: string;
}

export class ExcelService {
  private static readonly DEFAULT_BASE_DIR = 'C:\\Users\\21266\\Desktop\\message whatsApp';
  private static readonly FILE_NAME = 'Envoi message whatsApp.csv';
  private static readonly BACKUP_FILE_NAME = 'backup_message_whatsapp.csv';

  private static createDirectoryIfNotExists(dir: string): boolean {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      return true;
    } catch (error) {
      console.error('Erreur lors de la création du dossier:', error);
      return false;
    }
  }

  private static getFilePath(baseDir: string, isBackup: boolean = false): string {
    return path.join(baseDir, isBackup ? this.BACKUP_FILE_NAME : this.FILE_NAME);
  }

  private static formatDataForCSV(data: ExportData): string {
    // Ajouter des guillemets autour de chaque valeur pour forcer Excel à traiter comme du texte
    return `="${data.date}";="${data.patientName}";="${data.appointmentDate}";="${data.appointmentTime}";="${data.contact}";="${data.city}";="${data.message}";="${data.whatsappLink}";="${data.status}"`;
  }

  private static async writeToFile(filePath: string, content: string): Promise<boolean> {
    try {
      await fs.promises.writeFile(filePath, content, 'utf-8');
      return true;
    } catch (error) {
      console.error(`Erreur d'écriture dans le fichier ${filePath}:`, error);
      return false;
    }
  }

  private static async readFromFile(filePath: string): Promise<string> {
    try {
      if (fs.existsSync(filePath)) {
        return await fs.promises.readFile(filePath, 'utf-8');
      }
      return '';
    } catch (error) {
      console.error(`Erreur de lecture du fichier ${filePath}:`, error);
      return '';
    }
  }

  private static readExistingFile(baseDir: string): WhatsAppMessageLog[] {
    const filePath = this.getFilePath(baseDir);
    console.log('Lecture du fichier:', filePath);

    try {
      if (!fs.existsSync(filePath)) {
        console.log('Le fichier n\'existe pas encore');
        return [];
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      // Ignorer l'en-tête
      const dataLines = lines.slice(1);
      
      console.log('Nombre d\'entrées lues:', dataLines.length);
      return dataLines.map(line => {
        const [date, phoneNumber, message, status] = line.split(';').map(field => field.replace(/^"|"$/g, ''));
        return { date, phoneNumber, message, status };
      });
    } catch (error) {
      console.error('Erreur lors de la lecture du fichier:', error);
      return [];
    }
  }

  public static logWhatsAppMessage(phoneNumber: string, message: string, status: string = 'Envoyé', baseDir: string = this.DEFAULT_BASE_DIR): boolean {
    console.log('Début de l\'enregistrement du message WhatsApp');
    
    try {
      // Créer le dossier
      this.createDirectoryIfNotExists(baseDir);
      console.log('Vérification/création du dossier terminée');

      // Lire les données existantes
      const existingData = this.readExistingFile(baseDir);
      console.log('Données existantes chargées');

      // Ajouter la nouvelle entrée
      const newEntry: WhatsAppMessageLog = {
        date: new Date().toLocaleString('fr-FR'),
        phoneNumber,
        message,
        status
      };

      const updatedData = [...existingData, newEntry];
      console.log('Nouvelle entrée ajoutée');

      // Convertir en format CSV
      const csvContent = [
        'Date;Numéro de téléphone;Message;Statut',
        ...updatedData.map(entry => 
          `"${entry.date}";"${entry.phoneNumber}";"${entry.message}";"${entry.status}"`
        )
      ].join('\n');

      // Sauvegarder le fichier
      const filePath = this.getFilePath(baseDir);
      console.log('Sauvegarde du fichier:', filePath);
      fs.writeFileSync(filePath, csvContent, 'utf-8');

      console.log('Message WhatsApp enregistré avec succès dans le fichier CSV');
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement dans le fichier CSV:', error);
      return false;
    }
  }

  private static formatPhoneNumber(phone: string): string {
    if (!phone) return '';
    
    // Supprimer tous les caractères non numériques
    const cleaned = phone.replace(/\D/g, '');
    
    // Si le numéro commence par '0' et a 10 chiffres (format marocain), le convertir en format international
    if (cleaned.length === 10 && cleaned.startsWith('0')) {
      return '00212' + cleaned.substring(1);
    }
    
    // Si le numéro commence déjà par '00212', le retourner tel quel
    if (cleaned.startsWith('00212')) {
      return cleaned;
    }
    
    // Si le numéro commence par '+212', le convertir en format '00212'
    if (cleaned.startsWith('212')) {
      return '00' + cleaned;
    }
    
    // Par défaut, ajouter '00212' si le numéro a 9 chiffres (sans le 0 initial)
    if (cleaned.length === 9) {
      return '00212' + cleaned;
    }
    
    return cleaned;
  }

  private static formatName(fullName: string): string {
    if (!fullName) return '';
    
    // Diviser en prénom et nom
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) {
      // Si un seul mot, le traiter comme un nom
      return parts[0].toUpperCase();
    }
    
    // Le dernier mot est le nom de famille
    const lastName = parts.pop()?.toUpperCase() || '';
    
    // Le reste est le prénom
    const firstName = parts.map(part => 
      part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    ).join(' ');
    
    return `${firstName} ${lastName}`;
  }

  private static formatDoctorName(fullName: string): string {
    if (!fullName) return '';
    
    // Pour le docteur, on garde le format standard (première lettre en majuscule)
    const words = fullName.toLowerCase().split(' ');
    return words.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  private static replaceMessageVariables(message: string, data: any): string {
    // Définir toutes les variables possibles avec leur formatage
    const variables = {
      patientName: data.patientName || '',
      appointmentDate: data.appointmentDate || '',
      appointmentTime: data.appointmentTime || '',
      doctorName: data.doctorName || '',
      clinicName: data.clinicName || '',
      patientPhone: data.patientPhone || '',
      appointmentType: data.appointmentType || '',
      patientCIN: data.patientCIN || '',
      patientMutuelle: data.patientMutuelle || ''
    };

    // Remplacer toutes les variables dans le message
    let finalMessage = message;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      finalMessage = finalMessage.replace(regex, value);
    });

    return finalMessage;
  }

  private static generateWhatsAppLink(phone: string, message: string): string {
    // Pour le lien WhatsApp, on enlève les deux premiers zéros du numéro
    const formattedPhone = this.formatPhoneNumber(phone).replace(/^00/, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  }

  private static generateMessage(template: string, data: any): string {
    let message = template;
    
    // Remplacer toutes les variables disponibles dans le template
    const variables = {
      '{patientName}': data.patientName || '',
      '{appointmentDate}': data.appointmentDate || '-',
      '{appointmentTime}': data.appointmentTime || '-',
      '{doctorName}': data.doctorName || '-',
      '{clinicName}': data.clinicName || '-',
      '{patientPhone}': data.patientPhone || '-',
      '{appointmentType}': data.appointmentType || '-',
      '{patientCIN}': data.patientCIN || '-',
      '{patientMutuelle}': data.patientMutuelle || '-'
    };

    // Remplacer chaque variable dans le message
    Object.entries(variables).forEach(([key, value]) => {
      message = message.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    });
    
    return message;
  }

  private static generateCSVContent(data: ExportData[]): string {
    const BOM = '\uFEFF';
    const header = 'Date;Nom du patient;Date du RDV;Heure du RDV;Contact;Ville;Message;Lien WhatsApp;Statut\n';
    
    const rows = data.map(row => {
      const formattedPhone = this.formatPhoneNumber(row.contact);
      const formattedName = this.formatName(row.patientName);
      
      const processedMessage = this.replaceMessageVariables(row.message, {
        patientName: formattedName,
        appointmentDate: row.appointmentDate,
        appointmentTime: row.appointmentTime,
        doctorName: this.formatDoctorName(row.doctorName),
        clinicName: row.clinicName,
        patientPhone: formattedPhone,
        appointmentType: row.appointmentType,
        patientCIN: row.patientCIN,
        patientMutuelle: row.patientMutuelle
      });

      // Ajouter des guillemets et un apostrophe pour forcer Excel à traiter le numéro comme du texte
      const phoneForExcel = `"'${formattedPhone}"`;

      return [
        `"${row.date || ''}"`,
        `"${formattedName || ''}"`,
        `"${row.appointmentDate || ''}"`,
        `"${row.appointmentTime || ''}"`,
        phoneForExcel,
        `"${row.city || ''}"`,
        `"${processedMessage || ''}"`,
        `"https://wa.me/${formattedPhone.substring(2)}"`,
        `"${row.status || ''}"`,
      ].join(';');
    }).join('\n');

    return BOM + header + rows;
  }

  public static downloadCSV(data: ExportData[]): void {
    try {
      // Générer le contenu
      const content = this.generateCSVContent(data);
      
      // Créer un blob
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
      
      // Créer un lien de téléchargement
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
      const fileName = `messages_whatsapp_${timestamp}.csv`;
      
      // Créer un élément <a> temporaire
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName;
      
      // Ajouter à la page, cliquer, puis supprimer
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Libérer l'URL
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Erreur lors de la génération du fichier CSV:', error);
      throw new Error('Erreur lors de l\'export');
    }
  }

  private static getDownloadsFolder(): string {
    return path.join(process.env.USERPROFILE || process.env.HOME || '', 'Downloads');
  }

  public static async exportToDownloads(data: ExportData[]): Promise<boolean> {
    try {
      const downloadsPath = this.getDownloadsFolder();
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
      const fileName = `messages_whatsapp_${timestamp}.csv`;
      const filePath = path.join(downloadsPath, fileName);

      // Créer l'en-tête du CSV
      const header = 'Date;Nom du patient;Date du RDV;Heure du RDV;Contact;Ville;Message;Lien WhatsApp;Statut\n';
      
      // Formater les données
      const rows = data.map(this.formatDataForCSV).join('\n');
      
      // Écrire le fichier
      const content = header + rows;
      const success = await this.writeToFile(filePath, content);

      if (success) {
        console.log(`Fichier exporté avec succès vers: ${filePath}`);
      }

      return success;
    } catch (error) {
      console.error('Erreur lors de l\'export vers Téléchargements:', error);
      return false;
    }
  }
}
