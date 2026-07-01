import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEsi } from '@/context/EsiContext';
import { Colors, Glows, Fonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchTypeName, fetchSchematic } from '@/services/eveApi';
import { getSchematicInfo } from '@/data/schematics';

export default function PlanetDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { planets, planetDetails, loadPlanetPins, marketPrices, isLoading } = useEsi();
  
  const planetId = parseInt(id as string);
  const planetInfo = planets.find(p => p.planet_id === planetId);
  const details = planetDetails[planetId];

  const [activeTab, setActiveTab] = useState<'extractors' | 'factories' | 'storage'>('extractors');
  const [resolvedNames, setResolvedNames] = useState<Record<number, string>>({});
  const [schematicProducts, setSchematicProducts] = useState<Record<number, string>>({});

  // Trigger loading planet pins when view mounts
  useEffect(() => {
    loadPlanetPins(planetId);
  }, [planetId]);

  // Resolve item type names and schematic products
  useEffect(() => {
    if (!details || !details.pins) return;

    const resolveMetadata = async () => {
      const names = { ...resolvedNames };
      const schemProds = { ...schematicProducts };
      let updated = false;

      for (const pin of details.pins) {
        // Resolve item contents type names
        if (pin.contents) {
          for (const item of pin.contents) {
            const typeId = item.type_id !== undefined ? item.type_id : item.typeId;
            if (!names[typeId]) {
              names[typeId] = await fetchTypeName(typeId);
              updated = true;
            }
          }
        }

        // Resolve extractor product type names
        const extDetails = pin.extractorDetails || pin.extractor_details;
        if (extDetails && extDetails.product_type_id) {
          const typeId = extDetails.product_type_id;
          if (!names[typeId]) {
            names[typeId] = await fetchTypeName(typeId);
            updated = true;
          }
        }

        // Resolve factory schematic details
        const facDetails = pin.factoryDetails || pin.factory_details;
        if (facDetails && facDetails.schematic_id) {
          const schemId = facDetails.schematic_id;
          if (!schemProds[schemId]) {
            // Check static schematics first
            const staticInfo = getSchematicInfo(schemId);
            if (staticInfo) {
              schemProds[schemId] = staticInfo.name;
            } else {
              // Fetch from ESI
              const fetched = await fetchSchematic(schemId);
              if (fetched) {
                schemProds[schemId] = fetched.name;
              } else {
                schemProds[schemId] = `Schematic #${schemId}`;
              }
            }
            updated = true;
          }
        }
      }

      if (updated) {
        setResolvedNames(names);
        setSchematicProducts(schemProds);
      }
    };

    resolveMetadata();
  }, [details]);

  if (isLoading && !details) {
    return (
      <View style={styles.loadingBg}>
        <ActivityIndicator size="large" color={Colors.cyan} />
        <Text style={styles.loadingText}>RESOLVING OPERATIONAL MATRIX...</Text>
      </View>
    );
  }

  if (!planetInfo) {
    return (
      <View style={styles.loadingBg}>
        <Ionicons name="alert-circle" size={40} color={Colors.red} />
        <Text style={[styles.loadingText, { color: Colors.red }]}>COLONY NOT REGISTERED ON CORE SYNAPSE.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>RETURN TO DASHBOARD</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Filter Pins by categories
  const pins = details?.pins || [];
  
  const extractors = pins.filter((p: any) => 
    p.category === 'extractor' || p.extractorDetails !== undefined || p.extractor_details !== undefined
  );
  
  const factories = pins.filter((p: any) => 
    p.category === 'factory' || p.factoryDetails !== undefined || p.factory_details !== undefined
  );
  
  const storages = pins.filter((p: any) => 
    p.category === 'storage' || p.category === 'command_center' || p.contents !== undefined
  );

  const getExtractorRemainingTime = (pin: any) => {
    const extDetails = pin.extractorDetails || pin.extractor_details;
    if (!extDetails) return { text: 'INACTIVE', percent: 0, expired: true };

    const expiryTime = pin.expiry_time || pin.expiryTime;
    if (!expiryTime) return { text: 'CONTINUOUS', percent: 1, expired: false };

    const totalCycle = extDetails.cycle_time || extDetails.cycleTime || 86400;
    const expiryMs = new Date(expiryTime).getTime();
    const remainingMs = expiryMs - Date.now();
    
    if (remainingMs <= 0) {
      return { text: 'DEPLETED / IDLE', percent: 0, expired: true };
    }

    const remainingHrs = Math.floor(remainingMs / 3600000);
    const remainingMins = Math.floor((remainingMs % 3600000) / 60000);
    const percent = Math.max(0, Math.min(1, remainingMs / (totalCycle * 1000)));

    return {
      text: `${remainingHrs}H ${remainingMins}M LEFT`,
      percent,
      expired: false
    };
  };

  const getFactoryStatusText = (pin: any) => {
    const status = pin.status || 'active';
    const facDetails = pin.factoryDetails || pin.factory_details;
    
    if (status === 'error') return 'MISSING ROUTING / INPUTS';
    if (status === 'warning') return 'OPERATION DEGRADED';
    if (status === 'idle') return 'STANDBY IDLE';
    
    return 'PROCESSING CYCLES';
  };

  const getFactoryBadgeColor = (status: string) => {
    if (status === 'error') return Colors.red;
    if (status === 'warning') return Colors.yellow;
    if (status === 'idle') return Colors.textSecondary;
    return Colors.green;
  };

  // Render Storage items
  const renderStorageItems = () => {
    const storageList: { structure: string; itemName: string; qty: number; volume: number; buyValue: number; sellValue: number }[] = [];
    let totalStoredValueBuy = 0;
    let totalStoredValueSell = 0;

    storages.forEach((pin: any) => {
      if (pin.contents && Array.isArray(pin.contents)) {
        pin.contents.forEach((item: any) => {
          const typeId = item.type_id !== undefined ? item.type_id : item.typeId;
          const qty = item.amount || 0;
          const name = resolvedNames[typeId] || `Item #${typeId}`;
          const prices = marketPrices[typeId] || { buy: 0, sell: 0 };
          
          // EVE item volumes
          const itemVol = typeId === 2082 ? 0.01 : 0.38; // raw vs processed volume
          const volume = qty * itemVol;
          const buyVal = qty * prices.buy;
          const sellVal = qty * prices.sell;

          totalStoredValueBuy += buyVal;
          totalStoredValueSell += sellVal;

          storageList.push({
            structure: pin.typeName || pin.type_id === 2257 ? 'Launchpad' : 'Storage',
            itemName: name,
            qty,
            volume,
            buyValue: buyVal,
            sellValue: sellVal
          });
        });
      }
    });

    return (
      <View style={styles.subContainer}>
        {/* Storage HUD header */}
        <View style={[styles.glowCard, Glows.cyan, { marginBottom: 20 }]}>
          <Text style={styles.cardHeader}>COLONY INVENTORY ASSETS</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>BUY ORDER VALUATION</Text>
              <Text style={[styles.statValue, { color: Colors.green }]}>
                {totalStoredValueBuy.toLocaleString(undefined, { maximumFractionDigits: 0 })} ISK
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>SELL ORDER VALUATION</Text>
              <Text style={[styles.statValue, { color: Colors.magenta }]}>
                {totalStoredValueSell.toLocaleString(undefined, { maximumFractionDigits: 0 })} ISK
              </Text>
            </View>
          </View>
        </View>

        {/* Storage Item cards */}
        {storageList.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="cube-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>CARGO SILOS EMPTY.</Text>
          </View>
        ) : (
          storageList.map((item, index) => (
            <View key={index} style={styles.cargoCard}>
              <View style={styles.cargoCardHeader}>
                <View>
                  <Text style={styles.cargoItemName}>{item.itemName}</Text>
                  <Text style={styles.cargoStructureSub}>{item.structure.toUpperCase()} // VOL: {item.volume.toFixed(1)} m³</Text>
                </View>
                <Text style={styles.cargoQty}>{item.qty.toLocaleString()} units</Text>
              </View>
              <View style={styles.cargoDivider} />
              <View style={styles.cargoValuesRow}>
                <Text style={styles.cargoValueLabel}>JITA BUY: <Text style={{ color: Colors.green }}>{item.buyValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} ISK</Text></Text>
                <Text style={styles.cargoValueLabel}>JITA SELL: <Text style={{ color: Colors.magenta }}>{item.sellValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} ISK</Text></Text>
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Navigation HUD */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.cyan} />
          <Text style={styles.backBtnText}>DASHBOARD</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{(planetInfo.planet_type || 'temperate').toUpperCase()}</Text>
          <Text style={styles.headerSubtitle}>NODE ID: {planetId}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'extractors' && styles.tabItemActive]}
          onPress={() => setActiveTab('extractors')}
        >
          <Text style={[styles.tabText, activeTab === 'extractors' && { color: Colors.cyan }]}>EXTRACTORS</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'factories' && styles.tabItemActive]}
          onPress={() => setActiveTab('factories')}
        >
          <Text style={[styles.tabText, activeTab === 'factories' && { color: Colors.cyan }]}>FACTORIES</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'storage' && styles.tabItemActive]}
          onPress={() => setActiveTab('storage')}
        >
          <Text style={[styles.tabText, activeTab === 'storage' && { color: Colors.cyan }]}>STORAGE</Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'extractors' && (
          <View style={styles.subContainer}>
            {extractors.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="construct-outline" size={32} color={Colors.textMuted} />
                <Text style={styles.emptyText}>NO ACTIVE EXTRACTOR HEAD COGNATES INSTALLED.</Text>
              </View>
            ) : (
              extractors.map((pin: any) => {
                const extDetails = pin.extractorDetails || pin.extractor_details;
                const typeId = extDetails?.product_type_id;
                const resourceName = typeId ? (resolvedNames[typeId] || `Item #${typeId}`) : 'RAW RESOURCE';
                const cycle = getExtractorRemainingTime(pin);
                const headsCount = extDetails?.head_positions?.length || 0;

                return (
                  <View 
                    key={pin.pin_id || pin.id} 
                    style={[
                      styles.operatorCard, 
                      { borderColor: cycle.expired ? Colors.red + '44' : Colors.cyan + '44' }
                    ]}
                  >
                    <View style={styles.operatorCardHeader}>
                      <View>
                        <Text style={styles.operatorName}>EXTRACTOR CONTROL UNIT</Text>
                        <Text style={styles.operatorTargetSub}>EXTRACTING: {resourceName.toUpperCase()}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: cycle.expired ? Colors.red + '22' : Colors.green + '22' }]}>
                        <Text style={[styles.statusBadgeText, { color: cycle.expired ? Colors.red : Colors.green }]}>
                          {cycle.expired ? 'IDLE' : 'ACTIVE'}
                        </Text>
                      </View>
                    </View>

                    {/* Progress details */}
                    <View style={styles.cycleProgressContainer}>
                      <View style={styles.cycleProgressTextRow}>
                        <Text style={styles.cycleLabel}>HARVEST CYCLE STATUS</Text>
                        <Text style={[styles.cycleVal, { color: cycle.expired ? Colors.red : Colors.green }]}>{cycle.text}</Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View 
                          style={[
                            styles.progressBarFill, 
                            { 
                              width: `${cycle.percent * 100}%`,
                              backgroundColor: cycle.expired ? Colors.red : Colors.green
                            }
                          ]} 
                        />
                      </View>
                    </View>

                    <View style={styles.operatorFooter}>
                      <Text style={styles.footerTechData}>ACTIVE DRILL HEADS: {headsCount} // CAP: {(extDetails?.qty_per_cycle || 0).toLocaleString()} UNIT/CYCLE</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {activeTab === 'factories' && (
          <View style={styles.subContainer}>
            {factories.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="hammer-outline" size={32} color={Colors.textMuted} />
                <Text style={styles.emptyText}>NO OPERATIONAL ASSEMBLY LINAGES DEPLOYED.</Text>
              </View>
            ) : (
              factories.map((pin: any) => {
                const facDetails = pin.factoryDetails || pin.factory_details;
                const status = pin.status || 'active';
                const statusColor = getFactoryBadgeColor(status);
                const schematicId = facDetails?.schematic_id;
                const productName = schematicId ? (schematicProducts[schematicId] || `Schematic #${schematicId}`) : 'UNKNOWN PRODUCT';
                const structureName = pin.typeName || 'Industry Facility';

                return (
                  <View 
                    key={pin.pin_id || pin.id} 
                    style={[
                      styles.operatorCard, 
                      { borderColor: statusColor + '44' }
                    ]}
                  >
                    <View style={styles.operatorCardHeader}>
                      <View>
                        <Text style={styles.operatorName}>{structureName.toUpperCase()}</Text>
                        <Text style={styles.operatorTargetSub}>ASSEMBLING: {productName.toUpperCase()}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
                        <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                          {status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.factoryDetailRow}>
                      <Ionicons name="cog-outline" size={16} color={statusColor} />
                      <Text style={[styles.factoryStatusDesc, { color: statusColor }]}>
                        {getFactoryStatusText(pin)}
                      </Text>
                    </View>

                    <View style={styles.operatorFooter}>
                      <Text style={styles.footerTechData}>SCHEMATIC CONNECT: #{schematicId || 'NONE'}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {activeTab === 'storage' && renderStorageItems()}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#00f0ff22',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    padding: 6,
  },
  backBtnText: {
    color: Colors.cyan,
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: Fonts.mono,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'flex-end',
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#050a14',
    borderBottomWidth: 1,
    borderBottomColor: '#00f0ff15',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: Colors.cyan,
  },
  tabText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: Fonts.mono,
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 40,
  },
  subContainer: {
    gap: 15,
  },
  operatorCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 6,
    borderWidth: 1.5,
    padding: 14,
  },
  operatorCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  operatorName: {
    color: Colors.text,
    fontWeight: 'bold',
    fontSize: 12,
    fontFamily: Fonts.sans,
    letterSpacing: 0.5,
  },
  operatorTargetSub: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontFamily: Fonts.mono,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: Fonts.mono,
  },
  cycleProgressContainer: {
    marginVertical: 12,
  },
  cycleProgressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cycleLabel: {
    color: Colors.textMuted,
    fontSize: 8,
    fontFamily: Fonts.mono,
  },
  cycleVal: {
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: Fonts.mono,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#00000055',
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff0b',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  operatorFooter: {
    borderTopWidth: 1,
    borderTopColor: '#ffffff08',
    paddingTop: 8,
    marginTop: 4,
  },
  footerTechData: {
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 0.5,
  },
  factoryDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 8,
  },
  factoryStatusDesc: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: Fonts.mono,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    gap: 8,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontFamily: Fonts.mono,
    textAlign: 'center',
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
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: Fonts.mono,
    letterSpacing: 1.5,
    marginBottom: 12,
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
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Fonts.mono,
  },
  cargoCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffffff0a',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cargoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cargoItemName: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  cargoStructureSub: {
    color: Colors.textSecondary,
    fontSize: 8,
    fontFamily: Fonts.mono,
    marginTop: 2,
  },
  cargoQty: {
    color: Colors.cyan,
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: Fonts.mono,
  },
  cargoDivider: {
    height: 1,
    backgroundColor: '#ffffff08',
    marginVertical: 6,
  },
  cargoValuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cargoValueLabel: {
    color: Colors.textMuted,
    fontSize: 8,
    fontFamily: Fonts.mono,
  },
});
