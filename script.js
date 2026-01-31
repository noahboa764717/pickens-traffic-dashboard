document.querySelectorAll('.camera-card').forEach(card => {
  const video = card.querySelector('video');
  const loader = card.querySelector('.loader');
  const stream = card.dataset.stream;

  video.src = stream;
  video.autoplay = true;

  video.oncanplay = () => {
    loader.style.display = "none";
    video.style.display = "block";
  };

  card.onclick = () => {
    const modal = document.getElementById('modal');
    const modalVideo = modal.querySelector('video');
    modalVideo.src = stream;
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