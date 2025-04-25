const mongoose = require('mongoose');

const slideSchema = new mongoose.Schema({
  title: String,
  content: String,
  images: [String],
  number: Number
});

const presentationSchema = new mongoose.Schema({
  fileName: String,
  uploadDate: { type: Date, default: Date.now },
  slides: [slideSchema]
});

module.exports = mongoose.model('Presentation', presentationSchema); 