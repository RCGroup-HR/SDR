/**
 * Utilidad para obtener emojis de banderas basándose en códigos de país ISO
 * Los códigos de país deben estar en formato ISO 3166-1 alpha-2 (DO, US, ES, etc.)
 */

/**
 * Convierte un código de país ISO 3166-1 alpha-2 a emoji de bandera
 * @param countryCode - Código de país de 2 letras (ej: 'DO', 'US', 'ES')
 * @returns Emoji de bandera del país
 */
export const getCountryFlag = (countryCode: string | undefined): string => {
  if (!countryCode || countryCode.length !== 2) {
    return '🏳️'; // Bandera blanca como fallback
  }

  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));

  return String.fromCodePoint(...codePoints);
};

/**
 * Mapa de códigos de país comunes en América Latina y el Caribe
 * para proporcionar nombres completos si es necesario
 */
export const COUNTRY_NAMES: Record<string, string> = {
  'DO': 'República Dominicana',
  'US': 'Estados Unidos',
  'ES': 'España',
  'MX': 'México',
  'CO': 'Colombia',
  'VE': 'Venezuela',
  'AR': 'Argentina',
  'BR': 'Brasil',
  'CL': 'Chile',
  'PE': 'Perú',
  'EC': 'Ecuador',
  'BO': 'Bolivia',
  'PY': 'Paraguay',
  'UY': 'Uruguay',
  'CR': 'Costa Rica',
  'PA': 'Panamá',
  'GT': 'Guatemala',
  'HN': 'Honduras',
  'SV': 'El Salvador',
  'NI': 'Nicaragua',
  'CU': 'Cuba',
  'PR': 'Puerto Rico',
  'HT': 'Haití',
  'JM': 'Jamaica',
  'TT': 'Trinidad y Tobago'
};

/**
 * Obtiene el nombre completo del país basado en su código
 * @param countryCode - Código de país de 2 letras
 * @returns Nombre completo del país o el código si no se encuentra
 */
export const getCountryName = (countryCode: string | undefined): string => {
  if (!countryCode) return '';
  return COUNTRY_NAMES[countryCode.toUpperCase()] || countryCode;
};
