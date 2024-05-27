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
    `;

    this.lightboxImg = this.lightbox.querySelector('#lightbox-img');
    this.lightboxCaption = this.lightbox.querySelector('#lightbox-caption');
    this.closeBtn = this.lightbox.querySelector('.close');
    this.nextBtn = this.lightbox.querySelector('#next');
    this.prevBtn = this.lightbox.querySelector('#prev');

    this.images = [];
    this.currentIndex = 0;

    this.closeBtn.addEventListener('click', () => this.closeLightbox());
    this.nextBtn.addEventListener('click', () => this.showNext());
    this.prevBtn.addEventListener('click', () => this.showPrev());
    this.lightbox.addEventListener('click', (e) => {
      if (e.target === this.lightbox || e.target === this.closeBtn) {
        this.closeLightbox();
      }
    });

    this.addScrollSupport();
    this.addTouchSupport();
  }

  initialize(images) {
    // console.log('Initializing Lightbox with images:', images); // Debugging log
    this.images = images;
    this.images.forEach((img, index) => {
      // console.log('Attaching click event to image', img); // Debugging log
      img.addEventListener('click', () => this.showLightbox(index));
    });
  }

  showLightbox(index) {
    // console.log('Showing lightbox for image index:', index); // Debugging log
    this.currentIndex = index;
    this.lightboxImg.src = this.images[this.currentIndex].src;
    this.lightboxCaption.textContent = this.images[this.currentIndex].alt || '';
    this.lightbox.classList.add('show');
    document.body.classList.add('no-scroll');
  }

  closeLightbox() {
    // console.log('Closing lightbox'); // Debugging log
    this.lightbox.classList.remove('show');
    document.body.classList.remove('no-scroll');
  }

  showNext() {
    // console.log('Showing next image'); // Debugging log
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this.showLightbox(this.currentIndex);
  }

  showPrev() {
    // console.log('Showing previous image'); // Debugging log
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.showLightbox(this.currentIndex);
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
