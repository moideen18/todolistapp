// models/Todo.js
const mongoose = require('mongoose');

const TodoSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  priority: { type: String, required: true, enum: ['Low', 'Medium', 'High'] },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  customDate: { type: Date },
  
  // Store image data and content type
  image: {
    data: Buffer,
    contentType: String,
  },

  // Update file storage to handle any file type
  file: {
    data: Buffer,
    contentType: String,
    originalName: String
  },

  // Update the schema to handle multiple files
  files: [{
    data: Buffer,
    contentType: String,
    originalName: String
  }]
});

module.exports = mongoose.model('Todo', TodoSchema);
