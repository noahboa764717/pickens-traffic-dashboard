document.querySelectorAll('.camera-card').forEach(card => {
  const video = card.querySelector('video');
  const loader = card.querySelector('.loader');
  const stream = card.dataset.stream;

  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    // Safari/iOS
    video.src = stream;
  } else if (Hls.isSupported()) {
    // Other browsers
    const hls = new Hls();
    hls.loadSource(stream);
    hls.attachMedia(video);
  }

  video.muted = true;
  video.play().catch(() => {});

  video.addEventListener('canplay', () => {
    loader.style.display = "none";
    video.style.display = "block";
  });

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

    modal.style.display = "flex";
  };
});

document.getElementById('close').onclick = () => {
  const modal = document.getElementById('modal');
  const video = modal.querySelector('video');
  video.pause();
  video.src = "";
  modal.style.display = "none";
};
