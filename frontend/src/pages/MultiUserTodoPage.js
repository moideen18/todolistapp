import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { FaUser, FaBars, FaCaretDown } from 'react-icons/fa';
import { format } from 'date-fns';
import './TodoPage.css';

const MultiUserTodoPage = () => {
  // Extract team token (could be team name or id) from URL parameters
  const { token: teamToken } = useParams();
  const navigate = useNavigate();

  // Task States
  const [todos, setTodos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: '',
    customDate: ''
  });
  const [currentEdit, setCurrentEdit] = useState(null);
  const [editTask, setEditTask] = useState({
    title: '',
    description: '',
    priority: '',
    customDate: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const todosPerPage = 5;
  const [, setCurrentTime] = useState(new Date());

  // Team States (optional, same as TodoPage for team management)
  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
  const [newTeam, setNewTeam] = useState({ teamName: '', joinEmail: '' });
  const [teams, setTeams] = useState([]);

  // User authentication
  const localToken = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  const username = storedUser ? JSON.parse(storedUser).username : '';

  // Utility: Format date for datetime-local input
  const formatDateForInput = (dateValue) => {
    if (!dateValue) return '';
    return format(new Date(dateValue), "yyyy-MM-dd'T'HH:mm");
  };

  // Fetch team todos from backend using teamToken
  const fetchTodos = useCallback(async () => {
    if (!teamToken) {
      console.error('No team token provided');
      return;
    }
    
    if (!localToken) {
      console.error('No authentication token');
      navigate('/login');
      return;
    }

    try {
      // Clean and encode the team name
      const teamName = decodeURIComponent(teamToken).toLowerCase();
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/teams/${teamName}/todos`,
        {
          headers: { 
            Authorization: `Bearer ${localToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Validate response data
      if (!Array.isArray(response.data)) {
        console.error('Invalid response format:', response.data);
        return;
      }

      const sortedTodos = response.data
        .filter(todo => todo && todo._id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setTodos(sortedTodos);
    } catch (err) {
      console.error('Error fetching todos:', err);
      if (err.response?.status === 404) {
        alert('Team not found or you don\'t have access');
        navigate('/todos');
      }
    }
  }, [teamToken, localToken, navigate]);

  useEffect(() => {
    if (!localToken) {
      navigate('/login');
      return;
    }
    fetchTodos();
  }, [localToken, navigate, fetchTodos]);

  // Add this effect to handle missing team token
  useEffect(() => {
    if (!teamToken) {
      console.error('No team token provided');
      alert('Team not found');
      navigate('/todos');
    }
  }, [teamToken, navigate]);

  // Update current time every second (for time-based features)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load persisted teams from localStorage when component mounts
  useEffect(() => {
    const storedTeams = localStorage.getItem('teams');
    if (storedTeams) {
      setTeams(JSON.parse(storedTeams));
    }
  }, []);

  // Persist teams to localStorage whenever teams state changes
  useEffect(() => {
    localStorage.setItem('teams', JSON.stringify(teams));
  }, [teams]);

  // Add this effect after other useEffects
  useEffect(() => {
    // Validate todos after they're loaded
    todos.forEach(todo => {
      if (!todo._id) {
        console.warn('Found todo without ID:', todo);
      }
    });
  }, [todos]);

  // Filtering todos based on search term and priority filter
  const filteredTodos = todos.filter((todo) => {
    const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter ? todo.priority === priorityFilter : true;
    return matchesSearch && matchesPriority;
  });
  const totalPages = Math.ceil(filteredTodos.length / todosPerPage);
  const indexOfLastTodo = currentPage * todosPerPage;
  const indexOfFirstTodo = indexOfLastTodo - todosPerPage;
  const currentTodos = filteredTodos.slice(indexOfFirstTodo, indexOfLastTodo);

  // Handler: Add a new task for team
  const handleAddTask = async () => {
    if (!localToken) {
      navigate('/login');
      return;
    }

    if (!newTask.title || !newTask.priority) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Clean and encode team name
      const teamName = decodeURIComponent(teamToken).toLowerCase();
      
      // Prepare task data
      const taskData = {
        title: newTask.title.trim(),
        description: newTask.description?.trim() || '',
        priority: newTask.priority,
        customDate: newTask.customDate || null
      };

      console.log('Creating task:', taskData); // Debug log

      const response = await axios.post(
        `http://localhost:5000/api/teams/${teamName}/todos`,
        taskData,
        {
          headers: {
            'Authorization': `Bearer ${localToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Server response:', response.data); // Debug log

      if (!response.data || !response.data._id) {
        throw new Error('Invalid response data');
      }

      // Update local state
      setTodos(prevTodos => [response.data, ...prevTodos]);
      
      // Reset form
      setNewTask({
        title: '',
        description: '',
        priority: '',
        customDate: ''
      });
      setIsAddModalOpen(false);

      // Show success message
      
    } catch (error) {
      console.error('Error details:', error.response?.data || error);
      alert(error.response?.data?.message || 'Failed to add task. Please try again.');
    }
  };

  // Handlers for editing a task
  const openEditModal = (todo) => {
    if (!todo?._id) {
      console.error('Invalid todo item');
      return;
    }

    setCurrentEdit(todo);
    setEditTask({
      title: todo.title || '',
      description: todo.description || '',
      priority: todo.priority || '',
      customDate: todo.customDate ? formatDateForInput(todo.customDate) : ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!editTask.title || !editTask.priority || !currentEdit?._id) {
      alert('Invalid data');
      return;
    }

    try {
      const teamName = decodeURIComponent(teamToken).toLowerCase();
      
      const res = await axios.put(
        `http://localhost:5000/api/teams/${teamName}/todos/${currentEdit._id}`,
        editTask,
        {
          headers: { Authorization: `Bearer ${localToken}` }
        }
      );

      setTodos(prevTodos => 
        prevTodos.map(todo => 
          todo._id === currentEdit._id ? res.data : todo
        )
      );
      
      setCurrentEdit(null);
      setEditTask({
        title: '',
        description: '',
        priority: '',
        customDate: ''
      });
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Error updating todo:', err);
      alert('Failed to update task');
    }
  };

  const handleDelete = async (id) => {
    if (!id) return;

    try {
      const teamName = decodeURIComponent(teamToken).toLowerCase();
      
      await axios.delete(
        `http://localhost:5000/api/teams/${teamName}/todos/${id}`,
        {
          headers: { Authorization: `Bearer ${localToken}` }
        }
      );

      setTodos(prevTodos => prevTodos.filter(todo => todo._id !== id));
    } catch (err) {
      console.error('Error deleting todo:', err);
      alert('Failed to delete task');
    }
  };

  const handleEditDelete = () => {
    if (!currentEdit?._id || !teamToken) {
      console.error('Missing todo id or teamToken');
      return;
    }

    axios
      .delete(
        `http://localhost:5000/api/teams/${encodeURIComponent(teamToken)}/todos/${currentEdit._id}`,
        {
          headers: { Authorization: `Bearer ${localToken}` }
        }
      )
      .then(() => {
        setTodos(todos.filter((todo) => todo._id !== currentEdit._id));
        setCurrentEdit(null);
        setEditTask({ title: '', description: '', priority: '', customDate: '' });
        setIsEditModalOpen(false);
      })
      .catch((err) => {
        console.error('Error deleting todo:', err);
        alert('Failed to delete todo');
      });
  };

  const cancelEdit = () => {
    setCurrentEdit(null);
    setEditTask({ title: '', description: '', priority: '', customDate: '' });
    setIsEditModalOpen(false);
  };

  // Handler: Toggle task completion
  const toggleComplete = async (id, currentStatus) => {
    if (!id) return;
    
    try {
      const teamName = decodeURIComponent(teamToken).toLowerCase();
      
      const res = await axios.put(
        `http://localhost:5000/api/teams/${teamName}/todos/${id}`,
        { completed: !currentStatus },
        {
          headers: { Authorization: `Bearer ${localToken}` }
        }
      );

      setTodos(prevTodos => 
        prevTodos.map(todo => 
          todo._id === id ? res.data : todo
        )
      );
    } catch (err) {
      console.error('Error toggling todo:', err);
      alert('Failed to update task');
    }
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Handler: Add New Team (if needed)
  const handleAddTeam = () => {
    if (!newTeam.teamName) {
      alert('Please enter a team name.');
      return;
    }
    if (!newTeam.joinEmail) {
      alert('Please enter a join email.');
      return;
    }
    axios
      .post('http://localhost:5000/api/teams', newTeam, {
        headers: { Authorization: `Bearer ${localToken}` }
      })
      .then((res) => {
        const addedTeam = res.data.teamName ? res.data : { teamName: newTeam.teamName, joinEmail: newTeam.joinEmail };
        setTeams([...teams, addedTeam]);
        setNewTeam({ teamName: '', joinEmail: '' });
        setIsAddTeamModalOpen(false);
      })
      .catch((err) => console.error(err));
  };

  // Handler: When a team name is clicked, navigate to its MultiUserTodoPage.
  const handleTeamClick = (team) => {
    if (!localToken) {
      navigate(`/login?redirect=${encodeURIComponent(`/invite/${team.teamName}`)}`);
    } else {
      navigate(`/invite/${encodeURIComponent(team.teamName)}`);
    }
  };

  // Switch to personal todos
  const switchToPersonalTodos = () => {
    navigate('/todos');
  };

  return (
    <div>
      <div className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div
            className={`user-info ${showUserDropdown ? 'active' : ''}`}
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            style={{ cursor: 'pointer', position: 'relative' }}
          >
            <FaUser style={{ marginRight: '0.5rem' }} />
            {username}
            <FaCaretDown style={{ marginLeft: '0.3rem' }} />
            {showUserDropdown && (
              <div className="user-dropdown">
                <button className="logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
          <button
            className="switch-view-btn"
            onClick={switchToPersonalTodos}
            style={{
              padding: '5px 10px',
              marginRight: '10px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Switch to Personal
          </button>
          <button
            className="menu-toggle-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <FaBars size={20} />
          </button>
        </div>
        <div className="sidebar-content">
          <div className="add-task-link" onClick={() => setIsAddModalOpen(true)}>
            + Add Task
          </div>
          <div className="add-team-link" onClick={() => setIsAddTeamModalOpen(true)}>
            + Add Team
          </div>
          {/* Project Section */}
          <div className="project-label">Project</div>
          <div className="project-teams">
            {teams.length > 0 ? (
              teams.map((team) => (
                <div
                  key={team._id || team.teamName} // Using team._id or teamName as unique key
                  className="team-item"
                  onClick={() => handleTeamClick(team)}
                  style={{ cursor: 'pointer', margin: '0.5rem 0' }}
                >
                  {team.teamName}
                </div>
              ))
            ) : (
              <div style={{ fontStyle: 'italic', color: '#888' }}>No Team Added</div>
            )}
          </div>
          <input
            type="text"
            placeholder="Search by title..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          <div className="priority-filter-container">
            <select
              id="priority-filter"
              className="priority-filter"
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Priority</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>
      </div>
      {!isSidebarOpen && (
        <button className="menu-icon-persistent" onClick={() => setIsSidebarOpen(true)}>
          <FaBars size={20} />
        </button>
      )}

      <div className="todo-container">
        <div className="todo-header">
          <h3>
            <span className="team-name">{teamToken}</span>
          </h3>
        </div>
        <ul className="todo-list">
          {currentTodos.map((todo) => (
            <li 
              key={todo._id || `todo-${todo.createdAt}`} // Using todo._id or fallback to timestamp
              className="todo-item"
            >
              <div className="left-section">
                <input
                  type="checkbox"
                  checked={todo.completed || false}
                  onChange={() => {
                    if (todo._id) {
                      toggleComplete(todo._id, todo.completed || false);
                    } else {
                      console.error('Todo has no ID');
                      alert('Cannot update task: Invalid task ID');
                    }
                  }}
                  disabled={!todo._id} // Disable checkbox if no ID exists
                />
              </div>
              <div className="middle-section">
                <div className={`task-title ${todo.completed ? 'completed' : ''}`}>
                  {todo.title}
                  {todo.priority && (
                    <span className={`priority-badge ${todo.priority.toLowerCase()}`}>
                      {todo.priority}
                    </span>
                  )}
                </div>
                <div className="task-desc">{todo.description}</div>
                <div className="task-date">
                  {todo.customDate
                    ? `Due on: ${new Date(todo.customDate).toLocaleString()}`
                    : `Created on: ${new Date(todo.createdAt).toLocaleString()}`}
                </div>
              </div>
              <div className="right-section">
                {todo.completed ? (
                  <button className="delete-btn" onClick={() => handleDelete(todo._id)}>
                    Delete
                  </button>
                ) : (
                  <button className="edit-btn" onClick={() => openEditModal(todo)}>
                    Edit
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
        <div className="pagination">
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={`page-${index + 1}`} // Using unique page number as key
              onClick={() => setCurrentPage(index + 1)}
              className={currentPage === index + 1 ? 'active' : ''}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Task</h3>
            <div>
              <label className="required-field">Title</label>
              <input
                type="text"
                placeholder="Enter task title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Description</label>
              <textarea
                placeholder="Enter task description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
            </div>
            <div>
              <label className="required-field">Priority</label>
              <select
                className="add-task-priority"
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                required
              >
                <option value="" disabled>Select Priority</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label>Due Date & Time</label>
              <input
                type="datetime-local"
                value={newTask.customDate}
                onChange={(e) => setNewTask({ ...newTask, customDate: e.target.value })}
              />
            </div>
            <div className="modal-buttons">
              <button 
                className="save-btn" 
                onClick={handleAddTask}
                disabled={!newTask.title || !newTask.priority}
              >
                Add Task
              </button>
              <button 
                className="cancel-btn" 
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Task</h3>
            <input
              type="text"
              value={editTask.title}
              onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
            />
            <textarea
              value={editTask.description}
              onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
            />
            <select
              className="edit-task-priority"
              value={editTask.priority}
              onChange={(e) => setEditTask({ ...editTask, priority: e.target.value })}
            >
              <option value="" disabled>
                Select Priority
              </option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <div>
              <label htmlFor="editCustomDate">Set Date & Time:</label>
              <input
                id="editCustomDate"
                type="datetime-local"
                value={formatDateForInput(editTask.customDate)}
                onChange={(e) => setEditTask({ ...editTask, customDate: e.target.value })}
              />
            </div>
            <div className="modal-buttons">
              <button className="save-btn" onClick={handleEditSave}>
                Save
              </button>
              <button className="cancel-btn" onClick={cancelEdit}>
                Cancel
              </button>
              <button className="delete-btn" onClick={handleEditDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Team Modal */}
      {isAddTeamModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddTeamModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Team</h3>
            <input
              type="text"
              placeholder="Team Name"
              value={newTeam.teamName}
              onChange={(e) => setNewTeam({ ...newTeam, teamName: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
            />
            <input
              type="email"
              placeholder="Member Join Email"
              value={newTeam.joinEmail}
              onChange={(e) => setNewTeam({ ...newTeam, joinEmail: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
            />
            <div className="modal-buttons">
              <button className="save-btn" onClick={handleAddTeam}>
                Add Team
              </button>
              <button className="cancel-btn" onClick={() => setIsAddTeamModalOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiUserTodoPage;
