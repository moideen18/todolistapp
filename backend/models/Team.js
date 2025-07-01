// backend/models/Team.js
const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  teamName: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  members: [{
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true
    },
    email: String,
    role: { 
      type: String, 
      enum: ['admin', 'member'], 
      default: 'member' 
    }
  }],
  todos: [{
    title: String,
    description: String,
    priority: String,
    completed: {
      type: Boolean,
      default: false
    },
    customDate: Date,
    createdAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  invitations: [{
    email: String,
    token: String,
    status: { 
      type: String, 
      enum: ['pending', 'accepted'], 
      default: 'pending' 
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Team', teamSchema);
