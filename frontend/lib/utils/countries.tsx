/**
 * Country flag utilities
 * Converts country codes to flag emojis
 */

// Map of common country codes to their names
export const COUNTRY_NAMES: Record<string, string> = {
  'ES': 'España',
  'US': 'Estados Unidos',
  'MX': 'México',
  'AR': 'Argentina',
  'CO': 'Colombia',
  'CL': 'Chile',
  'PE': 'Perú',
  'VE': 'Venezuela',
  'EC': 'Ecuador',
  'GT': 'Guatemala',
  'CU': 'Cuba',
  'BO': 'Bolivia',
  'DO': 'Rep. Dominicana',
  'HN': 'Honduras',
  'PY': 'Paraguay',
  'SV': 'El Salvador',
  'NI': 'Nicaragua',
  'CR': 'Costa Rica',
  'PA': 'Panamá',
  'UY': 'Uruguay',
  'PR': 'Puerto Rico',
  'GB': 'Reino Unido',
  'DE': 'Alemania',
  'FR': 'Francia',
  'IT': 'Italia',
  'PT': 'Portugal',
  'BR': 'Brasil',
  'CA': 'Canadá',
  'AU': 'Australia',
  'JP': 'Japón',
  'CN': 'China',
  'KR': 'Corea del Sur',
  'IN': 'India',
  'RU': 'Rusia',
  'NL': 'Países Bajos',
  'BE': 'Bélgica',
  'SE': 'Suecia',
  'NO': 'Noruega',
  'DK': 'Dinamarca',
  'FI': 'Finlandia',
  'PL': 'Polonia',
  'CH': 'Suiza',
  'AT': 'Austria',
  'IE': 'Irlanda',
  'NZ': 'Nueva Zelanda',
  'SG': 'Singapur',
  'HK': 'Hong Kong',
  'TW': 'Taiwán',
  'TH': 'Tailandia',
  'MY': 'Malasia',
  'PH': 'Filipinas',
  'ID': 'Indonesia',
  'VN': 'Vietnam',
  'ZA': 'Sudáfrica',
  'EG': 'Egipto',
  'NG': 'Nigeria',
  'KE': 'Kenia',
  'MA': 'Marruecos',
  'IL': 'Israel',
  'AE': 'Emiratos Árabes',
  'SA': 'Arabia Saudita',
  'TR': 'Turquía',
  'GR': 'Grecia',
  'CZ': 'República Checa',
  'RO': 'Rumanía',
  'HU': 'Hungría',
  'UA': 'Ucrania',
}

// Reverse map: name -> code (including English names)
const NAME_TO_CODE: Record<string, string> = {
  // Spanish names
  'españa': 'ES',
  'spain': 'ES',
  'estados unidos': 'US',
  'united states': 'US',
  'usa': 'US',
  'méxico': 'MX',
  'mexico': 'MX',
  'argentina': 'AR',
  'colombia': 'CO',
  'chile': 'CL',
  'perú': 'PE',
  'peru': 'PE',
  'venezuela': 'VE',
  'ecuador': 'EC',
  'guatemala': 'GT',
  'cuba': 'CU',
  'bolivia': 'BO',
  'rep. dominicana': 'DO',
  'república dominicana': 'DO',
  'dominican republic': 'DO',
  'honduras': 'HN',
  'paraguay': 'PY',
  'el salvador': 'SV',
  'nicaragua': 'NI',
  'costa rica': 'CR',
  'panamá': 'PA',
  'panama': 'PA',
  'uruguay': 'UY',
  'puerto rico': 'PR',
  'reino unido': 'GB',
  'united kingdom': 'GB',
  'uk': 'GB',
  'alemania': 'DE',
  'germany': 'DE',
  'francia': 'FR',
  'france': 'FR',
  'italia': 'IT',
  'italy': 'IT',
  'portugal': 'PT',
  'brasil': 'BR',
  'brazil': 'BR',
  'canadá': 'CA',
  'canada': 'CA',
  'australia': 'AU',
  'japón': 'JP',
  'japan': 'JP',
  'china': 'CN',
  'corea del sur': 'KR',
  'south korea': 'KR',
  'korea': 'KR',
  'india': 'IN',
  'rusia': 'RU',
  'russia': 'RU',
  'países bajos': 'NL',
  'netherlands': 'NL',
  'holanda': 'NL',
  'holland': 'NL',
  'bélgica': 'BE',
  'belgium': 'BE',
  'suecia': 'SE',
  'sweden': 'SE',
  'noruega': 'NO',
  'norway': 'NO',
  'dinamarca': 'DK',
  'denmark': 'DK',
  'finlandia': 'FI',
  'finland': 'FI',
  'polonia': 'PL',
  'poland': 'PL',
  'suiza': 'CH',
  'switzerland': 'CH',
  'austria': 'AT',
  'irlanda': 'IE',
  'ireland': 'IE',
  'nueva zelanda': 'NZ',
  'new zealand': 'NZ',
  'singapur': 'SG',
  'singapore': 'SG',
  'hong kong': 'HK',
  'taiwán': 'TW',
  'taiwan': 'TW',
  'tailandia': 'TH',
  'thailand': 'TH',
  'malasia': 'MY',
  'malaysia': 'MY',
  'filipinas': 'PH',
  'philippines': 'PH',
  'indonesia': 'ID',
  'vietnam': 'VN',
  'sudáfrica': 'ZA',
  'south africa': 'ZA',
  'egipto': 'EG',
  'egypt': 'EG',
  'nigeria': 'NG',
  'kenia': 'KE',
  'kenya': 'KE',
  'marruecos': 'MA',
  'morocco': 'MA',
  'israel': 'IL',
  'emiratos árabes': 'AE',
  'uae': 'AE',
  'united arab emirates': 'AE',
  'arabia saudita': 'SA',
  'saudi arabia': 'SA',
  'turquía': 'TR',
  'turkey': 'TR',
  'grecia': 'GR',
  'greece': 'GR',
  'república checa': 'CZ',
  'czech republic': 'CZ',
  'czechia': 'CZ',
  'rumanía': 'RO',
  'romania': 'RO',
  'hungría': 'HU',
  'hungary': 'HU',
  'ucrania': 'UA',
  'ukraine': 'UA',
}

/**
 * Try to get a country code from a string (could be code or name)
 */
export function getCountryCode(input: string): string | null {
  if (!input) return null
  
  const trimmed = input.trim()
  
  // If it's already a 2-letter code
  if (trimmed.length === 2 && /^[A-Za-z]{2}$/.test(trimmed)) {
    return trimmed.toUpperCase()
  }
  
  // Try to find by name (case insensitive)
  const normalized = trimmed.toLowerCase()
  return NAME_TO_CODE[normalized] || null
}

/**
 * Convert a 2-letter country code to a flag emoji
 * Works by converting each letter to a regional indicator symbol
 */
export function countryCodeToFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍'
  
  const code = countryCode.toUpperCase()
  const codePoints = [...code].map(char => 
    127397 + char.charCodeAt(0)
  )
  
  return String.fromCodePoint(...codePoints)
}

/**
 * Get flag emoji from any input (code or name)
 */
export function getFlag(input: string): string {
  if (!input) return '🌍'
  
  // First try as a code
  if (input.length === 2) {
    return countryCodeToFlag(input)
  }
  
  // Try to get code from name
  const code = getCountryCode(input)
  if (code) {
    return countryCodeToFlag(code)
  }
  
  return '🌍'
}

/**
 * Get country name from code
 */
export function getCountryName(countryCode: string): string {
  if (!countryCode) return 'Desconocido'
  
  // If it's a 2-letter code, get name from map
  if (countryCode.length === 2) {
    const code = countryCode.toUpperCase()
    return COUNTRY_NAMES[code] || countryCode
  }
  
  // Otherwise return as-is (it's probably already a name)
  return countryCode
}

/**
 * Format country with flag
 */
export function formatCountryWithFlag(countryCode: string): string {
  if (!countryCode) return '🌍 Desconocido'
  const flag = countryCodeToFlag(countryCode)
  const name = getCountryName(countryCode)
  return `${flag} ${name}`
}

/**
 * Country Flag component props
 */
interface CountryFlagProps {
  code: string
  showName?: boolean
  className?: string
}

/**
 * Render a country flag with optional name
 */
export function CountryDisplay({ code, showName = true, className = '' }: CountryFlagProps) {
  const flag = countryCodeToFlag(code)
  const name = getCountryName(code)
  
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="text-base">{flag}</span>
      {showName && <span>{name}</span>}
    </span>
  )
}
