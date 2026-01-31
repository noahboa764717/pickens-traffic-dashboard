const ADMIN_PASSWORD = "pickens123";
let adminUnlocked = false;

const dashboard = document.getElementById("dashboard");
const camsRef = db.collection("cameras");
const adminPanel = document.getElementById("adminPanel");
const cameraList = document.getElementById("cameraList");

/* CREATE CAMERA */
function createCameraCard(name, desc, stream) {
  const card = document.createElement("div");
  card.className = "camera-card offline";

  card.innerHTML = `
    <h2>${name}</h2>
    <p class="cam-desc">${desc || ""}</p>
    <div class="video-wrapper">
      <div class="loader"></div>
      <video muted playsinline></video>
    </div>
  `;

  dashboard.appendChild(card);

  const video = card.querySelector("video");
  const loader = card.querySelector(".loader");

  function start() {
    video.play().catch(()=>{});
  }

  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = stream;
    video.addEventListener("loadedmetadata", start);
  } else if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(stream);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, start);
  }

  video.addEventListener("playing", () => {
    loader.style.display = "none";
    video.style.display = "block";
    card.classList.add("online");
  });

  card.onclick = () => openModal(stream);
}

/* MODAL */
function openModal(stream) {
  const modal = document.getElementById("modal");
  const modalVideo = modal.querySelector("video");

  modalVideo.pause();
  modalVideo.src = "";

  if (modalVideo.canPlayType("application/vnd.apple.mpegurl")) {
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
  modal.style.display = "none";
  modal.querySelector("video").pause();
};

/* FIREBASE SYNC */
camsRef.onSnapshot(snapshot => {
  dashboard.innerHTML = "";
  cameraList.innerHTML = "";

  snapshot.forEach(doc => {
    const cam = doc.data();
    createCameraCard(cam.name, cam.desc, cam.url);

    const li = document.createElement("li");
    li.textContent = cam.name;

    const edit = document.createElement("button");
    edit.textContent = "Edit";
    edit.onclick = () => {
      const name = prompt("Name", cam.name);
      const desc = prompt("Desc", cam.desc || "");
      const url = prompt("URL", cam.url);
      if (name && url) camsRef.doc(doc.id).update({name,desc,url});
    };

    const del = document.createElement("button");
    del.textContent = "Delete";
    del.onclick = () => camsRef.doc(doc.id).delete();

    li.append(edit, del);
    cameraList.appendChild(li);
  });
});

/* ADD CAMERA */
addCam.onclick = () => {
  if (!adminUnlocked) return;
  camsRef.add({name:camName.value, desc:camDesc.value, url:camURL.value});
  camName.value = camDesc.value = camURL.value = "";
};

/* ADMIN ACCESS */
function openAdmin() {
  const p = prompt("Admin password:");
  if (p === ADMIN_PASSWORD) {
    adminUnlocked = true;
    adminPanel.classList.add("open");
  }
}

document.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "A") openAdmin();
});

closeAdmin.onclick = () => adminPanel.classList.remove("open");

/* SECRET TAP */
let taps = 0;
secretZone.onclick = () => {
  taps++;
  if (taps >= 5) { openAdmin(); taps = 0; }
  setTimeout(()=>taps=0,2000);
};

/* UI */
mapBtn.onclick = () => mapModal.style.display = "flex";
closeMap.onclick = () => mapModal.style.display = "none";
themeToggle.onclick = () => document.body.classList.toggle("light-mode");
