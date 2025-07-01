// controllers/todoController.js
const Todo = require('../models/Todo');

// Get all todos for the authenticated user
const getTodos = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ message: 'Unauthorized: User not found' });

    const todos = await Todo.find({ user: userId }).sort({ createdAt: -1 });

    // Convert file data to base64 for all todos
    const todosWithFiles = todos.map((todo) => {
      const todoObj = todo.toObject();

      if (todo.file && todo.file.data) {
        todoObj.file = {
          data: todo.file.data.toString('base64'), // Convert Buffer to base64
          contentType: todo.file.contentType,
          originalName: todo.file.originalName,
        };
      }

      if (todo.files && todo.files.length > 0) {
        todoObj.files = todo.files.map((file) => ({
          data: file.data.toString('base64'), // Convert Buffer to base64
          contentType: file.contentType,
          originalName: file.originalName,
        }));
      }

      return todoObj;
    });

    // Debugging log to verify the data
    console.log('File data sample:', todosWithFiles[0]?.file);

    return res.status(200).json(todosWithFiles);
  } catch (error) {
    console.error('Error fetching todos:', error);
    return res.status(500).json({ message: 'Server error while fetching todos' });
  }
};

// Create a new todo
const createTodo = async (req, res) => {
  try {
    const { title, description, priority, customDate } = req.body;
    const userId = req.user?.id;

    if (!userId)
      return res.status(401).json({ message: 'Unauthorized: User not found' });

    if (!title || !description || !priority) {
      return res
        .status(400)
        .json({ message: 'Title, description, and priority are required.' });
    }

    let parsedDate = null;
    if (customDate) {
      parsedDate = new Date(customDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: 'Invalid customDate format' });
      }
    }

    const todoData = {
      user: userId,
      title,
      description,
      priority,
      completed: false,
      customDate: parsedDate,
    };

    // Handle file upload
    if (req.file) {
      todoData.file = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        originalName: req.file.originalname
      };
    }

    const todo = await Todo.create(todoData);
    return res.status(201).json(todo);
  } catch (error) {
    console.error('Error creating todo:', error);
    return res.status(500).json({ message: 'Server error while creating todo' });
  }
};

// Update an existing todo
const updateTodo = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { title, description, completed, priority, customDate } = req.body;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const todo = await Todo.findOne({ _id: id, user: userId });
    if (!todo) return res.status(404).json({ message: 'Todo not found' });

    if (title !== undefined) todo.title = title;
    if (description !== undefined) todo.description = description;
    if (completed !== undefined) todo.completed = completed;
    if (priority !== undefined) todo.priority = priority;

    if (customDate !== undefined) {
      if (customDate) {
        const parsedDate = new Date(customDate);
        if (isNaN(parsedDate.getTime())) {
          return res.status(400).json({ message: 'Invalid customDate format' });
        }
        todo.customDate = parsedDate;
      } else {
        todo.customDate = null;
      }
    }

    // Update file if new one is uploaded
    if (req.file) {
      todo.file = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        originalName: req.file.originalname
      };
    }

    await todo.save();
    return res.status(200).json(todo);
  } catch (error) {
    console.error('Error updating todo:', error);
    return res.status(500).json({ message: 'Server error while updating todo' });
  }
};

// Delete a todo
const deleteTodo = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const todo = await Todo.findOneAndDelete({ _id: id, user: userId });

    if (!todo) {
      return res
        .status(404)
        .json({ message: 'Todo not found or unauthorized' });
    }

    return res.status(200).json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    return res
      .status(500)
      .json({ message: 'Server error while deleting todo' });
  }
};

module.exports = {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
};
