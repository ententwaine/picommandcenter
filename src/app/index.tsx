import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, TextInput, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useEsi } from '@/context/EsiContext';
import { Colors, Glows, Fonts } from '@/constants/theme';
import { generatePkceChallenge, buildAuthorizeUrl } from '@/services/eveApi';
import { Ionicons } from '@expo/vector-icons';

// Complete the authentication session redirect if running on Web
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { characters, addCharacter, isDemoMode, setDemoMode, clientId, redirectUri, updateEsiConfig } = useEsi();
  
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  
  // Custom configuration inputs
  const [tempClientId, setTempClientId] = useState(clientId);
  const [tempRedirectUri, setTempRedirectUri] = useState(redirectUri);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (characters.length > 0 && !isDemoMode) {
      router.replace('/(tabs)/dashboard');
    }
  }, [characters, isDemoMode]);

  // Synchronize state when config loads in context
  useEffect(() => {
    setTempClientId(clientId);
    setTempRedirectUri(redirectUri);
  }, [clientId, redirectUri]);

  // Initiate EVE Online SSO Login
  const handleEveLogin = async () => {
    setIsLoggingIn(true);
    try {
      // 1. Generate PKCE challenge
      const { verifier, challenge } = await generatePkceChallenge();
      const state = Math.random().toString(36).substring(7);
      
      // 2. Build Authorize URL
      const authUrl = buildAuthorizeUrl(clientId, redirectUri, state, challenge);
      console.log('SSO Link:', authUrl);
      
      // 3. Launch Web Authentication Session
      const authResult = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      
      if (authResult.type === 'success') {
        const urlStr = authResult.url;
        
        // Parse the code & state from redirect URL query params
        const queryParams = Linking.parse(urlStr).queryParams;
        const code = Array.isArray(queryParams?.code) ? queryParams.code[0] : queryParams?.code;
        const returnedState = queryParams?.state;
        
        if (!code) {
          throw new Error('Authentication code not returned from EVE SSO.');
        }
        
        // 4. Exchange Auth Code for Access Tokens
        await addCharacter(code, verifier);
        
        // 5. Navigate to Dashboard
        router.replace('/(tabs)/dashboard');
      } else {
        console.log('Login cancelled or failed:', authResult.type);
      }
    } catch (error: any) {
      console.error('SSO Error:', error);
      Alert.alert('Neural Connection Failed', error.message || 'Check ESI configuration or credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Bypass with simulator mode
  const handleSimulatorBypass = async () => {
    await setDemoMode(true);
    router.replace('/(tabs)/dashboard');
  };

  const saveConfig = () => {
    updateEsiConfig(tempClientId, tempRedirectUri);
    setShowConfigModal(false);
    Alert.alert('Configuration Synced', 'EVE SSO parameters updated.');
  };

  return (
    <LinearGradient colors={[Colors.bgDark, '#030f24']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header HUD Elements */}
        <View style={styles.hudTop}>
          <Text style={styles.hudSerial}>SYS.STATUS: ONLINE // BRDG: REDIRECT</Text>
          <TouchableOpacity style={styles.hudConfigBtn} onPress={() => setShowConfigModal(true)}>
            <Ionicons name="construct-outline" size={18} color={Colors.cyan} />
            <Text style={styles.hudConfigBtnText}>ESI CONFIG</Text>
          </TouchableOpacity>
        </View>

        {/* Center Logo/Art */}
        <View style={styles.centerArt}>
          <View style={styles.glowingHex}>
            <LinearGradient 
              colors={['#00f0ff22', 'transparent']} 
              style={styles.hexInner}
            >
              <Ionicons name="planet" size={80} color={Colors.cyan} style={styles.planetIcon} />
            </LinearGradient>
          </View>
          <Text style={styles.mainTitle}>NEON HAVEN</Text>
          <Text style={styles.subtitle}>EVE PI NEURAL INTERACTION SYSTEM</Text>
          <View style={styles.glitchBar} />
        </View>

        {/* Action Panel */}
        <View style={styles.actionPanel}>
          {isLoggingIn ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.cyan} />
              <Text style={styles.loadingText}>SYNCHRONIZING SYNA-BRIDGES...</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity 
                style={[styles.loginBtn, Glows.cyan]} 
                onPress={handleEveLogin}
                activeOpacity={0.8}
              >
                <Text style={styles.loginBtnText}>CONNECT EVE CHARACTER</Text>
                <Ionicons name="log-in" size={20} color={Colors.bgDark} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.bypassBtn} 
                onPress={handleSimulatorBypass}
                activeOpacity={0.7}
              >
                <Text style={styles.bypassBtnText}>ACTIVATE OFFLINE SIMULATOR MODE</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Footer info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>PI COMMAND CENTER // EXP.DEV SDK 57</Text>
        </View>

        {/* ESI Settings Configuration Modal */}
        {showConfigModal && (
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalContent, Glows.cyan]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>ESI OAUTH PARAMETERS</Text>
                <TouchableOpacity onPress={() => setShowConfigModal(false)}>
                  <Ionicons name="close" size={24} color={Colors.magenta} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScroll}>
                <Text style={styles.modalInstructions}>
                  To authenticate with live EVE ESI data, create an application on the EVE Developer Portal (developers.eveonline.com). Set scopes to:
                </Text>
                <Text style={styles.scopesText}>esi-planets.manage_planets.v1</Text>
                
                <Text style={styles.label}>CLIENT ID</Text>
                <TextInput
                  style={styles.input}
                  value={tempClientId}
                  onChangeText={setTempClientId}
                  placeholder="Enter EVE Client ID"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Text style={styles.label}>REDIRECT URI</Text>
                <TextInput
                  style={styles.input}
                  value={tempRedirectUri}
                  onChangeText={setTempRedirectUri}
                  placeholder="e.g. picommandcenter://redirect"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Text style={styles.modalInstructions}>
                  * Expo Go dev redirect: {Linking.createURL('redirect')}
                </Text>

                <TouchableOpacity 
                  style={[styles.saveBtn, Glows.cyan]} 
                  onPress={saveConfig}
                >
                  <Text style={styles.saveBtnText}>CONFIRM PARAMETERS</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        )}

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  hudTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#00f0ff22',
  },
  hudSerial: {
    color: Colors.textSecondary,
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
  },
  hudConfigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  hudConfigBtnText: {
    color: Colors.cyan,
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: 'bold',
  },
  centerArt: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  glowingHex: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: Colors.cyan,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: Colors.cyan,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  hexInner: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planetIcon: {
    ...Platform.select({
      ios: {
        shadowColor: Colors.cyan,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
      },
    }),
  },
  mainTitle: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 4,
    fontFamily: Fonts.sans,
    textAlign: 'center',
    textShadowColor: Colors.cyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: Fonts.mono,
    marginTop: 8,
    textAlign: 'center',
  },
  glitchBar: {
    width: 60,
    height: 2,
    backgroundColor: Colors.magenta,
    marginTop: 15,
  },
  actionPanel: {
    gap: 15,
    marginBottom: 40,
  },
  loginBtn: {
    backgroundColor: Colors.cyan,
    flexDirection: 'row',
    height: 54,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  loginBtnText: {
    color: Colors.bgDark,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Fonts.sans,
    letterSpacing: 1,
  },
  bypassBtn: {
    height: 48,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.magenta + '88',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ff00550c',
  },
  bypassBtnText: {
    color: Colors.magenta,
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: Fonts.mono,
    letterSpacing: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: Colors.cyan,
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#00f0ff11',
  },
  footerText: {
    color: Colors.textMuted,
    fontFamily: Fonts.mono,
    fontSize: 9,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000dd',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 999,
  },
  modalContent: {
    width: '100%',
    backgroundColor: Colors.bgCard,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.cyan,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#00f0ff33',
    paddingBottom: 10,
    marginBottom: 15,
  },
  modalTitle: {
    color: Colors.cyan,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Fonts.sans,
    letterSpacing: 1.5,
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalInstructions: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: Fonts.sans,
    marginBottom: 10,
  },
  scopesText: {
    color: Colors.yellow,
    fontFamily: Fonts.mono,
    fontSize: 12,
    backgroundColor: '#ffea0011',
    padding: 8,
    borderRadius: 4,
    marginBottom: 15,
    textAlign: 'center',
  },
  label: {
    color: Colors.text,
    fontSize: 11,
    fontFamily: Fonts.mono,
    fontWeight: 'bold',
    marginBottom: 5,
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
    fontSize: 12,
  },
  saveBtn: {
    backgroundColor: Colors.cyan,
    height: 44,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: Colors.bgDark,
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: Fonts.sans,
    letterSpacing: 1,
  },
});
