import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Vibration, StatusBar, SafeAreaView, Dimensions } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { CounterLogic } from './src/logic/CounterLogic';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [rakat, setRakat] = useState(0);
  const [sajdahs, setSajdahs] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [debugData, setDebugData] = useState({ x: 0, y: 0, z: 0, total: 0, delta: 0 });
  const bufferRef = useRef([]);
  const BUFFER_SIZE = 10;

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
    let subscription;
    if (isActive) {
      activateKeepAwake();
      subscription = Accelerometer.addListener(accelerometerData => {
        const { x, y, z } = accelerometerData;
        const total = Math.sqrt(x ** 2 + y ** 2 + z ** 2) * 9.81;

        bufferRef.current.push(total);
        if (bufferRef.current.length > BUFFER_SIZE) bufferRef.current.shift();

        const avg = bufferRef.current.reduce((a, b) => a + b, 0) / bufferRef.current.length;
        const delta = total - avg;

        setDebugData({ x, y, z, total, delta });

        // On a mat, we look for a delta spike.
        // 0.8 m/s^2 delta is a very subtle thud.
        if (delta > 0.8 && total > 10.2) {
          counterRef.current.processSajdahTrigger();
        }
      });
      Accelerometer.setUpdateInterval(16); // ~60Hz
    } else {
      deactivateKeepAwake();
      if (subscription) subscription.remove();
    }

    return () => {
      if (subscription) subscription.remove();
      deactivateKeepAwake();
    };
  }, [isActive]);

  const togglePrimary = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    counterRef.current.reset();
    setRakat(0);
    setSajdahs(0);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const manualTap = () => {
    counterRef.current.processSajdahTrigger();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.title}>RAKAT COUNTER</Text>
        <Text style={styles.status}>{isActive ? '• SENSING ACTIVE' : 'READY'}</Text>
      </View>

      <TouchableOpacity
        style={styles.counterContainer}
        activeOpacity={0.7}
        onPress={manualTap}
      >
        <Text style={styles.rakatCount}>{rakat}</Text>
        <Text style={styles.label}>RAKATS</Text>

        <View style={styles.dotContainer}>
          <View style={[styles.dot, sajdahs >= 1 && styles.activeDot]} />
          <View style={[styles.dot, sajdahs >= 2 && styles.activeDot]} />
        </View>
      </TouchableOpacity>

      <View style={styles.controls}>
        <TouchableOpacity style={[styles.btn, isActive ? styles.btnStop : styles.btnStart]} onPress={togglePrimary}>
          <Text style={styles.btnText}>{isActive ? 'FINISH' : 'START'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnReset} onPress={handleReset}>
          <Text style={styles.btnResetText}>RESET</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.debugText}>
          Force: {debugData.total.toFixed(2)} | Delta: {debugData.delta.toFixed(2)} m/s²
        </Text>
        <Text style={styles.infoText}>
          Place phone on mat. Counter updates automatically on Sajdah.
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
});
