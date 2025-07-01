// routes/todoRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
} = require('../controllers/todoController');

// Use memory storage so files are available in req.file.buffer
const upload = multer({ 
  storage: multer.memoryStorage(),
  // Remove the file filter to accept all files
});

// Secure all routes
router.use(authMiddleware);

// GET: fetch all todos
router.get('/', getTodos);

// POST: create a todo (with optional file)
router.post('/', upload.single('file'), createTodo);

// PUT: update a todo (also with optional new file)
router.put('/:id', upload.single('file'), updateTodo);

// DELETE
router.delete('/:id', deleteTodo);

module.exports = router;
