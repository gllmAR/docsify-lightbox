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
        <button id="play">▶️</button>
        <span id="speed-emoji">➡️</span>
        <label id="speed-value">1x</label>
        <input type="range" id="speed-slider" min="-32" max="32" step="0.1" value="1">
        <button id="reset">🔄</button>
      </div>
    `;

    this.lightboxImg = this.lightbox.querySelector('#lightbox-img');
    this.lightboxCaption = this.lightbox.querySelector('#lightbox-caption');
    this.closeBtn = this.lightbox.querySelector('.close');
    this.nextBtn = this.lightbox.querySelector('#next');
    this.prevBtn = this.lightbox.querySelector('#prev');
    this.playBtn = this.lightbox.querySelector('#play');
    this.speedSlider = this.lightbox.querySelector('#speed-slider');
    this.speedEmoji = this.lightbox.querySelector('#speed-emoji');
    this.speedValue = this.lightbox.querySelector('#speed-value');
    this.resetBtn = this.lightbox.querySelector('#reset');
    this.nav = this.lightbox.querySelector('.nav');
    this.controls = this.lightbox.querySelector('.controls');

    this.images = [];
    this.currentIndex = 0;
    this.playbackInterval = null;
    this.hideTimeout = null;

    this.closeBtn.addEventListener('click', () => this.closeLightbox());
    this.nextBtn.addEventListener('click', () => this.showNext());
    this.prevBtn.addEventListener('click', () => this.showPrev());
    this.playBtn.addEventListener('click', () => this.togglePlayback());
    this.speedSlider.addEventListener('input', this.debounce(() => this.updateSpeed(), 200));
    this.resetBtn.addEventListener('click', () => this.resetSpeed());

    this.lightbox.addEventListener('click', (e) => {
      if (e.target === this.lightbox || e.target === this.closeBtn) {
        this.closeLightbox();
      }
    });

    this.addScrollSupport();
    this.addTouchSupport();
    this.setupAutoHide();
  }

  initialize(images) {
    console.log('Initializing Lightbox with images:', images); // Debugging log
    this.images = images;
    this.images.forEach((img, index) => {
      console.log('Attaching click event to image', img); // Debugging log
      img.addEventListener('click', () => this.showLightbox(index));
    });
  }

  showLightbox(index) {
    console.log('Showing lightbox for image index:', index); // Debugging log
    this.currentIndex = index;
    this.lightboxImg.src = this.images[this.currentIndex].src;
    this.lightboxCaption.textContent = this.images[this.currentIndex].alt || '';
    this.lightbox.classList.add('show');
    document.body.classList.add('no-scroll');
    this.resetHideTimeout();
  }

  closeLightbox() {
    console.log('Closing lightbox'); // Debugging log
    this.lightbox.classList.remove('show');
    document.body.classList.remove('no-scroll');
    this.stopPlayback();
  }

  showNext() {
    console.log('Showing next image'); // Debugging log
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this.showLightbox(this.currentIndex);
  }

  showPrev() {
    console.log('Showing previous image'); // Debugging log
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
    const speed = parseFloat(this.speedSlider.value);
    const interval = 1000 / Math.abs(speed);
    this.playbackInterval = setInterval(() => {
      if (speed > 0) {
        this.showNext();
      } else if (speed < 0) {
        this.showPrev();
      }
    }, interval);
    this.playBtn.textContent = '⏸️';
  }

  stopPlayback() {
    clearInterval(this.playbackInterval);
    this.playbackInterval = null;
    this.playBtn.textContent = '▶️';
  }

  updateSpeed() {
    const speed = parseFloat(this.speedSlider.value);
    this.speedValue.textContent = `${speed}x`;
    this.speedEmoji.textContent = this.getSpeedEmoji(speed);
    if (this.playbackInterval) {
      this.stopPlayback();
      this.startPlayback();
    }
    this.resetHideTimeout(); // Reset timeout on speed change
  }

  resetSpeed() {
    this.speedSlider.value = 1;
    this.updateSpeed();
  }

  getSpeedEmoji(speed) {
    const absSpeed = Math.abs(speed);
    if (absSpeed > 24) {
      return speed < 0 ? '⇇' : '⇉';
    } else if (absSpeed > 16) {
      return speed < 0 ? '↤' : '↦';
    } else if (absSpeed > 8) {
      return speed < 0 ? '⬱' : '⬰';
    } else {
      return speed < 0 ? '⬅️' : '➡️';
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

  setupAutoHide() {
    this.lightbox.addEventListener('mousemove', () => this.resetHideTimeout());
    this.lightbox.addEventListener('click', () => this.resetHideTimeout());
    this.lightbox.addEventListener('touchstart', () => this.resetHideTimeout());

    this.resetHideTimeout();
  }

  resetHideTimeout() {
    if (this.hideTimeout) clearTimeout(this.hideTimeout);

    this.showControls();
    this.hideTimeout = setTimeout(() => this.hideControls(), 3000);
  }

  showControls() {
    this.controls.style.display = 'flex';
    this.nav.style.display = 'flex';
    this.closeBtn.style.display = 'block';
  }

  hideControls() {
    this.controls.style.display = 'none';
    this.nav.style.display = 'none';
    this.closeBtn.style.display = 'none';
  }

  debounce(func, wait) {
    let timeout;
    return function (...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

export default Lightbox;
