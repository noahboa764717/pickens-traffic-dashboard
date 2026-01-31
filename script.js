const ADMIN_PASSWORD = "pickens123"; // change this
let adminUnlocked = false;

const dashboard = document.getElementById('dashboard');
const camsRef = db.collection("cameras");

/* =========================
   CREATE CAMERA CARD
========================= */
function createCameraCard(name, stream) {
  const card = document.createElement('div');
  card.className = 'camera-card offline';
  card.innerHTML = `
    <h2>${name}</h2>
    <p class="timestamp">Loading…</p>
    <div class="video-wrapper">
      <div class="loader"></div>
      <video muted playsinline></video>
    </div>`;
  dashboard.appendChild(card);

  const video = card.querySelector('video');
  const loader = card.querySelector('.loader');
  const timeEl = card.querySelector('.timestamp');

  function markOnline() {
    card.classList.add('online');
    card.classList.remove('offline');
    timeEl.textContent = "Live as of " + new Date().toLocaleTimeString();
  }

  function markOffline() {
    card.classList.add('offline');
    card.classList.remove('online');
  }

  function startPlayback() {
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        console.log("Autoplay blocked — waiting for user interaction");
      });
    }
  }

  /* HLS STREAM SETUP */
  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = stream;
    video.addEventListener('loadedmetadata', startPlayback);
  } else if (Hls.isSupported()) {
    const hls = new Hls({ liveSyncDurationCount: 3 });
    hls.loadSource(stream);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, startPlayback);
    hls.on(Hls.Events.ERROR, () => markOffline());
  }

  video.addEventListener('canplay', () => {
    loader.style.display = "none";
    video.style.display = "block";
    markOnline();
  });

  video.addEventListener('error', () => {
    markOffline();
    setTimeout(() => video.load(), 5000);
  });

  /* MODAL PLAYBACK */
  card.onclick = () => {
    const modal = document.getElementById('modal');
    const modalVideo = modal.querySelector('video');

    if (modalVideo.canPlayType('application/vnd.apple.mpegurl')) {
      modalVideo.src = stream;
    } else if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(stream);
      hls.attachMedia(modalVideo);
    }

    modalVideo.muted = false;
    modalVideo.play().catch(()=>{});
    modal.style.display = "flex";
  };
}

/* =========================
   FIREBASE REALTIME LOAD
========================= */
camsRef.onSnapshot(snapshot => {
  dashboard.innerHTML = "";
  snapshot.forEach(doc => createCameraCard(doc.data().name, doc.data().url));
});

/* =========================
   ADMIN ADD CAMERA
========================= */
document.getElementById('addCam').onclick = () => {
  if (!adminUnlocked) return alert("Admin locked");
  const name = camName.value;
  const url = camURL.value;
  if (!name || !url) return;
  camsRef.add({ name, url });
  camName.value = '';
  camURL.value = '';
};

/* =========================
   ADMIN LOGIN
========================= */
function openAdminLogin() {
  const entered = prompt("Enter admin password:");
  if (entered === ADMIN_PASSWORD) {
    adminUnlocked = true;
    document.getElementById('adminPanel').classList.add('open');
  } else if (entered !== null) alert("Wrong password");
}

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
    openAdminLogin();
  }
});

/* Secret mobile tap */
let tapCount = 0;
secretZone.addEventListener('click', () => {
  tapCount++;
  if (tapCount >= 5) { openAdminLogin(); tapCount = 0; }
  setTimeout(() => tapCount = 0, 2000);
});

/* =========================
   UI BUTTONS
========================= */
mapBtn.onclick = () => mapModal.style.display = "flex";
closeMap.onclick = () => mapModal.style.display = "none";
close.onclick = () => modal.style.display = "none";
themeToggle.onclick = () => document.body.classList.toggle('light-mode');
