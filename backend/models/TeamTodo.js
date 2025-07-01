const mongoose = require('mongoose');

const teamTodoSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  title: { 
    type: String, 
    required: true 
  },
  description: String,
  priority: { 
    type: String, 
    required: true, 
    enum: ['Low', 'Medium', 'High'] 
  },
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
    ref: 'User', 
    required: true 
  }
});

module.exports = mongoose.model('TeamTodo', teamTodoSchema);