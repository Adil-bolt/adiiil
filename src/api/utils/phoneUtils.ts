// Liste des villes étrangères et leurs indicatifs
const FOREIGN_CITIES_CODES: { [key: string]: string } = {
  'Paris': '33',
  'Lyon': '33',
  'Marseille': '33',
  'Madrid': '34',
  'Barcelona': '34',
  'London': '44',
  'Manchester': '44',
  // Ajouter d'autres villes au besoin
};

export const formatPhoneNumber = (phoneNumber: string | undefined | null, city?: string | null): string => {
  if (!phoneNumber) return '';

  // Nettoyer le numéro de téléphone (enlever les espaces et les caractères spéciaux)
  let cleanNumber = phoneNumber.replace(/\D/g, '');

  // Si le numéro commence par un seul 0, le retirer
  if (cleanNumber.startsWith('0')) {
    cleanNumber = cleanNumber.substring(1);
  }

  // Si le numéro commence par 00, les retirer
  if (cleanNumber.startsWith('00')) {
    cleanNumber = cleanNumber.substring(2);
  }

  // Si le numéro commence déjà par l'indicatif pays sans +, ajouter le +
  if (cleanNumber.startsWith('212')) {
    return '+' + cleanNumber;
  }

  // Vérifier si la ville est dans la liste des villes étrangères
  if (city && FOREIGN_CITIES_CODES[city]) {
    return '+' + FOREIGN_CITIES_CODES[city] + cleanNumber;
  }

  // Par défaut, utiliser l'indicatif du Maroc
  return '+212' + cleanNumber;
};

// Fonction pour formater le numéro spécifiquement pour l'API WhatsApp
export const formatPhoneForWhatsApp = (phoneNumber: string | undefined | null, city?: string | null): string => {
  // Utiliser le même format que formatPhoneNumber (avec le +)
  return formatPhoneNumber(phoneNumber, city);
};
