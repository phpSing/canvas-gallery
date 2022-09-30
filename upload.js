class Uploader {
  /**
   * takes an upload trigger DOM and a destination DOM
   */
  constructor(triggerDOM, destination, destinationAnnotation) {
    this.triggerDOM = triggerDOM;
    this.canvasDOM = destination;
    // this.canvasAnnotationDOM = destinationAnnotation;
    this.triggerDOM.addEventListener('input', this.handleUpload.bind(this));
    this.canvasDOM.width = this.canvasDOM.parentElement.clientWidth;
    this.canvasDOM.height = this.canvasDOM.parentElement.clientHeight;

    /**
     * Init gallery
     */
    try {
      const localGallery = localStorage.getItem('gallery');
      if (localGallery) {
        this.gallery = JSON.parse(localGallery);
        this.currentIndex = 1;
      }
    } catch (error) {}
    /**
     * Init navigation
     */
    document.querySelector('#prev-button').addEventListener(
      'click',
      function (e) {
        this.currentIndex -= 1;
      }.bind(this)
    );
    document.querySelector('#next-button').addEventListener(
      'click',
      function (e) {
        this.currentIndex += 1;
      }.bind(this)
    );
    /**
     * Init add text input
     */

    let prevX = null; // record the first x y position while click
    let prevY = null;
    this.canvasDOM.addEventListener(
      'mousedown',
      function (e) {
        if (this.#hasInput) return;
        const startX = parseInt(e.clientX - this.canvasDOM.offsetLeft);
        const startY = parseInt(e.clientY - this.canvasDOM.offsetTop);
        console.log(
          this.canvasDOM.offsetLeft,
          this.canvasDOM.offsetTop,
          startX,
          startY
        );
        prevX = startX;
        prevY = startY;
        this.#isHit = false;
        this.gallery[this.currentIndex - 1].annotations.forEach(
          (annotation, annotationIndex) => {
            if (this.checkHitAnnotation(startX, startY, annotation)) {
              this.#isHit = true;
              this.#selectedAnnotationIndex = annotationIndex;
            }
          }
        );
        if (!this.#isHit) {
          this.addInput(startX, startY);
        }
      }.bind(this)
    );
    /**
     * Init drag
     */
    this.canvasDOM.addEventListener(
      'mousemove',
      function (e) {
        if (this.#selectedAnnotationIndex == null) return;
        e.preventDefault();
        const mouseX = parseInt(e.clientX - this.canvasDOM.offsetLeft);
        const mouseY = parseInt(e.clientY - this.canvasDOM.offsetTop);
        const dx = mouseX - prevX;
        const dy = mouseY - prevY;
        prevX = mouseX;
        prevY = mouseY;
        this.gallery = this.gallery.map((image, imageIndex) => {
          if (imageIndex !== this.currentIndex - 1) return image;
          return {
            ...image,
            annotations: image.annotations.map(
              (annotation, annotationIndex) => {
                if (annotationIndex !== this.#selectedAnnotationIndex)
                  return annotation;
                return {
                  ...annotation,
                  x: annotation.x + dx,
                  y: annotation.y + dy,
                };
              }
            ),
          };
        });
        const ctx = this.canvasDOM.getContext('2d');
        ctx.clearRect(0, 0, this.canvasDOM.width, this.canvasDOM.height);
        this.drawCanvasFromExistingImage(this.gallery[this.currentIndex - 1]);
      }.bind(this)
    );
    /**
     * Mouse up, reset selected annotation index
     */
    this.canvasDOM.addEventListener(
      'mouseup',
      function (e) {
        e.preventDefault();
        this.#selectedAnnotationIndex = null;
      }.bind(this)
    );
  }

  #isHit = false;
  #hasInput = false;

  //Function to dynamically add an input box:
  addInput = function (x, y) {
    const obj = this;
    const input = document.createElement('input');
    input.type = 'text';
    input.style.position = 'fixed';
    input.style.left = x + 'px';
    input.style.top = y + 'px';
    input.onkeydown = function handleEnter(e) {
      const keyCode = e.keyCode;
      if (keyCode === 13) {
        const ctx = obj.canvasDOM.getContext('2d');
        const metrics = ctx.measureText(this.value);
        const w = metrics.width;
        let fontHeight =
          metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
        let actualHeight =
          metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

        if (this.value) {
          obj.gallery = obj.gallery.map((image, i) => {
            return i === obj.currentIndex - 1
              ? {
                  ...image,
                  annotations: [
                    ...image.annotations,
                    {
                      text: this.value,
                      x,
                      y,
                      w,
                      h: actualHeight,
                      fontHeight,
                    },
                  ],
                }
              : image;
          });
        }
        obj.canvasDOM.parentElement.removeChild(this);
        obj.#hasInput = false;
        obj.currentIndex = obj.currentIndex;
      }
    };
    this.canvasDOM.parentElement.appendChild(input);
    setTimeout(() => {
      input.focus();
    }, 0);
    this.#hasInput = true;
  };

  //Draw the text onto canvas:
  drawText = function (txt, x, y) {
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.font = font;
    ctx.fillText(txt, x, y);
  };

  triggerDOM = null;

  canvasDOM = null;

  galleryContentDOM = null;

  #currentIndex = 1;

  get currentIndex() {
    return this.#currentIndex;
  }

  set currentIndex(index) {
    if (index === 0) {
      index = this.#gallery.length;
    } else if (index === this.#gallery.length + 1) {
      index = 1;
    }
    this.#currentIndex = index;
    document.querySelector('#current-index').textContent = index;
    this.renderGallery();
    // draw the image according to the index
    this.drawCanvasFromExistingImage(this.gallery[index - 1]);
    this.renderAnnotationList(this.gallery[index - 1], index - 1);
    return this.#currentIndex;
  }

  #gallery = [];

  get gallery() {
    return this.#gallery;
  }

  set gallery(images) {
    this.#gallery = images;
    try {
      localStorage.setItem('gallery', JSON.stringify(this.#gallery));
    } catch (error) {}
    document.querySelector('#total').textContent = this.#gallery.length;
    this.renderGallery();
  }

  #selectedAnnotationIndex = null;

  get selectedAnnotationIndex() {
    return this.#selectedAnnotationIndex;
  }

  set selectedAnnotationIndex(value) {
    this.#selectedAnnotationIndex = value;
  }

  handleUpload = function (e) {
    for (let file of e.target.files) {
      this.importImageFiles(file);
    }
  };

  checkHitAnnotation = function (x, y, annotation) {
    console.log(x, y, annotation);
    return (
      x >= annotation.x &&
      x <= annotation.x + annotation.w &&
      y >= annotation.y - annotation.fontHeight &&
      y <= annotation.y
    );
  };

  getSizeBaseOnCanvasHeight = function (img, canvasContainer) {
    if (!img || !img.height) return [0, 0];
    const hRatio = img.height / canvasContainer.clientHeight;
    const wRatio = img.width / canvasContainer.clientWidth;
    if (hRatio < 1 && wRatio < 1) {
      const ratio = Math.max(hRatio, wRatio);
      return [img.width / ratio, img.height / ratio];
    }
    if (hRatio >= 1 && wRatio >= 1) {
      const ratio = Math.max(hRatio, wRatio);
      return [img.width / ratio, img.height / ratio];
    }
    if (hRatio >= 1) {
      return [img.width / hRatio, img.height / hRatio];
    }
    return [img.width / wRatio, img.height / wRatio];
  };

  drawCanvasFromExistingImage = function (existingImage) {
    const obj = this;
    const { src, x, y, w, h } = existingImage;
    const ctx = this.canvasDOM.getContext('2d');
    let img = new Image();
    img.onload = function () {
      ctx.clearRect(0, 0, obj.canvasDOM.width, obj.canvasDOM.height);
      requestAnimationFrame(() => {
        ctx.drawImage(img, x, y, w, h);
        obj.renderAnnotationsOnCanvas(existingImage);
      });
    };
    img.src = src;
  };

  importImageFiles = function (file) {
    let reader = new FileReader();
    const obj = this;

    reader.onload = function (event) {
      let img = new Image();
      img.onload = function () {
        const [scaledWidth, scaledHeight] = obj.getSizeBaseOnCanvasHeight(
          img,
          obj.canvasDOM.parentElement
        );
        const x = Math.round(obj.canvasDOM.width - scaledWidth) / 2;
        const y = Math.round(obj.canvasDOM.height - scaledHeight) / 2;
        const w = scaledWidth;
        const h = scaledHeight;
        obj.gallery = [
          ...obj.gallery,
          {
            src: event.target.result,
            x,
            y,
            w,
            h,
            annotations: [],
          },
        ];
        obj.currentIndex = obj.gallery.length;
      };
      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  };

  /**
   * Everytime the currentIndex/gallery changes, re-render annotations per frame
   */
  renderAnnotationList = function (image, imageIndex) {
    const { annotations } = image;
    const frag = document.createDocumentFragment();
    annotations.forEach((annotation, annotationIndex) => {
      const li = document.createElement('li');
      const textNode = document.createElement('span');
      const deleteTrigger = document.createElement('a');
      textNode.textContent = annotation.text;
      deleteTrigger.textContent = 'Delete';
      deleteTrigger.addEventListener(
        'click',
        function (e) {
          e.preventDefault();
          this.gallery = this.gallery.map((image, _imageIndex) => {
            return imageIndex === _imageIndex
              ? {
                  ...image,
                  annotations: image.annotations.filter(
                    (a, i) => i !== annotationIndex
                  ),
                }
              : image;
          });
          this.currentIndex = imageIndex + 1;
        }.bind(this)
      );
      li.appendChild(textNode).appendChild(deleteTrigger);
      frag.appendChild(li);
    });
    requestAnimationFrame(() => {
      document.querySelector('.annotation-list').replaceChildren(frag);
    });
  };

  /**
   * Everytime the currentIndex/gallery changes, re-render annotations
   * on canvas per frame
   */
  renderAnnotationsOnCanvas = function (image) {
    const { annotations } = image;
    const ctx = this.canvasDOM.getContext('2d');
    ctx.font = '22px serif';
    annotations.forEach((annotation) => {
      requestAnimationFrame(() => {
        ctx.fillText(annotation.text, annotation.x, annotation.y);
      });
    });
  };

  /**
   * Everytime the currentIndex/gallery changes, re-render per frame
   */
  renderGallery = function () {
    const frag = document.createDocumentFragment();
    this.gallery.forEach((element, i) => {
      const img = document.createElement('img');
      img.src = element.src;
      img.addEventListener(
        'click',
        function () {
          this.currentIndex = i + 1;
        }.bind(this)
      );
      if (i + 1 === this.currentIndex) {
        img.classList.add('selected');
      }
      frag.appendChild(img);
    });
    requestAnimationFrame(() => {
      document.querySelector('.gallery-content').replaceChildren(frag);
    });
  };
}

export default Uploader;
