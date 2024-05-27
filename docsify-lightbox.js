// docsify-lightbox.js

class Lightbox {
  constructor() {
    this.lightbox = document.createElement('div');
    this.lightbox.id = 'lightbox';
    this.lightbox.classList.add('lightbox');
    document.body.appendChild(this.lightbox);

    this.lightbox.innerHTML = `
      <span class="close">&times;</span>
      <img class="lightbox-image" id="lightbox-img">
      <div class="caption" id="lightbox-caption"></div>
      <div class="nav">
        <div class="prev" id="prev">&#10094;</div>
        <div class="next" id="next">&#10095;</div>
      </div>
      <div class="controls">
        <button id="play">Play</button>
        <label for="speed">Speed:</label>
        <input type="number" id="speed" value="1" step="0.1" min="-32" max="32">
      </div>
    `;

    this.lightboxImg = this.lightbox.querySelector('#lightbox-img');
    this.lightboxCaption = this.lightbox.querySelector('#lightbox-caption');
    this.closeBtn = this.lightbox.querySelector('.close');
    this.nextBtn = this.lightbox.querySelector('#next');
    this.prevBtn = this.lightbox.querySelector('#prev');
    this.playBtn = this.lightbox.querySelector('#play');
    this.speedInput = this.lightbox.querySelector('#speed');

    this.images = [];
    this.currentIndex = 0;
    this.playbackInterval = null;

    this.closeBtn.addEventListener('click', () => this.closeLightbox());
    this.nextBtn.addEventListener('click', () => this.showNext());
    this.prevBtn.addEventListener('click', () => this.showPrev());
    this.playBtn.addEventListener('click', () => this.togglePlayback());
    this.speedInput.addEventListener('input', () => this.updateSpeed());

    this.lightbox.addEventListener('click', (e) => {
      if (e.target === this.lightbox || e.target === this.closeBtn) {
        this.closeLightbox();
      }
    });

    this.addScrollSupport();
    this.addTouchSupport();
  }

  initialize(images) {
    this.images = images;
    this.images.forEach((img, index) => {
      img.addEventListener('click', () => this.showLightbox(index));
    });
  }

  showLightbox(index) {
    this.currentIndex = index;
    this.lightboxImg.src = this.images[this.currentIndex].src;
    this.lightboxCaption.textContent = this.images[this.currentIndex].alt || '';
    this.lightbox.classList.add('show');
    document.body.classList.add('no-scroll');
  }

  closeLightbox() {
    this.lightbox.classList.remove('show');
    document.body.classList.remove('no-scroll');
    this.stopPlayback();
  }

  showNext() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this.showLightbox(this.currentIndex);
  }

  showPrev() {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.showLightbox(this.currentIndex);
  }

  togglePlayback() {
    if (this.playbackInterval) {
      this.stopPlayback();
    } else {
      this.startPlayback();
    }
  }

  startPlayback() {
    const speed = parseFloat(this.speedInput.value);
    const interval = 1000 / Math.abs(speed);
    this.playbackInterval = setInterval(() => {
      if (speed > 0) {
        this.showNext();
      } else if (speed < 0) {
        this.showPrev();
      }
    }, interval);
    this.playBtn.textContent = 'Stop';
  }

  stopPlayback() {
    clearInterval(this.playbackInterval);
    this.playbackInterval = null;
    this.playBtn.textContent = 'Play';
  }

  updateSpeed() {
    if (this.playbackInterval) {
      this.stopPlayback();
      this.startPlayback();
    }
  }

  addTouchSupport() {
    let startX = 0;
    this.lightbox.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    });

    this.lightbox.addEventListener('touchend', (e) => {
      let endX = e.changedTouches[0].clientX;
      if (startX - endX > 50) {
        this.showNext();
      } else if (endX - startX > 50) {
        this.showPrev();
      }
    });
  }

  addScrollSupport() {
    this.lightbox.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.deltaY > 0) {
        this.showNext();
      } else {
        this.showPrev();
      }
    });
  }
}

export default Lightbox;
