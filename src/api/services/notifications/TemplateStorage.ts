import { NotificationTemplate } from './types';

const STORAGE_KEY = 'notification_templates';

export class TemplateStorage {
  public static saveTemplates(templates: NotificationTemplate[]): void {
    // Ne pas sauvegarder les templates pour le moment
    // localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  }

  public static loadTemplates(): NotificationTemplate[] {
    // Ne pas charger les templates pour le moment
    // const saved = localStorage.getItem(STORAGE_KEY);
    // return saved ? JSON.parse(saved) : [];
    return [];
  }

  public static addTemplate(template: NotificationTemplate): void {
    // Ne pas ajouter de template pour le moment
    // const templates = this.loadTemplates();
    // templates.push(template);
    // this.saveTemplates(templates);
  }

  public static updateTemplate(id: string, updates: Partial<NotificationTemplate>): void {
    // Ne pas mettre à jour les templates pour le moment
    // const templates = this.loadTemplates();
    // const index = templates.findIndex(t => t.id === id);
    // if (index !== -1) {
    //   templates[index] = { ...templates[index], ...updates };
    //   this.saveTemplates(templates);
    // }
  }

  public static removeTemplate(id: string): void {
    // Ne pas supprimer les templates pour le moment
    // const templates = this.loadTemplates();
    // const filtered = templates.filter(t => t.id !== id);
    // this.saveTemplates(filtered);
  }

  public static clearTemplates(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}