import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  fetchCharacterPlanets, 
  fetchPlanetLayout, 
  fetchJitaPrices, 
  decodeJwt, 
  exchangeCodeForTokens, 
  refreshAccessToken,
  fetchCorpName,
  DEFAULT_CONFIG,
  EVE_IMAGE_SERVER
} from '@/services/eveApi';
import { requestNotificationPermissions, registerBackgroundFetchAsync, MarketAlert, checkAlertsAndNotify } from '@/services/backgroundTracker';
import { MOCK_CHARACTERS, MOCK_PLANETS, BASE_MARKET_PRICES, getSimulatedPrice } from '@/services/mockData';

export interface EsiCharacter {
  id: string;
  name: string;
  corp: string;
  avatarUrl: string;
  rank: string;
  level: number;
  crebits: number;
}

interface EsiContextType {
  characters: EsiCharacter[];
  activeChar: EsiCharacter | null;
  planets: any[];
  planetDetails: Record<number, any>;
  marketPrices: Record<number, { buy: number; sell: number }>;
  alerts: MarketAlert[];
  isLoading: boolean;
  isDemoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  addCharacter: (authCode: string, codeVerifier: string) => Promise<void>;
  removeCharacter: (charId: string) => Promise<void>;
  switchCharacter: (charId: string) => void;
  loadPlanetPins: (planetId: number) => Promise<void>;
  addNewAlert: (typeId: number, itemName: string, price: number, condition: 'above' | 'below', priceType: 'buy' | 'sell') => Promise<void>;
  removeAlert: (alertId: string) => Promise<void>;
  toggleAlert: (alertId: string) => Promise<void>;
  refreshAllData: () => Promise<void>;
  clientId: string;
  redirectUri: string;
  updateEsiConfig: (clientId: string, redirectUri: string) => void;
}

const EsiContext = createContext<EsiContextType | undefined>(undefined);

export const EsiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [characters, setCharacters] = useState<EsiCharacter[]>([]);
  const [activeChar, setActiveChar] = useState<EsiCharacter | null>(null);
  const [planets, setPlanets] = useState<any[]>([]);
  const [planetDetails, setPlanetDetails] = useState<Record<number, any>>({});
  const [marketPrices, setMarketPrices] = useState<Record<number, { buy: number; sell: number }>>({});
  const [alerts, setAlerts] = useState<MarketAlert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true); // Default demo mode true for fallback

  // ESI Config
  const [clientId, setClientId] = useState<string>(DEFAULT_CONFIG.clientId);
  const [redirectUri, setRedirectUri] = useState<string>(DEFAULT_CONFIG.redirectUri);

  // Initialize
  useEffect(() => {
    const initApp = async () => {
      // Request notification permissions
      await requestNotificationPermissions();
      // Register background fetch task
      await registerBackgroundFetchAsync();

      // Load config
      const savedClientId = await AsyncStorage.getItem('esi_client_id');
      const savedRedirectUri = await AsyncStorage.getItem('esi_redirect_uri');
      if (savedClientId) setClientId(savedClientId);
      if (savedRedirectUri) setRedirectUri(savedRedirectUri);

      // Load demo mode state
      const savedDemo = await AsyncStorage.getItem('esi_demo_mode');
      const demoEnabled = savedDemo === null ? true : savedDemo === 'true';
      setIsDemoMode(demoEnabled);

      // Load alerts
      const savedAlerts = await AsyncStorage.getItem('market_alerts');
      if (savedAlerts) {
        setAlerts(JSON.parse(savedAlerts));
      }

      if (!demoEnabled) {
        // Load active characters
        const savedChars = await AsyncStorage.getItem('esi_characters');
        if (savedChars) {
          const charList: EsiCharacter[] = JSON.parse(savedChars);
          setCharacters(charList);
          
          const activeCharId = await AsyncStorage.getItem('esi_active_character_id');
          const found = charList.find(c => c.id === activeCharId) || charList[0] || null;
          setActiveChar(found);
        }
      } else {
        // Initialize Demo Mode data
        setCharacters(MOCK_CHARACTERS);
        setActiveChar(MOCK_CHARACTERS[0]);
      }
    };

    initApp();
  }, []);

  // Update data when active character or demo mode changes
  useEffect(() => {
    refreshAllData();
  }, [activeChar, isDemoMode]);

  // Set up periodic price checks in the foreground (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (isDemoMode) {
        // Simulate price updates
        const updatedPrices = { ...marketPrices };
        alerts.forEach(alert => {
          const sim = getSimulatedPrice(alert.typeId);
          updatedPrices[alert.typeId] = { buy: sim.buyPrice, sell: sim.sellPrice };
        });
        setMarketPrices(updatedPrices);
        
        // Check simulated alerts
        alerts.forEach(async alert => {
          if (!alert.enabled) return;
          const prices = updatedPrices[alert.typeId];
          if (!prices) return;
          const currentPrice = alert.priceType === 'sell' ? prices.sell : prices.buy;
          
          let conditionMet = false;
          if (alert.condition === 'above' && currentPrice >= alert.targetPrice) conditionMet = true;
          if (alert.condition === 'below' && currentPrice <= alert.targetPrice) conditionMet = true;
          
          if (conditionMet) {
            // Trigger local notification
            await checkAlertsAndNotify();
          }
        });
      } else {
        // Real EVE ESI alert checking
        await checkAlertsAndNotify();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [alerts, isDemoMode, marketPrices]);

  // Set Demo Mode
  const setDemoMode = async (enabled: boolean) => {
    setIsDemoMode(enabled);
    await AsyncStorage.setItem('esi_demo_mode', enabled.toString());
    if (enabled) {
      setCharacters(MOCK_CHARACTERS);
      setActiveChar(MOCK_CHARACTERS[0]);
    } else {
      const savedChars = await AsyncStorage.getItem('esi_characters');
      if (savedChars) {
        const charList: EsiCharacter[] = JSON.parse(savedChars);
        setCharacters(charList);
        const activeCharId = await AsyncStorage.getItem('esi_active_character_id');
        const found = charList.find(c => c.id === activeCharId) || charList[0] || null;
        setActiveChar(found);
      } else {
        setCharacters([]);
        setActiveChar(null);
        setPlanets([]);
        setPlanetDetails({});
      }
    }
  };

  // Update ESI configuration
  const updateEsiConfig = async (newClientId: string, newRedirectUri: string) => {
    setClientId(newClientId);
    setRedirectUri(newRedirectUri);
    await AsyncStorage.setItem('esi_client_id', newClientId);
    await AsyncStorage.setItem('esi_redirect_uri', newRedirectUri);
  };

  // Switch Active Character
  const switchCharacter = async (charId: string) => {
    const found = characters.find(c => c.id === charId);
    if (found) {
      setActiveChar(found);
      await AsyncStorage.setItem('esi_active_character_id', charId);
    }
  };

  // Load specific planet pin layouts
  const loadPlanetPins = async (planetId: number) => {
    if (!activeChar) return;
    setIsLoading(true);

    try {
      if (isDemoMode) {
        const allMock = MOCK_PLANETS[activeChar.id] || [];
        const planet = allMock.find(p => p.id === planetId.toString());
        if (planet) {
          setPlanetDetails(prev => ({ ...prev, [planetId]: planet }));
          
          // Preload mock prices
          const prices = { ...marketPrices };
          planet.pins.forEach(pin => {
            if (pin.contents) {
              pin.contents.forEach(item => {
                if (!prices[item.typeId]) {
                  const base = BASE_MARKET_PRICES[item.typeId] || { buy: item.typeId, sell: item.typeId * 1.1 };
                  prices[item.typeId] = base;
                }
              });
            }
          });
          setMarketPrices(prices);
        }
      } else {
        // Real ESI fetch
        const token = await SecureStore.getItemAsync(`token_${activeChar.id}`);
        if (!token) throw new Error('Access token missing. Re-authorization required.');
        
        const layout = await fetchPlanetLayout(activeChar.id, planetId, token);
        setPlanetDetails(prev => ({ ...prev, [planetId]: layout }));

        // Resolve Jita market prices for all items inside this planet
        const prices = { ...marketPrices };
        for (const pin of layout.pins) {
          if (pin.contents) {
            for (const item of pin.contents) {
              if (!prices[item.type_id]) {
                const jitaPrice = await fetchJitaPrices(item.type_id);
                prices[item.type_id] = jitaPrice;
              }
            }
          }
        }
        setMarketPrices(prices);
      }
    } catch (e) {
      console.error('Error fetching planet pins:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh active character's planet list and general pricing cache
  const refreshAllData = async () => {
    if (!activeChar) {
      setPlanets([]);
      setPlanetDetails({});
      return;
    }
    setIsLoading(true);

    try {
      if (isDemoMode) {
        const charPlanets = MOCK_PLANETS[activeChar.id] || [];
        setPlanets(charPlanets.map(p => ({
          planet_id: parseInt(p.id),
          planet_type: p.type.toLowerCase(),
          upgrade_level: p.commandCenterLevel,
          num_pins: p.pins.length
        })));
        
        // Prime prices for all items
        const prices = { ...marketPrices };
        charPlanets.forEach(p => {
          p.pins.forEach(pin => {
            if (pin.contents) {
              pin.contents.forEach(item => {
                const base = BASE_MARKET_PRICES[item.typeId] || { buy: item.typeId, sell: item.typeId * 1.1 };
                prices[item.typeId] = base;
              });
            }
          });
        });
        setMarketPrices(prices);
      } else {
        // Real ESI Fetch
        let token = await SecureStore.getItemAsync(`token_${activeChar.id}`);
        const expiryStr = await AsyncStorage.getItem(`expiry_${activeChar.id}`);
        const expiry = expiryStr ? parseInt(expiryStr) : 0;
        
        if (Date.now() > expiry - 60000) {
          // Token expired, refresh it
          const refreshToken = await SecureStore.getItemAsync(`refresh_${activeChar.id}`);
          if (refreshToken) {
            console.log('Refreshing expired access token for character:', activeChar.name);
            const refreshRes = await refreshAccessToken(refreshToken, clientId);
            token = refreshRes.access_token;
            await SecureStore.setItemAsync(`token_${activeChar.id}`, refreshRes.access_token);
            await AsyncStorage.setItem(`expiry_${activeChar.id}`, (Date.now() + refreshRes.expires_in * 1000).toString());
            if (refreshRes.refresh_token) {
              await SecureStore.setItemAsync(`refresh_${activeChar.id}`, refreshRes.refresh_token);
            }
          }
        }

        if (!token) throw new Error('Auth token not found.');

        const charPlanets = await fetchCharacterPlanets(activeChar.id, token);
        setPlanets(charPlanets);

        // Fetch prices for active alerts
        const prices = { ...marketPrices };
        for (const alert of alerts) {
          if (!prices[alert.typeId]) {
            const jita = await fetchJitaPrices(alert.typeId);
            prices[alert.typeId] = jita;
          }
        }
        setMarketPrices(prices);
      }
    } catch (e) {
      console.error('Error refreshing ESI data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Add character via EVE SSO Code Exchange
  const addCharacter = async (authCode: string, codeVerifier: string) => {
    setIsLoading(true);
    try {
      const responseData = await exchangeCodeForTokens(authCode, clientId, codeVerifier, redirectUri);
      const decoded = decodeJwt(responseData.access_token);
      if (!decoded) throw new Error('Invalid JWT returned from EVE SSO.');

      // Extract Character ID & Name from JWT claims
      const charId = decoded.sub.split(':')[2];
      const charName = decoded.name;

      // Fetch Corp Name dynamically
      const corpId = decoded.organization_id || 0; // standard ESI token field
      const corpName = corpId ? await fetchCorpName(corpId) : 'Unknown Corp';

      const newChar: EsiCharacter = {
        id: charId,
        name: charName,
        corp: corpName,
        avatarUrl: `${EVE_IMAGE_SERVER}/characters/${charId}/portrait?size=256`,
        rank: 'SSO PILOT',
        level: 1,
        crebits: 0
      };

      // Store Tokens securely
      await SecureStore.setItemAsync(`token_${charId}`, responseData.access_token);
      await SecureStore.setItemAsync(`refresh_${charId}`, responseData.refresh_token);
      await AsyncStorage.setItem(`expiry_${charId}`, (Date.now() + responseData.expires_in * 1000).toString());

      // Update Characters list
      const updatedChars = characters.filter(c => c.id !== charId).concat(newChar);
      setCharacters(updatedChars);
      setActiveChar(newChar);
      
      await AsyncStorage.setItem('esi_characters', JSON.stringify(updatedChars));
      await AsyncStorage.setItem('esi_active_character_id', charId);
      
      // Auto toggle off demo mode on successful login!
      setIsDemoMode(false);
      await AsyncStorage.setItem('esi_demo_mode', 'false');
    } catch (error) {
      console.error('Failed to add EVE character:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove Character
  const removeCharacter = async (charId: string) => {
    const updatedChars = characters.filter(c => c.id !== charId);
    setCharacters(updatedChars);
    await AsyncStorage.setItem('esi_characters', JSON.stringify(updatedChars));

    // Clear tokens
    await SecureStore.deleteItemAsync(`token_${charId}`);
    await SecureStore.deleteItemAsync(`refresh_${charId}`);
    await AsyncStorage.removeItem(`expiry_${charId}`);

    if (activeChar?.id === charId) {
      const nextActive = updatedChars[0] || null;
      setActiveChar(nextActive);
      if (nextActive) {
        await AsyncStorage.setItem('esi_active_character_id', nextActive.id);
      } else {
        await AsyncStorage.removeItem('esi_active_character_id');
      }
    }
  };

  // Add new Alert
  const addNewAlert = async (
    typeId: number,
    itemName: string,
    price: number,
    condition: 'above' | 'below',
    priceType: 'buy' | 'sell'
  ) => {
    const newAlert: MarketAlert = {
      id: Math.random().toString(36).substring(7),
      typeId,
      itemName,
      targetPrice: price,
      condition,
      priceType,
      enabled: true,
      createdAt: Date.now()
    };

    const updatedAlerts = [...alerts, newAlert];
    setAlerts(updatedAlerts);
    await AsyncStorage.setItem('market_alerts', JSON.stringify(updatedAlerts));

    // Instantly poll price for new item
    if (!marketPrices[typeId]) {
      const jita = await fetchJitaPrices(typeId);
      setMarketPrices(prev => ({ ...prev, [typeId]: jita }));
    }
  };

  // Remove Alert
  const removeAlert = async (alertId: string) => {
    const updatedAlerts = alerts.filter(a => a.id !== alertId);
    setAlerts(updatedAlerts);
    await AsyncStorage.setItem('market_alerts', JSON.stringify(updatedAlerts));
  };

  // Toggle Alert enabled state
  const toggleAlert = async (alertId: string) => {
    const updatedAlerts = alerts.map(a => 
      a.id === alertId ? { ...a, enabled: !a.enabled } : a
    );
    setAlerts(updatedAlerts);
    await AsyncStorage.setItem('market_alerts', JSON.stringify(updatedAlerts));
  };

  return (
    <EsiContext.Provider
      value={{
        characters,
        activeChar,
        planets,
        planetDetails,
        marketPrices,
        alerts,
        isLoading,
        isDemoMode,
        setDemoMode,
        addCharacter,
        removeCharacter,
        switchCharacter,
        loadPlanetPins,
        addNewAlert,
        removeAlert,
        toggleAlert,
        refreshAllData,
        clientId,
        redirectUri,
        updateEsiConfig
      }}
    >
      {children}
    </EsiContext.Provider>
  );
};

export const useEsi = () => {
  const context = useContext(EsiContext);
  if (context === undefined) {
    throw new Error('useEsi must be used within an EsiProvider');
  }
  return context;
};
