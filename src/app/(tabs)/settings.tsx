import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Switch, Alert, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEsi } from '@/context/EsiContext';
import { Colors, Glows, Fonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';

export default function SettingsScreen() {
  const { 
    characters, 
    removeCharacter, 
    isDemoMode, 
    setDemoMode, 
    clientId, 
    redirectUri, 
    updateEsiConfig 
  } = useEsi();

  const [tempClientId, setTempClientId] = useState(clientId);
  const [tempRedirectUri, setTempRedirectUri] = useState(redirectUri);
  const [serverStatus, setServerStatus] = useState({ players: 0, status: 'UNKNOWN' });

  // Sync inputs with context configs
  useEffect(() => {
    setTempClientId(clientId);
    setTempRedirectUri(redirectUri);
  }, [clientId, redirectUri]);

  // Fetch EVE Server status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('https://esi.evetech.net/latest/status/?datasource=tranquility');
        if (res.ok) {
          const data = await res.json();
          setServerStatus({
            players: data.players,
            status: 'ONLINE'
          });
        } else {
          setServerStatus(s => ({ ...s, status: 'OFFLINE' }));
        }
      } catch (e) {
        setServerStatus(s => ({ ...s, status: 'UNREACHABLE' }));
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveConfig = () => {
    if (!tempClientId.trim()) {
      Alert.alert('Configuration Error', 'Client ID cannot be empty.');
      return;
    }
    updateEsiConfig(tempClientId, tempRedirectUri);
    Alert.alert('Control Parameters Saved', 'EVE SSO configurations updated.');
  };

  const handleRevoke = (charId: string, charName: string) => {
    Alert.alert(
      'REVOKE NEURAL LINK',
      `Are you sure you want to disconnect character ${charName}? This will clear all stored ESI credentials from the local secure storage.`,
      [
        { text: 'CANCEL', style: 'cancel' },
        { 
          text: 'DISCONNECT', 
          style: 'destructive',
          onPress: () => removeCharacter(charId)
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      
      {/* HUD Bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SYS.CONTROL PANEL</Text>
        <Text style={styles.headerSubtitle}>CORE PROTOCOLS & CONFIG</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Tranquility Status Banner */}
        <View style={styles.statusBanner}>
          <View style={styles.statusLabelRow}>
            <Text style={styles.statusBannerTitle}>EVE TRANQUILITY SERVER STATUS</Text>
            <View style={[
              styles.statusDot, 
              { backgroundColor: serverStatus.status === 'ONLINE' ? Colors.green : Colors.red }
            ]} />
          </View>
          <Text style={styles.statusData}>
            STATUS: <Text style={{ fontWeight: 'bold', color: serverStatus.status === 'ONLINE' ? Colors.green : Colors.red }}>{serverStatus.status}</Text>
            {serverStatus.status === 'ONLINE' && ` // PILOTS LOGGED IN: ${serverStatus.players.toLocaleString()}`}
          </Text>
        </View>

        {/* Demo Mode settings */}
        <View style={styles.settingRow}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>OFFLINE SIMULATOR MODE</Text>
            <Text style={styles.settingDesc}>Run app with mock ESI character layout and market feeds.</Text>
          </View>
          <Switch
            value={isDemoMode}
            onValueChange={setDemoMode}
            trackColor={{ false: '#475569', true: Colors.cyan + '44' }}
            thumbColor={isDemoMode ? Colors.cyan : '#64748b'}
          />
        </View>

        {/* ESI Settings Form */}
        <View style={[styles.glowCard, Glows.cyan]}>
          <Text style={styles.cardHeader}>EVE ESI SSO API BRIDGES</Text>
          
          <Text style={styles.formInstructions}>
            Provide custom app credentials to establish a direct neural handshake. Create apps at developers.eveonline.com.
          </Text>

          <Text style={styles.label}>CLIENT ID</Text>
          <TextInput
            style={styles.input}
            value={tempClientId}
            onChangeText={setTempClientId}
            placeholder="Enter Client ID"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>REDIRECT CALLBACK URI</Text>
          <TextInput
            style={styles.input}
            value={tempRedirectUri}
            onChangeText={setTempRedirectUri}
            placeholder="e.g. picommandcenter://redirect"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity 
            style={[styles.saveBtn, Glows.magenta]} 
            onPress={handleSaveConfig}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnText}>COMMIT CONFIGURATION</Text>
            <Ionicons name="shield-checkmark-outline" size={16} color={Colors.bgDark} />
          </TouchableOpacity>
        </View>

        {/* Authorized character list */}
        <Text style={styles.sectionTitle}>AUTHORIZED NEURAL IDENTITIES</Text>
        
        {characters.length === 0 || isDemoMode ? (
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>
              {isDemoMode ? 'OFFLINE SIMULATOR USES PRE-LOADED DATA.' : 'NO AUTHORIZED EVE CHARACTERS FOUND.'}
            </Text>
            {!isDemoMode && (
              <Text style={styles.emptySubtext}>Login using the Connect button on index portal.</Text>
            )}
          </View>
        ) : (
          characters.map((char) => (
            <View key={char.id} style={styles.charCard}>
              <Image source={{ uri: char.avatarUrl }} style={styles.charAvatar} />
              <View style={styles.charDetails}>
                <Text style={styles.charName}>{char.name}</Text>
                <Text style={styles.charCorp}>{char.corp}</Text>
                <Text style={styles.charIdSub}>ID: {char.id}</Text>
              </View>
              <TouchableOpacity 
                style={styles.revokeBtn}
                onPress={() => handleRevoke(char.id, char.name)}
              >
                <Ionicons name="close-circle-outline" size={18} color={Colors.red} />
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Footer specifications */}
        <View style={styles.sysStats}>
          <Text style={styles.sysText}>SYSTEM: NEON HAVEN CLIENT // BUILD: v1.0.0</Text>
          <Text style={styles.sysText}>FRAMEWORK: EXPO SDK 57 // ENGINE: REACT NATIVE</Text>
        </View>

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
  statusBanner: {
    backgroundColor: '#0a101f',
    borderWidth: 1,
    borderColor: '#00f0ff22',
    borderRadius: 6,
    padding: 12,
  },
  statusLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusBannerTitle: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontFamily: Fonts.mono,
    letterSpacing: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusData: {
    color: Colors.text,
    fontSize: 10,
    fontFamily: Fonts.mono,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    padding: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffffff08',
  },
  settingTextContainer: {
    flex: 1,
    paddingRight: 15,
  },
  settingTitle: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: Fonts.sans,
    letterSpacing: 0.5,
  },
  settingDesc: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontFamily: Fonts.sans,
    marginTop: 2,
    lineHeight: 13,
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
    marginBottom: 10,
  },
  formInstructions: {
    color: Colors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 15,
  },
  label: {
    color: Colors.text,
    fontSize: 9,
    fontFamily: Fonts.mono,
    fontWeight: 'bold',
    marginBottom: 5,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#000000bb',
    borderWidth: 1,
    borderColor: '#00f0ff44',
    borderRadius: 4,
    color: Colors.text,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 15,
    fontFamily: Fonts.mono,
    fontSize: 11,
  },
  saveBtn: {
    backgroundColor: Colors.magenta,
    height: 44,
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#ffffff44',
  },
  saveBtnText: {
    color: Colors.bgDark,
    fontSize: 12,
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
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 35,
    backgroundColor: Colors.bgCard,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 15,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontFamily: Fonts.mono,
    textAlign: 'center',
  },
  emptySubtext: {
    color: Colors.textMuted,
    fontSize: 8,
    marginTop: 4,
    fontFamily: Fonts.sans,
  },
  charCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: '#ffffff08',
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
  },
  charAvatar: {
    width: 36,
    height: 36,
    borderRadius: 4,
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.textSecondary,
  },
  charDetails: {
    flex: 1,
  },
  charName: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  charCorp: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontFamily: Fonts.mono,
  },
  charIdSub: {
    color: Colors.textMuted,
    fontSize: 8,
    fontFamily: Fonts.mono,
    marginTop: 2,
  },
  revokeBtn: {
    width: 32,
    height: 32,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.red + '44',
    backgroundColor: Colors.red + '0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sysStats: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 10,
  },
  sysText: {
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontSize: 8,
    lineHeight: 12,
  },
});
