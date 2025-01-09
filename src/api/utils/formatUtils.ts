/**
 * Formate un numéro de fiche patient au format "FXX-XXXX"
 * @param input - La chaîne d'entrée au format "nombre-nombre" (ex: "1-1" ou "02-05")
 * @returns La chaîne formatée (ex: "F01-0001") ou "-" si invalide
 */
export function formatFicheNumber(input: string | null | undefined): string {
  if (!input) return '-';

  // Si c'est déjà au format FXX-XXXX
  if (input.match(/^F\d{2}-\d{4}$/)) {
    // Ne pas accepter F00-0000
    if (input === 'F00-0000') return '-';
    return input;
  }

  // Vérifier si l'entrée correspond au format attendu (nombre-nombre)
  const parts = input.split('-');
  if (parts.length !== 2) return '-';

  try {
    // Convertir les parties en nombres et les formater
    const firstPart = parseInt(parts[0], 10);
    const secondPart = parseInt(parts[1], 10);

    // Vérifier si les conversions sont valides
    if (isNaN(firstPart) || isNaN(secondPart)) return '-';

    // Ne pas accepter 0-0
    if (firstPart === 0 && secondPart === 0) return '-';
    // Ne pas accepter les nombres négatifs
    if (firstPart < 0 || secondPart < 0) return '-';
    // Ne pas accepter les nombres trop grands
    if (firstPart > 99 || secondPart > 9999) return '-';

    // Formater avec les zéros de gauche
    const formattedFirst = firstPart.toString().padStart(2, '0');
    const formattedSecond = secondPart.toString().padStart(4, '0');

    // Vérifier une dernière fois qu'on ne génère pas F00-0000
    const result = `F${formattedFirst}-${formattedSecond}`;
    return result === 'F00-0000' ? '-' : result;
  } catch {
    return '-';
  }
}
