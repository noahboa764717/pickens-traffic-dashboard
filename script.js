const ADMIN_PASSWORD = "pickens123";
let adminUnlocked = false;

const dashboard = document.getElementById('dashboard');
const camsRef = db.collection("cameras");
const cameraList = document.getElementById('cameraList');
const adminPanel = document.getElementById('adminPanel');

/* CAMERA CARD */
function createCameraCard(name, desc, stream) {
  const card = document.createElement('div');
  card.className = 'camera-card offline';

  card.innerHTML = `
    <h2>${name}</h2>
    <p class="cam-desc">${desc || ""}</p>
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
    video.play().catch(()=>{});
  }

  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = stream;
    video.addEventListener('loadedmetadata', startPlayback);
  } else if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(stream);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, startPlayback);
  }

  video.addEventListener('playing', () => {
    loader.style.display = "none";
    video.style.display = "block";
    markOnline();
  });

  video.addEventListener('error', markOffline);

  card.onclick = () => openModal(stream);
}

/* MODAL */
function openModal(stream) {
  const modal = document.getElementById('modal');
  const modalVideo = modal.querySelector('video');

  modalVideo.pause();
  modalVideo.src = "";

  if (modalVideo.canPlayType('application/vnd.apple.mpegurl')) {
    modalVideo.src = stream;
  } else if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(stream);
    hls.attachMedia(modalVideo);
  }

  modalVideo.play().catch(()=>{});
  modal.style.display = "flex";
}

close.onclick = () => {
  const modalVideo = modal.querySelector('video');
  modalVideo.pause();
  modalVideo.src = "";
  modal.style.display = "none";
};

modal.addEventListener('click', e => { if (e.target === modal) close.onclick(); });

/* FIREBASE SYNC */
camsRef.onSnapshot(snapshot => {
  dashboard.innerHTML = "";
  cameraList.innerHTML = "";

  snapshot.forEach(doc => {
    const cam = doc.data();
    createCameraCard(cam.name, cam.desc, cam.url);

    const li = document.createElement('li');
    li.textContent = cam.name;

    const editBtn = document.createElement('button');
    editBtn.textContent = "Edit";
    editBtn.onclick = () => editCamera(doc.id, cam);

    const delBtn = document.createElement('button');
    delBtn.textContent = "Delete";
    delBtn.onclick = () => camsRef.doc(doc.id).delete();

    li.appendChild(editBtn);
    li.appendChild(delBtn);
    cameraList.appendChild(li);
  });
});

/* ADD CAMERA */
addCam.onclick = () => {
  if (!adminUnlocked) return alert("Admin locked");
  camsRef.add({ name: camName.value, desc: camDesc.value, url: camURL.value });
  camName.value = '';
  camDesc.value = '';
  camURL.value = '';
};

/* EDIT CAMERA */
function editCamera(id, cam) {
  const name = prompt("Edit name:", cam.name);
  const desc = prompt("Edit description:", cam.desc || "");
  const url = prompt("Edit stream URL:", cam.url);
  if (name && url) camsRef.doc(id).update({ name, desc, url });
}

/* ADMIN LOGIN */
function openAdminLogin() {
  const entered = prompt("Enter admin password:");
  if (entered === ADMIN_PASSWORD) {
    adminUnlocked = true;
    adminPanel.classList.add('open');
  } else if (entered !== null) alert("Wrong password");
}

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') openAdminLogin();
});

closeAdmin.onclick = () => adminPanel.classList.remove('open');

/* Secret mobile tap */
let tapCount = 0;
secretZone.addEventListener('click', () => {
  tapCount++;
  if (tapCount >= 5) { openAdminLogin(); tapCount = 0; }
  setTimeout(() => tapCount = 0, 2000);
});

/* UI BUTTONS */
mapBtn.onclick = () => mapModal.style.display = "flex";
closeMap.onclick = () => mapModal.style.display = "none";
themeToggle.onclick = () => document.body.classList.toggle('light-mode');
