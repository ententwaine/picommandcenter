import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEsi, EsiCharacter } from '@/context/EsiContext';
import { Colors, Glows, Fonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { fetchTypeName } from '@/services/eveApi';

export default function DashboardScreen() {
  const router = useRouter();
  const { 
    characters, 
    activeChar, 
    switchCharacter, 
    planets, 
    planetDetails, 
    loadPlanetPins, 
    marketPrices, 
    isLoading,
    isDemoMode,
    setDemoMode
  } = useEsi();

  const [showSwitcher, setShowSwitcher] = useState(false);
  const [globalStats, setGlobalStats] = useState({ totalItems: 0, buyValue: 0, sellValue: 0 });
  const [resolvedNames, setResolvedNames] = useState<Record<number, string>>({});

  // If no characters, redirect back to login (unless in demo mode)
  useEffect(() => {
    if (characters.length === 0 && !isDemoMode) {
      router.replace('/');
    }
  }, [characters, isDemoMode]);

  // Load details for all planets to compile global totals
  useEffect(() => {
    if (activeChar && planets.length > 0) {
      planets.forEach(planet => {
        const id = planet.planet_id;
        if (!planetDetails[id]) {
          loadPlanetPins(id);
        }
      });
    }
  }, [planets, activeChar]);

  // Calculate Global Item Counts & ISK valuations
  useEffect(() => {
    const calculateTotals = async () => {
      let totalItems = 0;
      let totalBuyValue = 0;
      let totalSellValue = 0;
      const uniqueTypeIds = new Set<number>();

      Object.values(planetDetails).forEach((layout: any) => {
        if (!layout || !layout.pins) return;
        
        layout.pins.forEach((pin: any) => {
          // Check if pin has contents (storages, launchpads, command centers)
          if (pin.contents && Array.isArray(pin.contents)) {
            pin.contents.forEach((item: any) => {
              const typeId = item.type_id !== undefined ? item.type_id : item.typeId;
              const amount = item.amount || 0;
              totalItems += amount;
              uniqueTypeIds.add(typeId);

              // Look up price
              const price = marketPrices[typeId] || { buy: 0, sell: 0 };
              totalBuyValue += amount * price.buy;
              totalSellValue += amount * price.sell;
            });
          }
        });
      });

      setGlobalStats({
        totalItems,
        buyValue: totalBuyValue,
        sellValue: totalSellValue
      });

      // Async resolve names of unique item IDs for rendering
      const names = { ...resolvedNames };
      let updated = false;
      for (const typeId of uniqueTypeIds) {
        if (!names[typeId]) {
          names[typeId] = await fetchTypeName(typeId);
          updated = true;
        }
      }
      if (updated) {
        setResolvedNames(names);
      }
    };

    calculateTotals();
  }, [planetDetails, marketPrices]);

  // Helper to determine planet status indicators
  const getPlanetStatus = (planetId: number) => {
    const details = planetDetails[planetId];
    if (!details || !details.pins) return { ext: 'gray', fac: 'gray', color: Colors.textMuted };

    let extractorStatus = 'active';
    let factoryStatus = 'active';

    // Scan pins
    details.pins.forEach((pin: any) => {
      const category = pin.category || (pin.extractorDetails ? 'extractor' : pin.factoryDetails ? 'factory' : 'storage');
      const status = pin.status || 'active';
      
      if (category === 'extractor' && status !== 'active') {
        extractorStatus = status; // inherits warning/error
      }
      if (category === 'factory' && status !== 'active') {
        factoryStatus = status;
      }
    });

    // Determine card overall accent color
    let cardColor: string = Colors.green;
    if (extractorStatus === 'error' || factoryStatus === 'error') {
      cardColor = Colors.red;
    } else if (extractorStatus === 'warning' || factoryStatus === 'warning') {
      cardColor = Colors.yellow;
    }

    return {
      ext: extractorStatus,
      fac: factoryStatus,
      color: cardColor
    };
  };

  const formatIsk = (val: number) => {
    if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B ISK`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M ISK`;
    return `${val.toLocaleString()} ISK`;
  };

  if (!activeChar) {
    return (
      <View style={styles.loadingBg}>
        <ActivityIndicator size="large" color={Colors.cyan} />
        <Text style={styles.loadingText}>AUTHORIZING NEURAL LINK...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      
      {/* Top Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileLeft}>
          <Image source={{ uri: activeChar.avatarUrl }} style={styles.avatar} />
          <View style={styles.profileDetails}>
            <Text style={styles.charName}>{activeChar.name}</Text>
            <Text style={styles.corpName}>{activeChar.corp}</Text>
            <Text style={styles.rankBadge}>{activeChar.rank} // LVL {activeChar.level}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.switchCharBtn} 
          onPress={() => setShowSwitcher(!showSwitcher)}
        >
          <Ionicons name="swap-horizontal" size={20} color={Colors.cyan} />
        </TouchableOpacity>
      </View>

      {/* Character Switcher Dropdown */}
      {showSwitcher && (
        <View style={styles.switcherDropdown}>
          <Text style={styles.switcherTitle}>SELECT COGNITIVE IDENTITY</Text>
          {characters.map((char) => (
            <TouchableOpacity
              key={char.id}
              style={[
                styles.switcherItem,
                char.id === activeChar.id && { borderColor: Colors.cyan }
              ]}
              onPress={() => {
                switchCharacter(char.id);
                setShowSwitcher(false);
              }}
            >
              <Image source={{ uri: char.avatarUrl }} style={styles.switcherAvatar} />
              <View style={styles.switcherText}>
                <Text style={styles.switcherName}>{char.name}</Text>
                <Text style={styles.switcherCorp}>{char.corp}</Text>
              </View>
              {char.id === activeChar.id && (
                <Ionicons name="checkmark-circle" size={18} color={Colors.cyan} />
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity 
            style={styles.addCharBtn}
            onPress={() => {
              setShowSwitcher(false);
              router.push('/');
            }}
          >
            <Ionicons name="add" size={16} color={Colors.magenta} />
            <Text style={styles.addCharBtnText}>AUTHORIZE NEW CHARACTER</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Global Inventory and Value Totals */}
        <View style={[styles.glowCard, Glows.cyan]}>
          <Text style={styles.cardHeader}>GLOBAL PLANETARY CARGO VALUE</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>TOTAL CARGO ITEMS</Text>
              <Text style={[styles.statValue, { color: Colors.cyan }]}>
                {globalStats.totalItems.toLocaleString()}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>BUY ORDER VALUATION</Text>
              <Text style={[styles.statValue, { color: Colors.green }]}>
                {formatIsk(globalStats.buyValue)}
              </Text>
            </View>
          </View>

          <View style={styles.statsDivider} />

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>SELL ORDER VALUATION</Text>
              <Text style={[styles.statValue, { color: Colors.magenta }]}>
                {formatIsk(globalStats.sellValue)}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>HUB DIRECTORY</Text>
              <Text style={[styles.statValue, { color: Colors.yellow, fontSize: 13, marginTop: 4 }]}>
                JITA 4-4 CALDARI NAVY
              </Text>
            </View>
          </View>
        </View>

        {/* Colony List Title */}
        <View style={styles.colonyHeader}>
          <Text style={styles.sectionTitle}>ESTABLISHED COLONIES ({planets.length})</Text>
          {isLoading && <ActivityIndicator size="small" color={Colors.cyan} />}
        </View>

        {/* Planets List */}
        {planets.length === 0 ? (
          <View style={styles.emptyColonies}>
            <Ionicons name="alert-circle" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>NO ACTIVE PLANETARY INDUSTRY INFRASTRUCTURE DETECTED.</Text>
            <Text style={styles.emptySubtext}>Initialize colonies in EVE Online client first.</Text>
          </View>
        ) : (
          planets.map((planet) => {
            const status = getPlanetStatus(planet.planet_id);
            const planetType = planet.planet_type || 'temperate';
            const ccLevel = planet.upgrade_level || 1;
            const pinsCount = planet.num_pins || 0;

            return (
              <TouchableOpacity
                key={planet.planet_id}
                style={[styles.colonyCard, { borderColor: status.color + '44' }]}
                onPress={() => router.push(`/planet/${planet.planet_id}`)}
                activeOpacity={0.85}
              >
                {/* Visual Glow Left Border */}
                <View style={[styles.statusLeftBorder, { backgroundColor: status.color }]} />

                <View style={styles.colonyCardContent}>
                  <View style={styles.colonyCardHeader}>
                    <View>
                      <Text style={styles.colonyName}>
                        {planetType.toUpperCase()} // ID: {planet.planet_id}
                      </Text>
                      <Text style={styles.colonyTypeSub}>COMMAND CENTER LEVEL {ccLevel}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Colors.cyan} />
                  </View>

                  <View style={styles.colonyStatsRow}>
                    <View style={styles.colonyIndicatorBox}>
                      <Text style={styles.indicatorLabel}>EXTRACTORS</Text>
                      <View style={styles.indicatorStatusRow}>
                        <View 
                          style={[
                            styles.indicatorDot, 
                            { 
                              backgroundColor: 
                                status.ext === 'active' ? Colors.green : 
                                status.ext === 'warning' ? Colors.yellow : 
                                status.ext === 'error' ? Colors.red : Colors.textMuted 
                            }
                          ]} 
                        />
                        <Text 
                          style={[
                            styles.indicatorVal, 
                            { 
                              color: 
                                status.ext === 'active' ? Colors.green : 
                                status.ext === 'warning' ? Colors.yellow : 
                                status.ext === 'error' ? Colors.red : Colors.textSecondary 
                            }
                          ]}
                        >
                          {status.ext.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.colonyIndicatorBox}>
                      <Text style={styles.indicatorLabel}>FACTORIES</Text>
                      <View style={styles.indicatorStatusRow}>
                        <View 
                          style={[
                            styles.indicatorDot, 
                            { 
                              backgroundColor: 
                                status.fac === 'active' ? Colors.green : 
                                status.fac === 'warning' ? Colors.yellow : 
                                status.fac === 'error' ? Colors.red : Colors.textMuted 
                            }
                          ]} 
                        />
                        <Text 
                          style={[
                            styles.indicatorVal, 
                            { 
                              color: 
                                status.fac === 'active' ? Colors.green : 
                                status.fac === 'warning' ? Colors.yellow : 
                                status.fac === 'error' ? Colors.red : Colors.textSecondary 
                            }
                          ]}
                        >
                          {status.fac.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.colonyIndicatorBox}>
                      <Text style={styles.indicatorLabel}>TOTAL STRUCTURES</Text>
                      <Text style={[styles.colonyCountVal, { color: Colors.cyan }]}>
                        {pinsCount} PINS
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
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
  loadingBg: {
    flex: 1,
    backgroundColor: Colors.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  loadingText: {
    color: Colors.cyan,
    fontFamily: Fonts.mono,
    fontSize: 12,
    letterSpacing: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#00f0ff22',
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.cyan,
  },
  profileDetails: {
    justifyContent: 'center',
    flex: 1,
  },
  charName: {
    color: Colors.text,
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: Fonts.sans,
    letterSpacing: 0.5,
  },
  corpName: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontFamily: Fonts.mono,
  },
  rankBadge: {
    color: Colors.magenta,
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: Fonts.mono,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  switchCharBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#00f0ff44',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00f0ff08',
  },
  switcherDropdown: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.cyan,
    borderRadius: 6,
    marginHorizontal: 15,
    marginTop: 5,
    padding: 12,
    zIndex: 999,
    position: 'absolute',
    top: 65,
    left: 0,
    right: 0,
    ...Platform.select({
      ios: {
        shadowColor: Colors.cyan,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  switcherTitle: {
    color: Colors.cyan,
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: Fonts.mono,
    marginBottom: 8,
    letterSpacing: 1,
  },
  switcherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#00f0ff11',
    borderRadius: 4,
    marginBottom: 8,
    backgroundColor: '#00000033',
  },
  switcherAvatar: {
    width: 32,
    height: 32,
    borderRadius: 4,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.textSecondary,
  },
  switcherText: {
    flex: 1,
  },
  switcherName: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  switcherCorp: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontFamily: Fonts.mono,
  },
  addCharBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.magenta,
    borderRadius: 4,
    backgroundColor: '#ff005508',
    marginTop: 4,
  },
  addCharBtnText: {
    color: Colors.magenta,
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: Fonts.sans,
    marginLeft: 5,
    letterSpacing: 0.5,
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 8,
    fontFamily: Fonts.mono,
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Fonts.mono,
  },
  statsDivider: {
    height: 1,
    backgroundColor: '#00f0ff18',
    marginVertical: 12,
  },
  colonyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: Fonts.mono,
    letterSpacing: 1.5,
  },
  emptyColonies: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.bgCard,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontFamily: Fonts.mono,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 16,
  },
  emptySubtext: {
    color: Colors.textMuted,
    fontSize: 9,
    fontFamily: Fonts.sans,
    marginTop: 5,
  },
  colonyCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 6,
    borderWidth: 1.5,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  statusLeftBorder: {
    width: 6,
    height: '100%',
  },
  colonyCardContent: {
    flex: 1,
    padding: 12,
  },
  colonyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff0d',
    paddingBottom: 8,
    marginBottom: 10,
  },
  colonyName: {
    color: Colors.text,
    fontWeight: 'bold',
    fontSize: 12,
    fontFamily: Fonts.sans,
    letterSpacing: 0.5,
  },
  colonyTypeSub: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontFamily: Fonts.mono,
    marginTop: 2,
  },
  colonyStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  colonyIndicatorBox: {
    flex: 1,
  },
  indicatorLabel: {
    color: Colors.textMuted,
    fontSize: 8,
    fontFamily: Fonts.mono,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  indicatorStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  indicatorVal: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: Fonts.mono,
  },
  colonyCountVal: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: Fonts.mono,
  },
});
