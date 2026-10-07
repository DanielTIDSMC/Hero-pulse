const express = require('express');
const webpush = require('web-push');
const cors = require('cors');

const app = express();
const port = Number(process.env.PORT) || 3000;
const allowedOrigins = (process.env.FRONTEND_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

if (!process.env.VAPID_PUBLIC || !process.env.VAPID_PRIVATE) {
    throw new Error('Configura VAPID_PUBLIC y VAPID_PRIVATE en las variables de entorno.');
}

webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
    process.env.VAPID_PUBLIC,
    process.env.VAPID_PRIVATE
);

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error(`Origen no autorizado por CORS: ${origin}`));
    }
}));
app.use(express.json({ limit: '16kb' }));

let subscriptions = [];

app.get('/api/health', (req, res) => {
    res.json({ ok: true });
});

app.get('/api/config', (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC });
});

app.post('/api/subscribe', (req, res) => {
    const subscription = req.body;
    if (!subscription || typeof subscription.endpoint !== 'string' ||
        !subscription.endpoint.startsWith('https://') ||
        !subscription.keys || typeof subscription.keys.p256dh !== 'string' ||
        typeof subscription.keys.auth !== 'string') {
        res.status(400).json({ error: 'La suscripción push no es válida.' });
        return;
    }

    if (!subscriptions.some((item) => item.endpoint === subscription.endpoint)) {
        subscriptions.push(subscription);
    }
    res.status(201).json({ ok: true });
});

app.post('/api/push', async (req, res) => {
    const { title, body } = req.body || {};
    if (typeof title !== 'string' || !title.trim() ||
        typeof body !== 'string' || !body.trim() ||
        title.length > 100 || body.length > 280) {
        res.status(400).json({ error: 'El título o el mensaje no son válidos.' });
        return;
    }

    const payload = JSON.stringify({ title: title.trim(), body: body.trim() });
    let sent = 0;
    let failed = 0;

    for (const subscription of subscriptions) {
        try {
            await webpush.sendNotification(subscription, payload);
            sent++;
        } catch (error) {
            if (error.statusCode === 404 || error.statusCode === 410) {
                subscriptions = subscriptions.filter((item) => item.endpoint !== subscription.endpoint);
            } else {
                failed++;
                console.error('No se pudo enviar una notificación push:', error);
            }
        }
    }

    res.json({ sent, failed });
});

app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Ruta de API no encontrada.' });
});

app.listen(port, () => {
    console.log(`HeroPulse API activa en el puerto ${port}`);
});
