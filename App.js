import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, SafeAreaView, Dimensions, Platform, Modal } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { Audio } from 'expo-av';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { CounterLogic } from './src/logic/CounterLogic';

const { width } = Dimensions.get('window');

export default function App() {
  const [rakat, setRakat] = useState(0);
  const [sajdahs, setSajdahs] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [debugData, setDebugData] = useState({ total: 0, delta: 0, volume: -160 });
  const [hasPermission, setHasPermission] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  const bufferRef = useRef([]);
  const BUFFER_SIZE = 10;
  const recordingRef = useRef(null);
  const counterRef = useRef(new CounterLogic({
    onCountChange: (c) => {
      setRakat(c);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onSajdahDetect: (s) => {
      setSajdahs(s % 2 || 2);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }));

  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const startSensing = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.LOW_QUALITY);
      recording.setProgressUpdateInterval(50);
      recording.setOnRecordingStatusUpdate((status) => {
        if (status.metering !== undefined) {
          // Metering ranges from -160 to 0 (dB)
          setDebugData(prev => ({ ...prev, volume: status.metering }));

          // A 'thump' usually spikes the volume 
          // -25dB to -30dB is typically a soft tap on the phone/surface
          if (status.metering > -30) {
            counterRef.current.processSajdahTrigger();
          }
        }
      });
      await recording.startAsync();
      recordingRef.current = recording;
      setIsActive(true);
      activateKeepAwake();
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopSensing = async () => {
    setIsActive(false);
    deactivateKeepAwake();
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) { }
      recordingRef.current = null;
    }
  };

  useEffect(() => {
    let subscription;
    if (isActive) {
      subscription = Accelerometer.addListener(accelerometerData => {
        const { x, y, z } = accelerometerData;
        const total = Math.sqrt(x ** 2 + y ** 2 + z ** 2) * 9.81;

        bufferRef.current.push(total);
        if (bufferRef.current.length > BUFFER_SIZE) bufferRef.current.shift();

        const avg = bufferRef.current.reduce((a, b) => a + b, 0) / bufferRef.current.length;
        const delta = total - avg;

        setDebugData(prev => ({ ...prev, total, delta }));

        // Hybrid backup: Accelerometer still works for hard surfaces
        if (delta > 0.6 && total > 10.1) {
          counterRef.current.processSajdahTrigger();
        }
      });
      Accelerometer.setUpdateInterval(50);
    } else {
      if (subscription) subscription.remove();
    }

    return () => {
      if (subscription) subscription.remove();
    };
  }, [isActive]);

  const handleReset = () => {
    counterRef.current.reset();
    setRakat(0);
    setSajdahs(0);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'white' }}>Microphone permission is required for Zero-Touch counting.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Help Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showHelp}
        onRequestClose={() => setShowHelp(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowHelp(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>How to Use</Text>

            <View style={styles.helpItem}>
              <Text style={styles.helpNumber}>1</Text>
              <Text style={styles.helpText}>Place your phone face-up on the prayer mat where your head will touch during Sajdah.</Text>
            </View>

            <View style={styles.helpItem}>
              <Text style={styles.helpNumber}>2</Text>
              <Text style={styles.helpText}>Press <Text style={{ fontWeight: 'bold', color: '#D4AF37' }}>START PRAYER</Text>. The app will ask for microphone permission to "hear" the prostration thump.</Text>
            </View>

            <View style={styles.helpItem}>
              <Text style={styles.helpNumber}>3</Text>
              <Text style={styles.helpText}>The app automatically counts 1 Rakah for every 2 Sajdahs. No tapping is needed.</Text>
            </View>

            <View style={styles.helpItem}>
              <Text style={styles.helpNumber}>4</Text>
              <Text style={styles.helpText}>Watch the dots below the number - they show your progress (1 or 2 Sajdahs).</Text>
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowHelp(false)}
            >
              <Text style={styles.modalButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity style={styles.helpBtn} onPress={() => setShowHelp(true)}>
          <Text style={styles.helpBtnText}>?</Text>
        </TouchableOpacity>
        <Text style={styles.title}>RAKAT COUNTER</Text>
        <Text style={styles.status}>{isActive ? '• SENSORS LIVE' : 'READY'}</Text>
      </View>

      <TouchableOpacity
        style={styles.counterContainer}
        activeOpacity={0.7}
        onPress={() => counterRef.current.processSajdahTrigger()}
      >
        <Text style={styles.rakatCount}>{rakat}</Text>
        <Text style={styles.label}>RAKATS</Text>

        <View style={styles.dotContainer}>
          <View style={[styles.dot, sajdahs >= 1 && styles.activeDot]} />
          <View style={[styles.dot, sajdahs >= 2 && styles.activeDot]} />
        </View>
      </TouchableOpacity>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.btn, isActive ? styles.btnStop : styles.btnStart]}
          onPress={isActive ? stopSensing : startSensing}
        >
          <Text style={styles.btnText}>{isActive ? 'FINISH' : 'START PRAYER'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnReset} onPress={handleReset}>
          <Text style={styles.btnResetText}>RESET</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.debugText}>
          Volume: {debugData.volume.toFixed(1)} dB | Force: {debugData.total.toFixed(2)} m/s²
        </Text>
        <Text style={styles.infoText}>
          Place phone on mat. App detects the subtle 'thump' of your prostration.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
    paddingHorizontal: 20,
    position: 'relative',
  },
  title: {
    color: '#D4AF37', // Gold
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 4,
  },
  status: {
    color: '#4CAF50',
    fontSize: 12,
    marginTop: 5,
    fontWeight: '600',
  },
  counterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: width * 0.8,
  },
  rakatCount: {
    color: '#FFFFFF',
    fontSize: 160,
    fontWeight: '200',
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-UltraLight' : 'sans-serif-thin',
  },
  label: {
    color: '#666',
    fontSize: 14,
    letterSpacing: 2,
    marginTop: -20,
  },
  dotContainer: {
    flexDirection: 'row',
    marginTop: 40,
    gap: 15,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  activeDot: {
    backgroundColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  controls: {
    width: '100%',
    paddingHorizontal: 40,
    gap: 20,
  },
  btn: {
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  btnStart: {
    backgroundColor: '#D4AF37',
  },
  btnStop: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
  },
  btnText: {
    color: '#0A0A0A',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  btnReset: {
    alignSelf: 'center',
    padding: 10,
  },
  btnResetText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  debugText: {
    color: '#333',
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 10,
  },
  infoText: {
    color: '#444',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  helpBtn: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  helpBtnText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 30,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    color: '#D4AF37',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  helpItem: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  helpNumber: {
    color: '#D4AF37',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 15,
  },
  helpText: {
    flex: 1,
    color: '#CCC',
    fontSize: 14,
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: '#D4AF37',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  modalButtonText: {
    color: '#0A0A0A',
    fontSize: 16,
    fontWeight: '700',
  },
});
