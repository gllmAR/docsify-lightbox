class Lightbox {
  constructor() {
    this.initLightbox();
    this.setupEventListeners();

    this.zoomFactor = 1;
    this.minZoomFactor = 1;
    this.imgOffsetX = 0;
    this.imgOffsetY = 0;
    this.originX = 50;
    this.originY = 50;

    this.images = [];
    this.currentIndex = 0;
    this.playbackInterval = null;
    this.hideTimeout = null;
    this.isZooming = false;
    this.nestedControlsVisible = false;
  }

  initLightbox() {
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
        <button id="toggle-playback"><span class="overlay">▶️</span></button>
        <button id="reset-zoom"><span class="overlay">🔍<sup>0</sup></span></button>
        <button id="show-slideshow-controls"><span class="overlay">⏯️</span></button>
        <button id="download-image"><span class="overlay">📥</span></button>
      </div>
      <div class="nested-controls" id="nested-controls">
        <button id="play-nested"><span class="overlay">▶️</span></button>
        <span id="speed-emoji">➡️</span>
        <label id="speed-value">1x</label>
        <input type="range" id="speed-slider" min="-32" max="32" step="0.1" value="1">
        <button id="reset-nested"><span class="overlay">🔄</span></button>
      </div>
    `;

    this.cacheDOMElements();
    this.nestedControls.style.display = 'none';
  }

  cacheDOMElements() {
    this.lightboxImg = this.lightbox.querySelector('#lightbox-img');
    this.lightboxCaption = this.lightbox.querySelector('#lightbox-caption');
    this.closeBtn = this.lightbox.querySelector('.close');
    this.nextBtn = this.lightbox.querySelector('#next');
    this.prevBtn = this.lightbox.querySelector('#prev');
    this.togglePlaybackBtn = this.lightbox.querySelector('#toggle-playback');
    this.showSlideshowControlsBtn = this.lightbox.querySelector('#show-slideshow-controls');
    this.playNestedBtn = this.lightbox.querySelector('#play-nested');
    this.speedSlider = this.lightbox.querySelector('#speed-slider');
    this.speedEmoji = this.lightbox.querySelector('#speed-emoji');
    this.speedValue = this.lightbox.querySelector('#speed-value');
    this.resetNestedBtn = this.lightbox.querySelector('#reset-nested');
    this.resetZoomBtn = this.lightbox.querySelector('#reset-zoom');
    this.downloadImageBtn = this.lightbox.querySelector('#download-image');
    this.nestedControls = this.lightbox.querySelector('#nested-controls');
    this.nav = this.lightbox.querySelector('.nav');
    this.controls = this.lightbox.querySelector('.controls');
  }

  setupEventListeners() {
    this.closeBtn.addEventListener('click', this.closeLightbox);
    this.nextBtn.addEventListener('click', this.showNext);
    this.prevBtn.addEventListener('click', this.showPrev);
    this.togglePlaybackBtn.addEventListener('click', this.togglePlayback);
    this.showSlideshowControlsBtn.addEventListener('click', this.toggleNestedControls);
    this.playNestedBtn.addEventListener('click', this.togglePlayback);
    this.speedSlider.addEventListener('input', this.debounce(this.updateSpeed, 200));
    this.resetNestedBtn.addEventListener('click', this.resetSpeed);
    this.resetZoomBtn.addEventListener('click', this.resetZoom);
    this.downloadImageBtn.addEventListener('click', this.downloadImage);

    this.lightbox.addEventListener('click', (e) => {
      if (e.target === this.lightbox || e.target === this.closeBtn) {
        this.closeLightbox();
      }
    });

    this.addScrollSupport();
    this.addTouchSupport();
    this.setupAutoHide();
    this.addKeyboardSupport();
    this.addPinchZoomSupport();
  }

  initialize(images) {
    this.images = images;
    this.images.forEach((img, index) => {
      img.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent default link behavior
        this.showLightbox(index);
      });
    });
  }

  showLightbox = (index) => {
    this.currentIndex = index;
    this.lightboxImg.src = this.images[this.currentIndex].dataset.fullResolutionUrl || this.images[this.currentIndex].src;
    this.lightboxCaption.textContent = this.images[this.currentIndex].alt || '';
    this.lightbox.classList.add('show');
    document.body.classList.add('no-scroll');
  };

  closeLightbox = () => {
    this.lightbox.classList.remove('show');
    document.body.classList.remove('no-scroll');
    this.stopPlayback();
    this.resetZoom();
  };

  showNext = () => {
    if (this.isZooming) return;
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this.showLightbox(this.currentIndex);
  };

  showPrev = () => {
    if (this.isZooming) return;
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.showLightbox(this.currentIndex);
  };

  togglePlayback = () => {
    this.playbackInterval ? this.stopPlayback() : this.startPlayback();
  };

  startPlayback() {
    const speed = parseFloat(this.speedSlider.value);
    const interval = 1000 / Math.abs(speed);
    this.playbackInterval = setInterval(() => {
      speed > 0 ? this.showNext() : this.showPrev();
    }, interval);
    this.togglePlaybackBtn.innerHTML = '<span class="overlay">⏸️</span>';
    this.playNestedBtn.innerHTML = '<span class="overlay">⏸️</span>';
  }

  stopPlayback() {
    clearInterval(this.playbackInterval);
    this.playbackInterval = null;
    this.togglePlaybackBtn.innerHTML = '<span class="overlay">▶️</span>';
    this.playNestedBtn.innerHTML = '<span class="overlay">▶️</span>';
  }

  updateSpeed = () => {
    const speed = parseFloat(this.speedSlider.value);
    this.speedValue.textContent = `${speed}x`;
    this.speedEmoji.textContent = '➡️';
    if (this.playbackInterval) {
      this.stopPlayback();
      this.startPlayback();
    }
    this.resetHideTimeout();
  };

  resetSpeed = () => {
    this.speedSlider.value = 1;
    this.updateSpeed();
  };

  updateZoomFactor = (delta, event) => {
    const rect = this.lightboxImg.getBoundingClientRect();
    this.originX = ((event.clientX - rect.left) / rect.width) * 100;
    this.originY = ((event.clientY - rect.top) / rect.height) * 100;

    this.zoomFactor = Math.max(this.minZoomFactor, this.zoomFactor + delta);
    this.updateZoom();
  };

  resetZoom = () => {
    this.zoomFactor = this.minZoomFactor;
    this.imgOffsetX = 0;
    this.imgOffsetY = 0;
    this.originX = 50;
    this.originY = 50;
    this.updateZoom();
  };

  updateZoom = () => {
    this.isZooming = true;
    this.lightboxImg.style.transformOrigin = `${this.originX}% ${this.originY}%`;
    this.lightboxImg.style.transform = `scale(${this.zoomFactor}) translate(${this.imgOffsetX}px, ${this.imgOffsetY}px)`;
    setTimeout(() => { this.isZooming = false; }, 500);
  };

  downloadImage = () => {
    const url = this.lightboxImg.src;
    const fileName = url.split('/').pop().split('?')[0]; // Extract filename from URL
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  addTouchSupport() {
    let startX = 0, startY = 0, startZoomFactor = 1, initialPinchDistance = 0;

    this.lightbox.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        startZoomFactor = this.zoomFactor;
        initialPinchDistance = this.getDistance(e.touches[0], e.touches[1]);
        e.preventDefault();
      }
    });

    this.lightbox.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - startX;
        const deltaY = e.touches[0].clientY - startY;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          deltaX > 50 ? this.showNext() : this.showPrev();
          startX = e.touches[0].clientX;
        } else {
          e.preventDefault();
          this.updateZoomFactor(deltaY > 0 ? -0.1 : 0.1, e);
          startY = e.touches[0].clientY;
        }
      } else if (e.touches.length === 2) {
        e.preventDefault();
        const distance = this.getDistance(e.touches[0], e.touches[1]);
        const scale = distance / initialPinchDistance;
        this.zoomFactor = Math.max(this.minZoomFactor, startZoomFactor * scale);
        this.updateZoom();
      }
    });

    this.lightbox.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) initialPinchDistance = 0;
    });
  }

  addScrollSupport() {
    this.lightbox.addEventListener('wheel', (e) => {
      e.preventDefault();
      e.deltaY < 0 ? this.updateZoomFactor(0.1, e) : this.updateZoomFactor(-0.1, e);
      if (!this.isZooming) e.deltaX > 0 ? this.showNext() : this.showPrev();
    });
  }

  toggleNestedControls = () => {
    this.nestedControls.style.display = this.nestedControls.style.display === 'none' ? 'flex' : 'none';
    this.nestedControlsVisible = !this.nestedControlsVisible;
  };

  setupAutoHide() {
    ['mousemove', 'click', 'touchstart'].forEach(event => {
      this.lightbox.addEventListener(event, this.resetHideTimeout);
    });
    this.resetHideTimeout();
  }

  resetHideTimeout = () => {
    if (this.hideTimeout) clearTimeout(this.hideTimeout);
    this.showControls();
    this.hideTimeout = setTimeout(this.hideControls, 3000);
  };

  showControls = () => {
    this.controls.style.display = 'flex';
    if (this.nestedControlsVisible) this.nestedControls.style.display = 'flex';
    this.nav.style.display = 'flex';
    this.closeBtn.style.display = 'block';
  };

  hideControls = () => {
    this.controls.style.display = 'none';
    this.nestedControls.style.display = 'none';
    this.nestedControlsVisible = false;
    this.nav.style.display = 'none';
    this.closeBtn.style.display = 'none';
  };

  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  addKeyboardSupport() {
    document.addEventListener('keydown', (e) => {
      if (this.lightbox.classList.contains('show')) {
        switch (e.key) {
          case 'ArrowRight': return this.showNext();
          case 'ArrowLeft': return this.showPrev();
          case ' ': return this.togglePlayback();
          case 'Escape': return this.closeLightbox();
        }
      }
    });
  }

  addPinchZoomSupport() {
    let initialDistance = null, startZoomFactor = 1;

    this.lightbox.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const distance = this.getDistance(e.touches[0], e.touches[1]);
        initialDistance = initialDistance === null ? distance : initialDistance;
        const scale = distance / initialDistance;
        this.zoomFactor = Math.max(this.minZoomFactor, startZoomFactor * scale);
        this.updateZoom();
      }
    });

    this.lightbox.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) initialDistance = null;
    });
  }

  getDistance(touch1, touch2) {
    return Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
  }
}

export function initializeLightbox() {
  const contentElement = document.querySelector('.content');
  const markdownContent = contentElement.innerHTML;
  const regex = /\[!\[.*\]\((.*)\)\]\((.*)\)/g;
  let match;
  const images = [];

  while ((match = regex.exec(markdownContent)) !== null) {
    const thumbnailUrl = match[1];
    const fullResolutionUrl = match[2];

    const img = document.createElement('img');
    img.src = thumbnailUrl;
    img.dataset.fullResolutionUrl = fullResolutionUrl;
    img.style.cursor = 'pointer';
    images.push(img);

    // Replace the markdown link with the image element
    const linkRegex = new RegExp(`\\[!\\[.*\\]\\(${thumbnailUrl}\\)\\]\\(${fullResolutionUrl}\\)`, 'g');
    contentElement.innerHTML = contentElement.innerHTML.replace(linkRegex, img.outerHTML);
  }

  const lightbox = new Lightbox();
  lightbox.initialize(images);
}

export default Lightbox;
