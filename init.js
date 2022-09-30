import Uploader from './upload.js';

const uploadBtn = document.querySelector('#upload');
const canvas = document.querySelector('#canvas');
const canvasAnnotation = document.querySelector('#canvas-annotation');

// init the uploader
window.uploader = new Uploader(uploadBtn, canvas, canvasAnnotation);
