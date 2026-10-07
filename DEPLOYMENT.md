# HeroPulse

PWA independiente para publicar actualizaciones del equipo de héroes. Su diseño de centro de operaciones es distinto a Twittor; toma del proyecto original los avatares y del proyecto `server` el servicio Web Push.

## Ejecutar con el servidor

1. Configura `VAPID_PUBLIC` y `VAPID_PRIVATE` en `server/.env` (puedes generarlas con `npx web-push generate-vapid-keys`).
2. Desde la carpeta `server`, ejecuta `npm start`.
3. Abre [http://localhost:3000](http://localhost:3000). La aplicación y la API quedan en el mismo origen.

La clave privada VAPID solo se configura en el servidor. El servidor entrega la clave pública a la aplicación.

## Uso

- La aplicación guarda las actualizaciones y los «me gusta» en el almacenamiento local del dispositivo.
- Puedes publicar sin conexión; los avisos pendientes se envían a la API al recuperar la conexión.
- Usa **Activar avisos** para permitir notificaciones push. Push necesita un navegador compatible, permiso del usuario y un contexto seguro (`localhost` o HTTPS).
- Para desplegar en producción, sirve `hero-pulse` por HTTPS y ejecuta la API en el mismo origen o configura un proxy `/api`.
