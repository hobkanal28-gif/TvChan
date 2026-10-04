// Konfigurasi
const PROXY_URL = 'http://localhost:3030/m3u8-proxy?url='; // Ganti dengan URL proxy Anda
const PLAYLIST_URL = 'https://raw.githubusercontent.com/riotryulianto/iptv-playlists/main/indonesia.m3u'; // Contoh playlist Indonesia

// Elemen DOM
const video = document.getElementById('video-player');
const channelList = document.getElementById('channel-list');
const searchInput = document.getElementById('search-input');

let hls = new Hls(); // Instance HLS.js
let channels = [];

// Fungsi untuk memuat playlist
async function loadPlaylist() {
    try {
        const response = await fetch(PLAYLIST_URL);
        const text = await response.text();
        channels = parseM3U(text);
        renderChannels(channels);
    } catch (error) {
        console.error('Gagal memuat playlist:', error);
        channelList.innerHTML = '<p>Gagal memuat daftar channel.</p>';
    }
}

// Parser sederhana untuk file M3U
function parseM3U(m3uText) {
    const lines = m3uText.split('\n');
    const channelData = [];
    let currentChannel = {};

    lines.forEach(line => {
        line = line.trim();
        if (line.startsWith('#EXTINF:')) {
            const info = line.substring(8);
            const commaIndex = info.indexOf(',');
            if (commaIndex > -1) {
                const metadata = info.substring(0, commaIndex);
                const name = info.substring(commaIndex + 1).trim();
                
                const logoMatch = metadata.match(/tvg-logo="([^"]+)"/);
                const groupMatch = metadata.match(/group-title="([^"]+)"/);

                currentChannel = {
                    name: name,
                    logo: logoMatch ? logoMatch[1] : 'https://via.placeholder.com/60',
                    group: groupMatch ? groupMatch[1] : 'Lainnya'
                };
            }
        } else if (line.startsWith('http')) {
            currentChannel.url = line;
            if (currentChannel.name && currentChannel.url) {
                channelData.push(currentChannel);
            }
            currentChannel = {};
        }
    });

    return channelData;
}

// Fungsi untuk menampilkan channel ke UI
function renderChannels(channelArray) {
    channelList.innerHTML = '';
    channelArray.forEach((channel, index) => {
        const card = document.createElement('div');
        card.className = 'channel-card';
        card.innerHTML = `
            <img src="${channel.logo}" alt="${channel.name}" class="channel-logo" onerror="this.src='https://via.placeholder.com/60'; this.alt='Logo tidak tersedia';">
            <div class="channel-name">${channel.name}</div>
        `;
        card.addEventListener('click', () => playChannel(index));
        channelList.appendChild(card);
    });
}

// Fungsi untuk memutar channel
function playChannel(index) {
    const channel = channels[index];
    if (!channel) return;

    // Gunakan proxy untuk URL stream
    const proxiedUrl = PROXY_URL + encodeURIComponent(channel.url);

    if (Hls.isSupported()) {
        hls.loadSource(proxiedUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
            video.play();
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Untuk browser yang mendukung HLS secara native (misalnya Safari)
        video.src = proxiedUrl;
        video.addEventListener('loadedmetadata', function() {
            video.play();
        });
    }
}

// Fitur pencarian
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = channels.filter(ch => ch.name.toLowerCase().includes(query));
    renderChannels(filtered);
});

// Muat playlist saat aplikasi dimulai
loadPlaylist();