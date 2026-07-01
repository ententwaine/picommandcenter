import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchJitaPrices } from '@/services/eveApi';

export const BACKGROUND_TASK_NAME = 'MARKET_TRACKER_TASK';

// Configure Notifications default handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  } as any),
});

export interface MarketAlert {
  id: string;
  typeId: number;
  itemName: string;
  targetPrice: number;
  condition: 'above' | 'below';
  priceType: 'buy' | 'sell';
  enabled: boolean;
  createdAt: number;
}

// Request Notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.warn('Failed to get push token for local notifications!');
    return false;
  }
  
  return true;
}

// Check market prices and trigger notifications if conditions are met
export async function checkAlertsAndNotify(): Promise<boolean> {
  try {
    const alertsJson = await AsyncStorage.getItem('market_alerts');
    if (!alertsJson) return false;
    
    const alerts: MarketAlert[] = JSON.parse(alertsJson);
    const activeAlerts = alerts.filter(a => a.enabled);
    
    if (activeAlerts.length === 0) return false;
    
    let triggeredAny = false;
    
    for (const alert of activeAlerts) {
      const prices = await fetchJitaPrices(alert.typeId);
      const currentPrice = alert.priceType === 'sell' ? prices.sell : prices.buy;
      
      if (currentPrice === 0) continue; // Skip if pricing could not be fetched
      
      let conditionMet = false;
      if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
        conditionMet = true;
      } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
        conditionMet = true;
      }
      
      if (conditionMet) {
        triggeredAny = true;
        
        // Trigger the notification immediately with system sound
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `PI Ticker Alert: ${alert.itemName}`,
            body: `Jita 4-4 ${alert.priceType} price of ${alert.itemName} has gone ${alert.condition} target of ${alert.targetPrice.toLocaleString()} ISK! Current price is ${currentPrice.toLocaleString()} ISK.`,
            sound: true, // Use device default notification sound
          },
          trigger: null, // immediate
        });
      }
    }
    
    return triggeredAny;
  } catch (error) {
    console.error('Error checking alerts:', error);
    return false;
  }
}

// Register background task
export async function registerBackgroundFetchAsync() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
    if (isRegistered) {
      console.log('Background task already registered.');
      return;
    }
    
    // Fetch every 15 minutes (minimum allowed by OS)
    await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
      minimumInterval: 15 * 60, // 15 mins in seconds
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('Background task registered successfully.');
  } catch (err) {
    console.error('Failed to register background task:', err);
  }
}

// Unregister background task
export async function unregisterBackgroundFetchAsync() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TASK_NAME);
      console.log('Background task unregistered.');
    }
  } catch (err) {
    console.error('Failed to unregister background task:', err);
  }
}

// Define the background task executor
TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
  console.log('Running background market check task...');
  const didNotify = await checkAlertsAndNotify();
  return didNotify 
    ? BackgroundFetch.BackgroundFetchResult.NewData 
    : BackgroundFetch.BackgroundFetchResult.NoData;
});
