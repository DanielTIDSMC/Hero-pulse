# HeroPulse

PWA independiente para publicar actualizaciones del equipo de héroes. Su diseño de centro de operaciones es distinto a Twittor; toma del proyecto original los avatares y del proyecto `server` el servicio Web Push.

## Despliegue en Railway

El repositorio contiene el frontend de GitHub Pages y un backend independiente en `backend/`.

1. En Railway, crea un proyecto y elige **Deploy from GitHub repo**; selecciona `DanielTIDSMC/Hero-pulse`.
2. En la configuración del servicio, ajusta **Root Directory** a `/backend`. Railway instalará `backend/package.json` y ejecutará `npm start`.
3. En **Variables**, añade:
   - `VAPID_PUBLIC`: clave pública del par VAPID.
   - `VAPID_PRIVATE`: clave privada del mismo par. Guárdala solo en Railway, nunca en GitHub.
   - `VAPID_SUBJECT`: correo de contacto, por ejemplo `mailto:tu-correo@example.com`.
   - `FRONTEND_ORIGINS`: `https://danieltidsmc.github.io`
4. En **Settings → Networking**, genera un dominio público para el servicio y espera a que el despliegue termine.
5. Comprueba `https://TU-DOMINIO.up.railway.app/api/health`; debe responder `{"ok":true}`.
6. Edita `config.js` y reemplaza la cadena vacía por el dominio generado:

   ```js
   window.HEROPULSE_API_URL = 'https://TU-DOMINIO.up.railway.app';
   ```

7. Desde la carpeta del repositorio, publica el cambio:

   ```sh
   git add .
   git commit -m "Connect GitHub Pages to Railway API"
   git push
   ```

GitHub Pages volverá a publicar la PWA; pulsa **Activar avisos** y acepta el permiso para registrar tu dispositivo.

## Claves VAPID

Genera el par en una terminal con el proyecto `server` local:

```sh
npx web-push generate-vapid-keys
```

Copia los valores directamente a las variables de Railway. No los pongas en `config.js` ni en el repositorio.

## Desarrollo local

1. Configura `VAPID_PUBLIC` y `VAPID_PRIVATE` en `server/.env` (puedes generarlas con `npx web-push generate-vapid-keys`).
2. Desde la carpeta `server`, ejecuta `npm start`.
3. Abre [http://localhost:3000](http://localhost:3000). La aplicación y la API quedan en el mismo origen.

La clave privada VAPID solo se configura en el servidor. El servidor entrega la clave pública a la aplicación.

## Uso

- La aplicación guarda las actualizaciones y los «me gusta» en el almacenamiento local del dispositivo.
- Puedes publicar sin conexión; los avisos pendientes se envían a la API al recuperar la conexión.
- Usa **Activar avisos** para permitir notificaciones push. Push necesita un navegador compatible, permiso del usuario y un contexto seguro (`localhost` o HTTPS).
- Para desplegar en producción, sirve `hero-pulse` por HTTPS y ejecuta la API en el mismo origen o configura un proxy `/api`.
- Las suscripciones se guardan en memoria y se reinician cuando Railway reinicia el proceso; si eso sucede, cada usuario debe volver a activar los avisos.
