const HEROES = {
    spiderman: { name: 'Spider-Man', handle: '@spiderman', avatar: 'assets/avatars/spiderman.jpg' },
    ironman: { name: 'Iron Man', handle: '@ironman', avatar: 'assets/avatars/ironman.jpg' },
    wolverine: { name: 'Wolverine', handle: '@wolverine', avatar: 'assets/avatars/wolverine.jpg' },
    thor: { name: 'Thor', handle: '@thor', avatar: 'assets/avatars/thor.jpg' },
    hulk: { name: 'Hulk', handle: '@hulk', avatar: 'assets/avatars/hulk.jpg' }
};
const POSTS_KEY = 'heropulse.posts.v1';
const SEED_POSTS = [
    { id: 'seed-1', hero: 'ironman', text: 'Revisé los sistemas de energía: todo listo para la próxima misión.', createdAt: Date.now() - 1000 * 60 * 9, likes: 8, liked: false, pending: false },
    { id: 'seed-2', hero: 'wolverine', text: 'Patrulla tranquila por el sector norte. Mantengan la guardia alta.', createdAt: Date.now() - 1000 * 60 * 36, likes: 5, liked: false, pending: false },
    { id: 'seed-3', hero: 'spiderman', text: 'La ciudad está a salvo. Y sí, también traje café para el equipo.', createdAt: Date.now() - 1000 * 60 * 82, likes: 12, liked: false, pending: false }
];

const feed = document.querySelector('#feed-list');
const filterSelect = document.querySelector('#feed-filter');
const form = document.querySelector('#update-form');
const messageField = document.querySelector('#update-text');
const heroSelect = document.querySelector('#hero-select');
const statusLabel = document.querySelector('#connection-label');
const syncLabel = document.querySelector('#sync-label');
const connectionCard = document.querySelector('.connection-card');
const appMessage = document.querySelector('#app-message');
const pendingCount = document.querySelector('#pending-count');
const updatesCount = document.querySelector('#updates-count');
const notificationButton = document.querySelector('#notifications-button');
let posts = loadPosts();
let messageTimeout;

function loadPosts() {
    try {
        const saved = localStorage.getItem(POSTS_KEY);
        if (!saved) return SEED_POSTS;
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) throw new Error('El formato guardado no es válido.');
        return parsed.filter((post) =>
            post && HEROES[post.hero] && typeof post.text === 'string' && typeof post.id === 'string' &&
            Number.isFinite(post.createdAt) && Number.isFinite(post.likes) && post.likes >= 0
        );
    } catch (error) {
        console.error('No se pudieron leer las actualizaciones guardadas:', error);
        showMessage('No se pudo leer el historial local. Se mostrará el contenido de ejemplo.');
        return SEED_POSTS;
    }
}

function savePosts() {
    try {
        localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
        return true;
    } catch (error) {
        console.error('No se pudo guardar el historial local:', error);
        showMessage('No se pudo guardar en este dispositivo. Comprueba el espacio disponible.');
        return false;
    }
}

function showMessage(message) {
    appMessage.textContent = message;
    appMessage.classList.add('visible');
    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => appMessage.classList.remove('visible'), 4200);
}

function formatTime(timestamp) {
    const elapsed = Math.max(0, Date.now() - timestamp);
    const minutes = Math.floor(elapsed / 60000);
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;
    return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' }).format(timestamp);
}

function renderTeam() {
    const list = document.querySelector('#team-list');
    Object.entries(HEROES).forEach(([key, hero]) => {
        const member = document.createElement('div');
        member.className = 'team-member';
        const avatar = document.createElement('img');
        avatar.src = hero.avatar;
        avatar.alt = '';
        const name = document.createElement('span');
        name.textContent = hero.name;
        const dot = document.createElement('span');
        dot.className = 'member-dot';
        dot.setAttribute('aria-label', 'Disponible');
        member.append(avatar, name, dot);
        list.append(member);
    });
    document.querySelector('#composer-avatar').src = HEROES[heroSelect.value].avatar;
    const hour = new Date().getHours();
    document.querySelector('#welcome-title').textContent =
        `${hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'}, equipo.`;
}

function renderPosts() {
    const selectedHero = filterSelect.value;
    const visiblePosts = posts.filter((post) => selectedHero === 'all' || post.hero === selectedHero);
    feed.replaceChildren();
    visiblePosts.forEach((post) => {
        const hero = HEROES[post.hero];
        const card = document.createElement('article');
        card.className = 'update-card';

        const header = document.createElement('div');
        header.className = 'update-header';
        const avatar = document.createElement('img');
        avatar.src = hero.avatar;
        avatar.alt = '';
        const identity = document.createElement('div');
        identity.className = 'update-identity';
        const name = document.createElement('strong');
        name.textContent = hero.name;
        const handle = document.createElement('span');
        handle.textContent = hero.handle;
        identity.append(name, handle);
        const time = document.createElement('time');
        time.className = 'update-time';
        time.dateTime = new Date(post.createdAt).toISOString();
        time.textContent = formatTime(post.createdAt);
        header.append(avatar, identity, time);

        const text = document.createElement('p');
        text.className = 'update-text';
        text.textContent = post.text;

        const footer = document.createElement('div');
        footer.className = 'update-meta';
        const like = document.createElement('button');
        like.className = `like-button${post.liked ? ' liked' : ''}`;
        like.type = 'button';
        like.textContent = `♡ ${post.likes} me gusta`;
        like.setAttribute('aria-pressed', String(Boolean(post.liked)));
        like.addEventListener('click', () => {
            post.liked = !post.liked;
            post.likes += post.liked ? 1 : -1;
            savePosts();
            renderPosts();
        });
        footer.append(like);

        if (post.pending) {
            const pending = document.createElement('span');
            pending.className = 'pending-tag';
            pending.textContent = 'Pendiente';
            footer.append(pending);
        }

        card.append(header, text, footer);
        feed.append(card);
    });

    document.querySelector('#empty-state').hidden = visiblePosts.length > 0;
    updatesCount.textContent = String(posts.length);
    pendingCount.textContent = String(posts.filter((post) => post.pending).length);
}

function updateConnectionStatus() {
    const online = navigator.onLine;
    connectionCard.classList.toggle('offline', !online);
    statusLabel.textContent = online ? 'Conexión activa' : 'Sin conexión';
    syncLabel.textContent = online ? 'Tu equipo está conectado' : 'Modo sin conexión activo';
}

async function sendPendingPosts() {
    if (!navigator.onLine) {
        updateConnectionStatus();
        return;
    }

    const pending = posts.filter((post) => post.pending);
    for (const post of pending) {
        try {
            const response = await fetch('/api/push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `${HEROES[post.hero].name} · HeroPulse`,
                    body: post.text
                })
            });
            if (!response.ok) throw new Error(`El servidor respondió ${response.status}.`);
            post.pending = false;
            savePosts();
        } catch (error) {
            console.error('No se pudo sincronizar la actualización:', error);
            showMessage('La actualización sigue guardada y se enviará cuando el servidor esté disponible.');
            break;
        }
    }

    renderPosts();
    if (posts.some((post) => post.pending)) {
        syncLabel.textContent = 'Hay avisos esperando al servidor';
    } else {
        updateConnectionStatus();
    }
}

function urlBase64ToUint8Array(value) {
    const padding = '='.repeat((4 - value.length % 4) % 4);
    const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
    return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

async function enableNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        showMessage('Este navegador no admite notificaciones push.');
        return;
    }
    if (!window.isSecureContext) {
        showMessage('Las notificaciones requieren HTTPS o localhost.');
        return;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            showMessage('No se concedió permiso para mostrar notificaciones.');
            return;
        }

        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
            const configResponse = await fetch('/api/config');
            if (!configResponse.ok) throw new Error(`No se pudo obtener la configuración (${configResponse.status}).`);
            const config = await configResponse.json();
            if (!config.publicKey) throw new Error('El servidor no tiene configurada la clave pública VAPID.');
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(config.publicKey)
            });
        }

        const response = await fetch('/api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
        });
        if (!response.ok) throw new Error(`No se pudo registrar la suscripción (${response.status}).`);
        notificationButton.innerHTML = '<span aria-hidden="true">✓</span><span>Avisos activados</span>';
        showMessage('¡Listo! Recibirás avisos de las actualizaciones del equipo.');
    } catch (error) {
        console.error('No se pudieron activar las notificaciones:', error);
        showMessage(`No se pudieron activar las notificaciones: ${error.message}`);
    }
}

document.querySelector('#update-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const text = messageField.value.trim();
    if (!text) {
        showMessage('Escribe una actualización antes de publicarla.');
        return;
    }

    posts.unshift({
        id: window.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        hero: heroSelect.value,
        text,
        createdAt: Date.now(),
        likes: 0,
        liked: false,
        pending: true
    });
    savePosts();
    messageField.value = '';
    document.querySelector('#character-count').textContent = '0 / 280';
    filterSelect.value = 'all';
    renderPosts();
    showMessage(navigator.onLine
        ? 'Actualización guardada. Sincronizando con el servidor...'
        : 'Actualización guardada en este dispositivo; se enviará al reconectar.');
    sendPendingPosts();
});

heroSelect.addEventListener('change', () => {
    document.querySelector('#composer-avatar').src = HEROES[heroSelect.value].avatar;
});
messageField.addEventListener('input', () => {
    document.querySelector('#character-count').textContent = `${messageField.value.length} / 280`;
});
filterSelect.addEventListener('change', renderPosts);
notificationButton.addEventListener('click', enableNotifications);
document.querySelectorAll('.nav-item').forEach((button) => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach((item) => item.classList.remove('active'));
        button.classList.add('active');
        if (button.dataset.view === 'team') {
            document.querySelector('#page-title').textContent = 'Mi equipo';
            filterSelect.value = 'all';
            showMessage('Los cinco héroes están disponibles en el equipo.');
        } else {
            document.querySelector('#page-title').textContent = 'Centro de actividad';
        }
    });
});

window.addEventListener('online', () => {
    updateConnectionStatus();
    showMessage('Conexión recuperada. Sincronizando actualizaciones...');
    sendPendingPosts();
});
window.addEventListener('offline', updateConnectionStatus);

renderTeam();
renderPosts();
updateConnectionStatus();
sendPendingPosts();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(() => navigator.serviceWorker.ready)
            .catch((error) => {
                console.error('No se pudo registrar el service worker:', error);
                showMessage('No se pudo preparar el modo sin conexión.');
            });
    });
}
