import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, FlatList, Keyboard, Platform, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEsi } from '@/context/EsiContext';
import { Colors, Glows, Fonts } from '@/constants/theme';
import { PI_COMMODITIES } from '@/services/mockData';
import { Ionicons } from '@expo/vector-icons';

export default function MarketTrackerScreen() {
  const { alerts, marketPrices, addNewAlert, removeAlert, toggleAlert } = useEsi();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<typeof PI_COMMODITIES[0] | null>(null);
  const [suggestions, setSuggestions] = useState<typeof PI_COMMODITIES>([]);
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [priceType, setPriceType] = useState<'buy' | 'sell'>('sell');

  // Handle autocomplete matching
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.length > 1) {
      const filtered = PI_COMMODITIES.filter(item => 
        item.name.toLowerCase().includes(text.toLowerCase())
      ).slice(0, 5); // limit to 5 matches
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (item: typeof PI_COMMODITIES[0]) => {
    setSelectedItem(item);
    setSearchQuery(item.name);
    setSuggestions([]);
    Keyboard.dismiss();

    // Autofill base price as suggestion
    const currentPrice = marketPrices[item.typeId];
    if (currentPrice) {
      setTargetPrice((priceType === 'sell' ? currentPrice.sell : currentPrice.buy).toString());
    }
  };

  const handleCreateAlert = async () => {
    if (!selectedItem) {
      Alert.alert('Selection Required', 'Search and select a planetary commodity first.');
      return;
    }

    const priceNum = parseFloat(targetPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Invalid Price', 'Specify a valid target price threshold in ISK.');
      return;
    }

    try {
      await addNewAlert(selectedItem.typeId, selectedItem.name, priceNum, condition, priceType);
      
      // Reset inputs
      setSelectedItem(null);
      setSearchQuery('');
      setTargetPrice('');
      Alert.alert('Alert Active', `Bridged price monitor for ${selectedItem.name}.`);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to link alert check.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      
      {/* HUD Bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PI MARKET TICKER & ALERTS</Text>
        <Text style={styles.headerSubtitle}>HUB DIRECTORY // JITA 4-4</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        {/* Search & Alert Builder Panel */}
        <View style={[styles.glowCard, Glows.cyan]}>
          <Text style={styles.cardHeader}>CONFIGURE PRICE BRIDGE ALERT</Text>
          
          {/* Commodity Name Input */}
          <Text style={styles.label}>SEARCH PLANETARY COMMODITY</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.input}
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholder="e.g. Coolant, Consumer Electronics..."
              placeholderTextColor={Colors.textMuted}
              autoCorrect={false}
            />
            {selectedItem && (
              <TouchableOpacity style={styles.clearBtn} onPress={() => { setSelectedItem(null); setSearchQuery(''); }}>
                <Ionicons name="close-circle" size={18} color={Colors.magenta} />
              </TouchableOpacity>
            )}
          </View>

          {/* Autocomplete Suggestions */}
          {suggestions.length > 0 && (
            <View style={styles.suggestionsBox}>
              {suggestions.map((item) => (
                <TouchableOpacity 
                  key={item.typeId} 
                  style={styles.suggestionItem}
                  onPress={() => selectSuggestion(item)}
                >
                  <Text style={styles.suggestionText}>{item.name}</Text>
                  <Text style={styles.suggestionTierBadge}>{item.tier}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Selected Item Indicator */}
          {selectedItem && (
            <View style={styles.selectedIndicator}>
              <Text style={styles.selectedText}>LINKED TARGET: <Text style={{ color: Colors.cyan }}>{selectedItem.name} [{selectedItem.tier}]</Text></Text>
              {marketPrices[selectedItem.typeId] && (
                <Text style={styles.livePricesSub}>
                  Live Jita - Buy: {marketPrices[selectedItem.typeId].buy.toLocaleString()} ISK / Sell: {marketPrices[selectedItem.typeId].sell.toLocaleString()} ISK
                </Text>
              )}
            </View>
          )}

          {/* Config details */}
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>ALERT TRIGGER</Text>
              <View style={styles.toggleGroup}>
                <TouchableOpacity 
                  style={[styles.toggleBtn, condition === 'above' && styles.toggleBtnActive]}
                  onPress={() => setCondition('above')}
                >
                  <Text style={[styles.toggleText, condition === 'above' && { color: Colors.bgDark }]}>GOES ABOVE</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.toggleBtn, condition === 'below' && styles.toggleBtnActive]}
                  onPress={() => setCondition('below')}
                >
                  <Text style={[styles.toggleText, condition === 'below' && { color: Colors.bgDark }]}>GOES BELOW</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>MARKET ORDER VALUE TYPE</Text>
              <View style={styles.toggleGroup}>
                <TouchableOpacity 
                  style={[styles.toggleBtn, priceType === 'sell' && styles.toggleBtnActive]}
                  onPress={() => {
                    setPriceType('sell');
                    if (selectedItem && marketPrices[selectedItem.typeId]) {
                      setTargetPrice(marketPrices[selectedItem.typeId].sell.toString());
                    }
                  }}
                >
                  <Text style={[styles.toggleText, priceType === 'sell' && { color: Colors.bgDark }]}>LOWEST SELL</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.toggleBtn, priceType === 'buy' && styles.toggleBtnActive]}
                  onPress={() => {
                    setPriceType('buy');
                    if (selectedItem && marketPrices[selectedItem.typeId]) {
                      setTargetPrice(marketPrices[selectedItem.typeId].buy.toString());
                    }
                  }}
                >
                  <Text style={[styles.toggleText, priceType === 'buy' && { color: Colors.bgDark }]}>HIGHEST BUY</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>THRESHOLD VALUE (ISK)</Text>
              <TextInput
                style={styles.input}
                value={targetPrice}
                onChangeText={setTargetPrice}
                placeholder="Enter ISK value"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.actionBtn, Glows.magenta]} 
            onPress={handleCreateAlert}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>ACTIVATE ALERT LINK</Text>
            <Ionicons name="notifications-outline" size={16} color={Colors.bgDark} />
          </TouchableOpacity>

        </View>

        {/* Tracked alerts list */}
        <Text style={styles.sectionTitle}>ACTIVE COMMODITY ALERTS ({alerts.length})</Text>

        {alerts.length === 0 ? (
          <View style={styles.emptyAlertsBox}>
            <Ionicons name="notifications-off-outline" size={36} color={Colors.textMuted} />
            <Text style={styles.emptyAlertsText}>NO ACTIVE PRICE ALERTS MONITORING.</Text>
            <Text style={styles.emptyAlertsSub}>Build alert configurations above.</Text>
          </View>
        ) : (
          alerts.map((alert) => {
            const currentPrice = marketPrices[alert.typeId];
            const currentPriceVal = currentPrice 
              ? (alert.priceType === 'sell' ? currentPrice.sell : currentPrice.buy) 
              : null;
            
            // Check proximity
            let currentStatus: string = Colors.textSecondary;
            if (currentPriceVal) {
              if (alert.condition === 'above' && currentPriceVal >= alert.targetPrice) {
                currentStatus = Colors.green;
              } else if (alert.condition === 'below' && currentPriceVal <= alert.targetPrice) {
                currentStatus = Colors.magenta;
              }
            }

            return (
              <View key={alert.id} style={styles.alertCard}>
                <View style={styles.alertCardHeader}>
                  <View>
                    <Text style={styles.alertItemName}>{alert.itemName}</Text>
                    <Text style={styles.alertDetailsText}>
                      TRIGGER: {alert.priceType.toUpperCase()} GOES {alert.condition.toUpperCase()} {alert.targetPrice.toLocaleString()} ISK
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeAlert(alert.id)}>
                    <Ionicons name="trash-outline" size={18} color={Colors.red} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.alertCardDivider} />
                
                <View style={styles.alertCardFooter}>
                  <View>
                    <Text style={styles.currentPriceLabel}>CURRENT JITA {alert.priceType.toUpperCase()}:</Text>
                    <Text style={[styles.currentPriceVal, { color: currentStatus }]}>
                      {currentPriceVal ? `${currentPriceVal.toLocaleString()} ISK` : 'SYNCING...'}
                    </Text>
                  </View>
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>{alert.enabled ? 'ACTIVE' : 'MUTED'}</Text>
                    <Switch
                      value={alert.enabled}
                      onValueChange={() => toggleAlert(alert.id)}
                      trackColor={{ false: '#475569', true: Colors.cyan + '44' }}
                      thumbColor={alert.enabled ? Colors.cyan : '#64748b'}
                    />
                  </View>
                </View>
              </View>
            );
          })
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  header: {
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#00f0ff22',
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: Fonts.sans,
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontFamily: Fonts.mono,
  },
  scrollContent: {
    padding: 15,
    gap: 20,
    paddingBottom: 40,
  },
  glowCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.cyan,
    padding: 15,
  },
  cardHeader: {
    color: Colors.cyan,
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: Fonts.mono,
    letterSpacing: 1.5,
    marginBottom: 15,
  },
  label: {
    color: Colors.text,
    fontSize: 10,
    fontFamily: Fonts.mono,
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    backgroundColor: '#000000bb',
    borderWidth: 1,
    borderColor: '#00f0ff44',
    borderRadius: 4,
    color: Colors.text,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 12,
    fontFamily: Fonts.mono,
    fontSize: 12,
    flex: 1,
  },
  clearBtn: {
    position: 'absolute',
    right: 12,
    top: 11,
  },
  suggestionsBox: {
    backgroundColor: '#050a14',
    borderWidth: 1,
    borderColor: Colors.cyan,
    borderRadius: 4,
    marginTop: -8,
    marginBottom: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff07',
  },
  suggestionText: {
    color: Colors.text,
    fontSize: 12,
  },
  suggestionTierBadge: {
    color: Colors.yellow,
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: 'bold',
  },
  selectedIndicator: {
    backgroundColor: '#00f0ff0d',
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#00f0ff22',
    marginBottom: 15,
  },
  selectedText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontFamily: Fonts.sans,
  },
  livePricesSub: {
    color: Colors.yellow,
    fontSize: 9,
    fontFamily: Fonts.mono,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  col: {
    flex: 1,
  },
  toggleGroup: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  toggleBtn: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderColor: '#00f0ff44',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00000033',
  },
  toggleBtnActive: {
    backgroundColor: Colors.cyan,
    borderColor: Colors.cyan,
  },
  toggleText: {
    color: Colors.cyan,
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: Fonts.sans,
    letterSpacing: 0.5,
  },
  actionBtn: {
    backgroundColor: Colors.magenta,
    height: 48,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ffffff55',
  },
  actionBtnText: {
    color: Colors.bgDark,
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: Fonts.sans,
    letterSpacing: 1,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: Fonts.mono,
    letterSpacing: 1.5,
    marginTop: 5,
  },
  emptyAlertsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.bgCard,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyAlertsText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontFamily: Fonts.mono,
    marginTop: 10,
  },
  emptyAlertsSub: {
    color: Colors.textMuted,
    fontSize: 8,
    fontFamily: Fonts.sans,
    marginTop: 4,
  },
  alertCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffffff0a',
    padding: 12,
    marginBottom: 12,
  },
  alertCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  alertItemName: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  alertDetailsText: {
    color: Colors.yellow,
    fontSize: 8,
    fontFamily: Fonts.mono,
    marginTop: 3,
    letterSpacing: 0.5,
  },
  alertCardDivider: {
    height: 1,
    backgroundColor: '#ffffff08',
    marginVertical: 8,
  },
  alertCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentPriceLabel: {
    color: Colors.textMuted,
    fontSize: 8,
    fontFamily: Fonts.mono,
  },
  currentPriceVal: {
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: Fonts.mono,
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontFamily: Fonts.mono,
    fontWeight: 'bold',
  },
});
