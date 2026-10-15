import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import { NavigationContainer, useIsFocused } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const Tabs = createBottomTabNavigator();
function Button({ title, onPress, disabled }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [s.button, (pressed || disabled) && { opacity: 0.5 }]}><Text style={s.buttonText}>{title}</Text></Pressable>;
}
function Page({ title, subtitle, children }) {
  return <SafeAreaView style={s.page} edges={['top', 'left', 'right']}><ScrollView contentContainerStyle={s.content}><Text style={s.brand}>MI KIT MÓVIL · {Platform.OS === 'ios' ? 'iOS' : 'Android'}</Text><Text style={s.title}>{title}</Text><Text style={s.subtitle}>{subtitle}</Text>{children}</ScrollView></SafeAreaView>;
}
function useActive() {
  const focused = useIsFocused();
  const [active, setActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => setActive(state === 'active'));
    return () => listener.remove();
  }, []);
  return focused && active;
}
function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef(null);
  const active = useActive();
  const [photo, setPhoto] = useState(null);
  const [facing, setFacing] = useState('back');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setReady(false); }, [active, facing, photo]);
  async function takePhoto() {
    if (!camera.current || !ready || busy) return;
    setBusy(true);
    try { const result = await camera.current.takePictureAsync({ quality: 0.6 }); setPhoto(result.uri); }
    catch { Alert.alert('Cámara', 'No se pudo tomar la foto. Intenta de nuevo.'); }
    finally { setBusy(false); }
  }
  async function askPermission() {
    try { if (permission.canAskAgain) await requestPermission(); else await Linking.openSettings(); }
    catch { Alert.alert('Permiso', 'No se pudo abrir el permiso de cámara.'); }
  }
  return <Page title="Una foto rápida" subtitle="Captura un momento con la cámara del celular.">
    {!permission ? <ActivityIndicator color="#2563eb" /> : !permission.granted ? <View style={s.card}><Text style={s.text}>Necesitamos permiso para usar la cámara.</Text><Button title={permission.canAskAgain ? 'Permitir cámara' : 'Abrir ajustes'} onPress={askPermission} /></View> : <>
      <View style={s.cameraBox}>{photo ? <Image accessibilityLabel="Última foto tomada" source={{ uri: photo }} style={s.preview} /> : active ? <CameraView ref={camera} style={s.preview} facing={facing} onCameraReady={() => setReady(true)} onMountError={() => Alert.alert('Cámara', 'No fue posible iniciar la cámara.')} /> : <View style={s.preview} />}</View>
      {photo ? <Button title="Tomar otra foto" onPress={() => setPhoto(null)} /> : <><Button title={busy ? 'Tomando foto...' : 'Tomar foto'} onPress={takePhoto} disabled={!ready || busy} /><Button title="Cambiar cámara" onPress={() => setFacing(value => value === 'back' ? 'front' : 'back')} disabled={busy} /></>}
      <Text style={s.note}>La foto es temporal: no se guarda en la galería.</Text>
    </>}
  </Page>;
}
function LocationScreen() {
  const [coords, setCoords] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Pulsa el botón para consultar tu ubicación.');
  async function locate() {
    setBusy(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setMessage('Permiso denegado. Puedes habilitar la ubicación en los ajustes.');
        if (!permission.canAskAgain) Alert.alert('Permiso requerido', 'Habilita la ubicación para esta app.', [{ text: 'Cancelar' }, { text: 'Ajustes', onPress: () => Linking.openSettings().catch(() => {}) }]);
        return;
      }
      if (!(await Location.hasServicesEnabledAsync())) { setMessage('Activa la ubicación del celular y vuelve a intentar.'); return; }
      const result = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords(result.coords);
      setMessage('Ubicación consultada correctamente.');
    } catch { setMessage('No se pudo obtener la ubicación. Revisa el GPS e intenta al aire libre.'); }
    finally { setBusy(false); }
  }
  async function openMap() {
    const point = `${coords.latitude},${coords.longitude}`;
    // Cada sistema utiliza el enlace de su aplicación de mapas.
    const url = Platform.select({ ios: `maps:0,0?q=${point}`, android: `geo:0,0?q=${point}`, default: `https://www.google.com/maps/search/?api=1&query=${point}` });
    try { await Linking.openURL(url); }
    catch { Alert.alert('Mapas', 'No se encontró una aplicación de mapas disponible.'); }
  }
  return <Page title="¿Dónde estoy?" subtitle="Consulta tus coordenadas y abre el punto en mapas."><View style={s.card}><Ionicons name="location-outline" size={42} color="#2563eb" /><Text style={s.text}>{message}</Text>{coords && <><Text style={s.value}>Latitud: {coords.latitude.toFixed(5)}</Text><Text style={s.value}>Longitud: {coords.longitude.toFixed(5)}</Text><Text style={s.note}>Precisión aproximada: {coords.accuracy == null ? 'no disponible' : `${Math.round(coords.accuracy)} m`}</Text></>}</View><Button title={busy ? 'Buscando ubicación...' : 'Obtener ubicación'} onPress={locate} disabled={busy} />{coords && <Button title="Ver en mapas" onPress={openMap} />}<Text style={s.note}>Solo se consulta al pulsar el botón. No se guarda un historial.</Text></Page>;
}
function LevelScreen() {
  const active = useActive();
  const [data, setData] = useState({ x: 0, y: 0, z: 0 });
  const [running, setRunning] = useState(false);
  const [hasReading, setHasReading] = useState(false);
  const [message, setMessage] = useState('Coloca el celular boca arriba en una superficie.');
  useEffect(() => {
    if (!active || !running) return;
    Accelerometer.setUpdateInterval(200);
    const subscription = Accelerometer.addListener(value => { setData(value); setHasReading(true); });
    return () => subscription.remove();
  }, [active, running]);
  async function toggle() {
    if (running) { setRunning(false); return; }
    try {
      if (!(await Accelerometer.isAvailableAsync())) { setMessage('Este dispositivo no tiene acelerómetro disponible.'); return; }
      const permission = await Accelerometer.requestPermissionsAsync();
      if (!permission.granted) { setMessage('Permite el acceso al movimiento en los ajustes del celular.'); return; }
      setHasReading(false); setRunning(true);
      setMessage('Coloca el celular boca arriba en una superficie.');
    } catch { setMessage('No se pudo iniciar el acelerómetro.'); }
  }
  const flat = Math.abs(data.x) < 0.08 && Math.abs(data.y) < 0.08 && Math.abs(data.z) > 0.8;
  return <Page title="Nivel de bolsillo" subtitle="El acelerómetro muestra la inclinación del celular."><View style={s.card}><View style={s.level}><View style={s.crossX} /><View style={s.crossY} /><View style={[s.bubble, { backgroundColor: flat && running && hasReading ? '#16a34a' : '#2563eb', transform: [{ translateX: Math.max(-65, Math.min(65, data.x * 100)) }, { translateY: Math.max(-65, Math.min(65, -data.y * 100)) }] }]} /></View><Text style={s.value}>{!running ? 'Sensor detenido' : !hasReading ? 'Esperando lectura...' : flat ? 'Superficie nivelada' : 'Celular inclinado'}</Text><Text style={s.text}>{message}</Text><Text style={s.note}>X: {data.x.toFixed(2)} · Y: {data.y.toFixed(2)} · Z: {data.z.toFixed(2)} g</Text></View><Button title={running ? 'Detener sensor' : 'Iniciar sensor'} onPress={toggle} /><Text style={s.note}>Nivel orientativo. El sensor se pausa al cambiar de pestaña o salir de la app.</Text></Page>;
}
export default function Main() {
  return <SafeAreaProvider><StatusBar style="dark" /><NavigationContainer><Tabs.Navigator screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: '#2563eb', tabBarInactiveTintColor: '#64748b', tabBarStyle: { backgroundColor: '#ffffff' }, tabBarIcon: ({ color, size }) => <Ionicons name={{ Cámara: 'camera-outline', Ubicación: 'location-outline', Nivel: 'compass-outline' }[route.name]} color={color} size={size} /> })}><Tabs.Screen name="Cámara" component={CameraScreen} /><Tabs.Screen name="Ubicación" component={LocationScreen} /><Tabs.Screen name="Nivel" component={LevelScreen} /></Tabs.Navigator></NavigationContainer></SafeAreaProvider>;
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f1f5f9' }, content: { padding: 22, gap: 16, paddingBottom: 30 },
  brand: { color: '#2563eb', fontSize: 12, fontWeight: '700', letterSpacing: 1 }, title: { color: '#0f172a', fontSize: 29, fontWeight: '700' },
  subtitle: { color: '#475569', fontSize: 16, lineHeight: 23 }, card: { backgroundColor: 'white', borderRadius: 18, padding: 22, gap: 16, alignItems: 'center' },
  text: { color: '#475569', fontSize: 16, lineHeight: 24, textAlign: 'center' }, value: { color: '#0f172a', fontSize: 18, fontWeight: '600', textAlign: 'center' },
  note: { color: '#64748b', fontSize: 13, lineHeight: 20, textAlign: 'center' }, button: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' }, cameraBox: { height: 330, borderRadius: 18, overflow: 'hidden', backgroundColor: '#0f172a' }, preview: { width: '100%', height: '100%' },
  level: { width: 190, height: 190, borderRadius: 95, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  crossX: { position: 'absolute', width: 190, height: 1, backgroundColor: '#94a3b8' }, crossY: { position: 'absolute', height: 190, width: 1, backgroundColor: '#94a3b8' }, bubble: { width: 38, height: 38, borderRadius: 19 },
});
