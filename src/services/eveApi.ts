// EVE Online ESI (EVE Swagger Interface) API Service
import * as Crypto from 'expo-crypto';
import { SCHEMATICS, SchematicInfo } from '@/data/schematics';
import { PI_COMMODITIES } from '@/services/mockData';

// Polyfill btoa and atob for React Native Hermes environment
const b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

if (typeof (globalThis as any).btoa === 'undefined') {
  (globalThis as any).btoa = (input: string): string => {
    let str = input;
    let output = '';
    for (let block = 0, charCode, i = 0, map = b64chars; 
         str.charAt(i | 0) || (map = '=', i % 1); 
         output += map.charAt(63 & block >> 8 - i % 1 * 8)) {
      charCode = str.charCodeAt(i += 3/4);
      if (charCode > 255) {
        throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
      }
      block = block << 8 | charCode;
    }
    return output;
  };
}

if (typeof (globalThis as any).atob === 'undefined') {
  (globalThis as any).atob = (input: string): string => {
    let str = input.replace(/=+$/, '');
    let output = '';
    if (str.length % 4 === 1) {
      throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
    }
    for (let bc = 0, bs = 0, idx = 0, char; (char = str.charAt(idx++)); ) {
      const charIdx = b64chars.indexOf(char);
      if (charIdx === -1) continue;
      bs = bc % 4 ? bs * 64 + charIdx : charIdx;
      if (bc++ % 4) {
        output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
      }
    }
    return output;
  };
}

// Constants for EVE SSO
export const EVE_SSO_AUTH_URL = 'https://login.eveonline.com/v2/oauth/authorize';
export const EVE_SSO_TOKEN_URL = 'https://login.eveonline.com/v2/oauth/token';
export const EVE_IMAGE_SERVER = 'https://images.evetech.net';

// Cache for ESI data to avoid redundant API calls
const TYPE_NAME_CACHE: Record<number, string> = {};
const SCHEMATIC_CACHE: Record<number, SchematicInfo> = {};
const JITA_PRICE_CACHE: Record<number, { buy: number; sell: number; expiry: number }> = {};

// Default config (user can overwrite in settings)
export interface EsiConfig {
  clientId: string;
  redirectUri: string;
}

export const DEFAULT_CONFIG: EsiConfig = {
  clientId: '73ffe18f431a488881e7b7a2ec45bf51', // User's EVE Developer Client ID
  redirectUri: 'picommandcenter://redirect',
};

// Helper for Base64 URL Encoding (required for PKCE)
function base64UrlEncode(base64: string): string {
  return base64
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// Generate code verifier and code challenge for PKCE
export async function generatePkceChallenge(): Promise<{ verifier: string; challenge: string }> {
  // Generate random bytes for verifier (length 43 to 128)
  const randomBytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    randomBytes[i] = Math.floor(Math.random() * 256);
  }
  
  // Convert byte array to hex/base64 string for verifier
  const verifier = base64UrlEncode(
    btoa(Array.from(randomBytes).map(b => String.fromCharCode(b)).join(''))
  );
  
  // Hash the verifier using SHA-256
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  );
  
  const challenge = base64UrlEncode(digest);
  return { verifier, challenge };
}

// Fallback atob for base64 decoding in environments where atob is missing
function decodeBase64(input: string): string {
  try {
    if (typeof atob !== 'undefined') {
      return atob(input);
    }
  } catch (e) {}
  
  const b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const str = input.replace(/=+$/, '');
  let output = '';
  if (str.length % 4 === 1) {
    return '';
  }
  for (let bc = 0, bs = 0, r1, r2, idx = 0, char; (char = str.charAt(idx++)); ) {
    const charIdx = b64chars.indexOf(char);
    if (charIdx === -1) continue;
    bs = bc % 4 ? bs * 64 + charIdx : charIdx;
    if (bc++ % 4) {
      output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
    }
  }
  return output;
}

// Decodes the JWT access token to get Character ID, Name, and Scopes
export function decodeJwt(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payloadEncoded = parts[1];
    let base64 = payloadEncoded.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const decoded = decodeBase64(base64);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding EVE SSO JWT:', error);
    return null;
  }
}

// Build the SSO Authorization URL
export function buildAuthorizeUrl(clientId: string, redirectUri: string, state: string, challenge: string): string {
  const scopes = [
    'esi-planets.manage_planets.v1',
  ].join(' ');
  
  return `${EVE_SSO_URL_BUILD}?response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${clientId}&scope=${encodeURIComponent(scopes)}&state=${state}&code_challenge=${challenge}&code_challenge_method=S256`;
}
// Note: Constant fixes
const EVE_SSO_URL_BUILD = 'https://login.eveonline.com/v2/oauth/authorize';

// Exchange Authorization Code for Access & Refresh Tokens
export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  codeVerifier: string,
  redirectUri: string
): Promise<any> {
  const bodyParams = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    code_verifier: codeVerifier,
    redirect_uri: redirectUri,
  });

  const response = await fetch(EVE_SSO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Host': 'login.eveonline.com',
    },
    body: bodyParams.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed: ${response.status} - ${text}`);
  }

  return response.json();
}

// Refresh an expired Access Token
export async function refreshAccessToken(refreshToken: string, clientId: string): Promise<any> {
  const bodyParams = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
  });

  const response = await fetch(EVE_SSO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Host': 'login.eveonline.com',
    },
    body: bodyParams.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token refresh failed: ${response.status} - ${text}`);
  }

  return response.json();
}

// Fetch Item Type Name from ESI (caches results)
export async function fetchTypeName(typeId: number): Promise<string> {
  // Check static list first
  const staticItem = PI_COMMODITIES.find(i => i.typeId === typeId);
  if (staticItem) return staticItem.name;

  if (TYPE_NAME_CACHE[typeId]) return TYPE_NAME_CACHE[typeId];

  try {
    const response = await fetch(`https://esi.evetech.net/latest/universe/types/${typeId}/?datasource=tranquility`);
    if (response.ok) {
      const data = await response.json();
      TYPE_NAME_CACHE[typeId] = data.name;
      return data.name;
    }
  } catch (error) {
    console.error(`Error resolving type ID ${typeId}:`, error);
  }
  return `Item #${typeId}`;
}

// Fetch Schematic Metadata from ESI (caches results)
export async function fetchSchematic(schematicId: number): Promise<SchematicInfo | null> {
  // Check static list first
  if (SCHEMATICS[schematicId]) return SCHEMATICS[schematicId];
  if (SCHEMATIC_CACHE[schematicId]) return SCHEMATIC_CACHE[schematicId];

  try {
    const response = await fetch(`https://esi.evetech.net/latest/universe/schematics/${schematicId}/?datasource=tranquility`);
    if (response.ok) {
      const data = await response.json();
      
      // Fetch inputs/outputs
      // Note: ESI schema contains schematic_name, cycle_time, inputs, outputs, etc.
      // We will map it to our format
      const schematic: SchematicInfo = {
        schematicId,
        name: data.schematic_name,
        cycleTime: data.cycle_time,
        productId: 0, // Resolve later if needed or placeholder
        inputs: [],
        outputs: []
      };
      
      SCHEMATIC_CACHE[schematicId] = schematic;
      return schematic;
    }
  } catch (error) {
    console.error(`Error resolving schematic ID ${schematicId}:`, error);
  }
  return null;
}

// Fetch Corporation details to display Character's Corporation Name
export async function fetchCorpName(corpId: number): Promise<string> {
  try {
    const response = await fetch(`https://esi.evetech.net/latest/corporations/${corpId}/?datasource=tranquility`);
    if (response.ok) {
      const data = await response.json();
      return data.name;
    }
  } catch (e) {
    console.error('Error fetching corp name:', e);
  }
  return 'Unknown Corp';
}

// Fetch planets belonging to a character
export async function fetchCharacterPlanets(characterId: string, accessToken: string): Promise<any[]> {
  const response = await fetch(`https://esi.evetech.net/latest/characters/${characterId}/planets/?datasource=tranquility`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch planets: ${response.statusText}`);
  }

  return response.json();
}

// Fetch full details of a planetary colony layout
export async function fetchPlanetLayout(characterId: string, planetId: number, accessToken: string): Promise<any> {
  const response = await fetch(`https://esi.evetech.net/latest/characters/${characterId}/planets/${planetId}/?datasource=tranquility`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch planet layout: ${response.statusText}`);
  }

  return response.json();
}

// Fetch Jita 4-4 Buy/Sell prices for a PI item ID
export async function fetchJitaPrices(typeId: number): Promise<{ buy: number; sell: number }> {
  const now = Date.now();
  const cached = JITA_PRICE_CACHE[typeId];
  // Cache for 2 minutes
  if (cached && cached.expiry > now) {
    return { buy: cached.buy, sell: cached.sell };
  }

  try {
    const regionId = 10000002; // The Forge (Jita region)
    const url = `https://esi.evetech.net/latest/markets/${regionId}/orders/?datasource=tranquility&order_type=all&type_id=${typeId}`;
    const response = await fetch(url);
    
    if (response.ok) {
      const orders = await response.json();
      const jitaStationId = 60003760; // Jita IV - Moon 4 - Caldari Navy Assembly Plant
      
      const jitaOrders = orders.filter((o: any) => o.location_id === jitaStationId);
      
      let highestBuy = 0;
      let lowestSell = Infinity;
      
      for (const order of jitaOrders) {
        if (order.is_buy_order) {
          if (order.price > highestBuy) {
            highestBuy = order.price;
          }
        } else {
          if (order.price < lowestSell) {
            lowestSell = order.price;
          }
        }
      }
      
      const buy = highestBuy;
      const sell = lowestSell === Infinity ? 0 : lowestSell;
      
      JITA_PRICE_CACHE[typeId] = {
        buy,
        sell,
        expiry: now + 120000, // 2 minutes
      };
      
      return { buy, sell };
    }
  } catch (error) {
    console.error(`Error fetching prices for typeId ${typeId} from Jita:`, error);
  }

  // Fallback to static base price if API fails
  const fallback = PI_COMMODITIES.find(i => i.typeId === typeId);
  if (fallback) {
    // Return placeholder prices
    return { buy: typeId * 2.5, sell: typeId * 2.7 };
  }
  return { buy: 0, sell: 0 };
}
