import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import axios from 'axios';
import Constants from 'expo-constants';

export default function ConnectionTest() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const testConnection = async () => {
    setLogs([]);
    
    // Test 1: Check Expo host
    const debuggerHost = Constants.expoConfig?.hostUri?.split(':').shift();
    addLog(`Expo detected host: ${debuggerHost || 'NONE'}`);
    
    // Test 2: Try hardcoded IP
    const testUrl = 'http://192.168.1.5:8000/health';
    addLog(`Testing: ${testUrl}`);
    
    try {
      const response = await axios.get(testUrl, { timeout: 5000 });
      addLog(`SUCCESS: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
      addLog(`FAILED: ${error.message}`);
      addLog(`Code: ${error.code}`);
      if (error.response) {
        addLog(`Status: ${error.response.status}`);
      }
    }

    // Test 3: Try with debugger host
    if (debuggerHost) {
      const autoUrl = `http://${debuggerHost}:8000/health`;
      addLog(`Testing auto: ${autoUrl}`);
      try {
        const response = await axios.get(autoUrl, { timeout: 5000 });
        addLog(`AUTO SUCCESS: ${JSON.stringify(response.data)}`);
      } catch (error: any) {
        addLog(`AUTO FAILED: ${error.message}`);
      }
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Connection Test</Text>
      
      <TouchableOpacity style={s.btn} onPress={testConnection}>
        <Text style={s.btnText}>Test Connection</Text>
      </TouchableOpacity>

      <ScrollView style={s.logs}>
        {logs.map((log, i) => (
          <Text key={i} style={s.log}>{log}</Text>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#000' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  btn: { backgroundColor: '#ff6b35', padding: 16, borderRadius: 8, marginBottom: 20 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  logs: { flex: 1, backgroundColor: '#111', padding: 12, borderRadius: 8 },
  log: { color: '#0f0', fontSize: 12, marginBottom: 4, fontFamily: 'monospace' },
});
