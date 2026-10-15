# Mi Kit Móvil

Taller de aplicaciones móviles híbridas con React Native y Expo. Una app pequeña con tres herramientas y navegación exclusivamente por pestañas.

## Funciones

| Requisito | Implementación |
| --- | --- |
| Función nativa 1 | Cámara: permiso, cámara frontal/trasera, tomar foto y vista previa temporal. |
| Función nativa 2 | Ubicación: permiso en primer plano, coordenadas, precisión y acceso a mapas. |
| Sensor | Acelerómetro: lecturas X/Y/Z y una burbuja para estimar si una superficie está nivelada. |
| Android/iOS | `Platform.OS` identifica el sistema y `Platform.select` elige el enlace de mapas. Los permisos se solicitan con Expo. SafeAreaView respeta las áreas del dispositivo. |
| Navegación | Bottom Tabs de React Navigation, sin Stack ni Drawer. |
| APK | Perfil `preview` de EAS configurado para producir `.apk`. |

## Ejecutar

Instala Node.js 22.13 o superior (recomendado Node 22 LTS), Git y Expo Go en el celular. Usa una versión de Expo Go compatible con SDK 57. Si Expo Go no admite ese SDK, utiliza el APK generado con EAS.

En una terminal, dentro de esta carpeta:

```sh
npm ci
npx expo start
```

Escanea el QR desde Expo Go en Android o desde la cámara de iOS. El computador y celular deben estar en la misma red. Si la red bloquea la conexión, prueba `npx expo start --tunnel`.

## Generar APK con EAS

Para esta entrega, inicia sesión con tu cuenta Expo `s_ar_aa`. No compartas la contraseña en el chat.

```sh
npx eas-cli@latest login
npx eas-cli@latest whoami
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android --profile preview
```

Durante la configuración, vincula el proyecto a tu propia cuenta de Expo. EAS añadirá `extra.eas.projectId` a `app.json`. Si pregunta si debe generar una nueva Android Keystore, acepta para este proyecto nuevo. No subas contraseñas ni archivos de firma al repositorio.

Al terminar la compilación, abre el enlace del build y descarga el APK. Instálalo en el Android y realiza las pruebas de abajo. El APK funciona sin Metro ni Expo Go. El tiempo de cola de EAS depende del servicio.

## Subir a GitHub y publicar el APK

1. Crea un repositorio **público** llamado `mi-kit-movil` en tu cuenta de GitHub, sin inicializarlo con otro README.
2. Abre una terminal en esta carpeta y ejecuta, reemplazando `Sarcacosta`:

```sh
git init
git add .
git commit -m "App del taller: camara, ubicacion y acelerometro"
git branch -M main
git remote add origin https://github.com/Sarcacosta/mi-kit-movil.git
git push -u origin main
```

3. En GitHub entra a **Releases → Create a new release**. Crea la etiqueta `v1.0.0`, adjunta el APK descargado de EAS con nombre `mi-kit-movil.apk` y publica la release.
4. Copia la URL del repositorio y el enlace del archivo adjunto de la release. Comprueba ambos en una ventana privada sin iniciar sesión. El segundo enlace debe descargar el APK.

No subas `node_modules`, `.expo`, claves ni credenciales. `.gitignore` ya los excluye. La compilación debe realizarse desde la misma versión del código que publiques.

## Pruebas manuales en un dispositivo real

Estas pruebas deben completarse antes de entregar; el empaquetado de JavaScript no prueba el hardware.

- [ ] Abrir las tres pestañas y confirmar que no hay navegación por pantallas adicionales.
- [ ] Permitir cámara, tomar foto, cambiar a frontal y tomar otra.
- [ ] Denegar cámara: debe aparecer un mensaje; si el sistema bloquea nuevas solicitudes, abrir ajustes.
- [ ] Permitir ubicación, obtener coordenadas y abrir mapas.
- [ ] Denegar ubicación y probar también con el GPS desactivado: debe mostrar un mensaje.
- [ ] Iniciar nivel, inclinar celular y comprobar cambios en X/Y/Z y la burbuja.
- [ ] Apoyar celular horizontalmente: la burbuja debe estar aproximadamente centrada y verde.
- [ ] Detener el sensor y comprobar que los valores dejan de cambiar.
- [ ] Cambiar de pestaña y volver a cámara/nivel; bloquear y desbloquear el celular.
- [ ] Instalar y abrir el APK con Metro apagado.
- [ ] Comprobar enlaces públicos en ventana privada.

Repetir las pruebas en iOS si se dispone de un iPhone. No se afirma que estas pruebas físicas ya estén realizadas.

## Estructura y explicación

- `App.js`: entrada al componente principal.
- `src/Main.js`: las tres pantallas, navegación Tabs, estados y estilos.
- `app.json`: nombre, identificadores y mensajes de permisos nativos.
- `eas.json`: perfil para compilar un APK.

`useState` conserva foto, coordenadas y lecturas. `useRef` permite llamar a la cámara. `useEffect` administra el acelerómetro y elimina su suscripción al salir de la pestaña o poner la app en segundo plano. La cámara también se desmonta cuando no está visible. El sensor se consulta cada 200 ms; el nivel es orientativo y no es un instrumento de precisión.

Las fotos quedan en caché temporal, no en la galería. No hay backend, cuentas dentro de la app ni historial de ubicación. El acceso externo a mapas puede necesitar internet.

## Referencias

El proyecto se ajustó a Expo SDK 57 para Expo Go con soporte SDK 57. Se verificaron dependencias con `expo install --check` y se generó correctamente el bundle Hermes de Android con `expo export --platform android`. Esto no equivale a generar un APK ni a probar el hardware en un celular. El APK y los enlaces públicos aún deben generarse y comprobarse.

- https://docs.expo.dev/versions/latest/sdk/camera/
- https://docs.expo.dev/versions/latest/sdk/location/
- https://docs.expo.dev/versions/latest/sdk/accelerometer/
- https://docs.expo.dev/build-reference/apk/



