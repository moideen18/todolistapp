const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const mongoose = require('mongoose');
const {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
} = require('../controllers/todoController');
const authMiddleware = require('../middleware/authMiddleware');

// Team routes - Place these FIRST
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { teamName, joinEmail } = req.body;

    if (!teamName || !joinEmail) {
      return res.status(400).json({ message: 'Team name and join email are required' });
    }

    // Check if team already exists
    const existingTeam = await Team.findOne({ teamName });
    if (existingTeam) {
      return res.status(400).json({ message: 'Team name already exists' });
    }

    const team = new Team({
      teamName,
      members: [{ userId: req.user.id, email: req.user.email, role: 'admin' }],
      invitations: [{ email: joinEmail, token: req.user.id, status: 'pending' }]
    });

    await team.save();
    res.status(201).json({ message: 'Team created successfully', teamName: team.teamName, id: team._id });
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ message: 'Server error while creating team' });
  }
});

router.post('/join/:token', authMiddleware, async (req, res) => {
  try {
    console.log('Join team route hit with token:', req.params.token);
    
    const team = await Team.findOne({ "invitations.token": req.params.token });
    if (!team) {
      return res.status(404).json({ message: "Invalid invitation" });
    }

    const invitation = team.invitations.find(inv => inv.token === req.params.token);
    if (!invitation || invitation.status === 'accepted') {
      return res.status(400).json({ message: "Invitation already used or invalid" });
    }

    team.members.push({
      userId: req.user.id,
      email: req.user.email,
      role: 'member'
    });

    invitation.status = 'accepted';
    await team.save();

    res.json({ message: "Successfully joined team", teamName: team.teamName });
  } catch (error) {
    console.error('Error joining team:', error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get team todos
router.get('/:teamName/todos', authMiddleware, async (req, res) => {
  try {
    const { teamName } = req.params;
    console.log('Fetching todos for team:', teamName);
    console.log('User ID:', req.user.id);

    const team = await Team.findOne({ 
      teamName: teamName,
      'members.userId': req.user.id 
    });

    if (!team) {
      console.log('Team not found or user not a member');
      return res.status(404).json({ 
        message: 'Team not found or you don\'t have access' 
      });
    }

    console.log('Team found:', team.teamName);
    res.json(team.todos || []);
  } catch (error) {
    console.error('Error fetching team todos:', error);
    res.status(500).json({ message: 'Server error while fetching todos' });
  }
});

// Create team todo
router.post('/:teamName/todos', authMiddleware, async (req, res) => {
  try {
    const { teamName } = req.params;
    const { title, description, priority, customDate } = req.body;

    // Validate input
    if (!title || !priority) {
      return res.status(400).json({ message: 'Title and priority are required' });
    }

    // Find team and verify user membership
    const team = await Team.findOne({
      teamName: teamName,
      'members.userId': req.user.id
    });

    if (!team) {
      return res.status(404).json({ message: 'Team not found or access denied' });
    }

    // Create new todo
    const newTodo = {
      _id: new mongoose.Types.ObjectId(),
      title,
      description,
      priority,
      customDate,
      completed: false,
      createdBy: req.user.id,
      createdAt: new Date()
    };

    // Add todo to team
    team.todos.push(newTodo);
    await team.save();

    res.status(201).json(newTodo);
  } catch (error) {
    console.error('Error creating team todo:', error);
    res.status(500).json({ message: 'Server error while creating todo' });
  }
});

// Todo routes - Place these AFTER team routes
router.get('/', authMiddleware, getTodos);
router.post('/', authMiddleware, createTodo);
router.put('/:id', authMiddleware, updateTodo);
router.delete('/:id', authMiddleware, deleteTodo);

module.exports = router;
