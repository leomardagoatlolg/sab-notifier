const express = require('express');
const cors = require('cors');
const axios = require('axios');
const webpush = require('web-push');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Config (customize here)
const PLACE_ID = 109983668079237; // Steal a Brainrot Place ID (Dec 2025)
const MIN_VALUE = 10; // Min value in millions (10m+)
const KEYWORDS = ['admin abuse', 'mutation', 'legendary', 'mythic', 'crab rave', 'concert', 'event started'];
const POLL_INTERVAL = 25000; // 25s

// VAPID keys for push (generate once: npx web-push generate-vapid-keys)
const vapidKeys = {
  publicKey: 'YOUR_PUBLIC_VAPID_KEY_HERE', // Replace after generating
  privateKey: 'YOUR_PRIVATE_VAPID_KEY_HERE'
};
webpush.setVapidDetails('mailto:your-email@example.com', vapidKeys.publicKey, vapidKeys.privateKey);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory subscriptions (use DB for production)
let subscriptions = [];

// Endpoint: Subscribe for push
app.post('/subscribe', (req, res) => {
  const subscription = req.body;
  subscriptions.push(subscription);
  res.status(201).json({ message: 'Subscribed!' });
});

// Endpoint: Get live servers/alerts
app.get('/api/servers', async (req, res) => {
  try {
    const servers = [];
    let cursor = null;
    do {
      const params = { sortOrder: 'Asc', limit: 100 };
      if (cursor) params.cursor = cursor;
      const { data } = await axios.get(`https://games.roblox.com/v1/games/${PLACE_ID}/servers/Public`, { params });
      servers.push(...data.data);
      cursor = data.nextPageCursor;
    } while (cursor);

    // Filter high-pop servers (>10 players)
    const activeServers = servers.filter(s => s.playing >= 10);

    // Simulate chat scan (in real: use ro.py or proxy chat API with auth)
    // For demo: Randomly generate alerts (replace with real axios to chat endpoints)
    const alerts = [];
    activeServers.forEach(server => {
      // Mock: 1% chance of alert per server (real: scan messages)
      if (Math.random() < 0.01) {
        const value = Math.floor(Math.random() * 989) + 10; // 10-999m, scale to b
        const unit = value >= 1000 ? 'b' : 'm';
        const alertValue = value >= 1000 ? value / 1000 : value;
        alerts.push({
          serverId: server.id,
          players: server.playing,
          message: `Legendary Brainrot spawned! Value: ${alertValue}${unit}`,
          joinUrl: `https://www.roblox.com/games/${PLACE_ID}/${server.id}`
        });
        // Send push
        subscriptions.forEach(sub => {
          webpush.sendNotification(sub, JSON.stringify({
            title: '🧠 Brainrot Alert!',
            body: `${alertValue}${unit} value in server ${server.id} (${server.playing} players)`,
            icon: '/icon.png', // Add an icon in public/
            url: `https://www.roblox.com/games/${PLACE_ID}/${server.id}`
          })).catch(err => console.error('Push error:', err));
        });
      }
    });

    res.json({ servers: activeServers.slice(0, 50), alerts }); // Limit for perf
  } catch (err) {
    res.status(500).json({ error: 'API fetch failed' });
  }
});

// Poll loop (starts on boot)
setInterval(async () => {
  // Trigger a scan (integrate real chat fetch here)
  console.log('Scanning servers...');
  // In full version: Fetch chats via unofficial API (e.g., https://chat.roblox.com/v2/... with cookie)
}, POLL_INTERVAL);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));ser
