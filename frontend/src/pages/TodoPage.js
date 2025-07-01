import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaBars, FaCaretDown, FaCamera } from 'react-icons/fa';
import { format } from 'date-fns';
import './TodoPage.css';

// Axios interceptor for handling 401 responses.
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const TodoPage = () => {
  // Task states
  const [todos, setTodos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  // Modal states for Add & Edit Task
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // New Task state with its fields
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: '',
    customDate: ''
  });
  // For Add: State for the uploaded file
  const [selectedFile, setSelectedFile] = useState(null);
  
  // For Edit: State for editing task data and new file (if replacing)
  const [currentEdit, setCurrentEdit] = useState(null);
  const [editTask, setEditTask] = useState({
    title: '',
    description: '',
    priority: '',
    customDate: ''
  });
  const [selectedEditFile, setSelectedEditFile] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const todosPerPage = 5;
  const [, setCurrentTime] = useState(new Date());

  // Team states (if needed)
  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
  const [newTeam, setNewTeam] = useState({ teamName: '', joinEmail: '' });
  const [teams, setTeams] = useState([]);

  // Image preview state
  const [imagePreview, setImagePreview] = useState({
    open: false,
    src: '',
    name: '',
    type: ''
  });

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Token expiry check
  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  };

  const storedUser = localStorage.getItem('user');
  const username = storedUser ? JSON.parse(storedUser).username : '';

  // Utility: Format date for datetime-local input.
  const formatDateForInput = (dateValue) => {
    if (!dateValue) return '';
    return format(new Date(dateValue), "yyyy-MM-dd'T'HH:mm");
  };

  // Fetch todos from the backend.
  const fetchTodos = useCallback(async () => {
    if (!token || isTokenExpired(token)) {
      localStorage.removeItem('token');
      navigate('/login');
      return;
    }
    try {
      const response = await axios.get('http://localhost:5000/api/todos', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setTodos(response.data);
    } catch (error) {
      console.error('Error fetching todos:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!token || isTokenExpired(token)) {
      localStorage.removeItem('token');
      navigate('/login');
      return;
    }
    fetchTodos();
  }, [token, navigate, fetchTodos]);

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load teams from localStorage on mount
  useEffect(() => {
    const storedTeams = localStorage.getItem('teams');
    if (storedTeams) setTeams(JSON.parse(storedTeams));
  }, []);

  // Persist teams into localStorage on state changes
  useEffect(() => {
    localStorage.setItem('teams', JSON.stringify(teams));
  }, [teams]);

  // Filter todos based on search term and priority
  const filteredTodos = todos.filter((todo) => {
    const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter ? todo.priority === priorityFilter : true;
    return matchesSearch && matchesPriority;
  });
  const totalPages = Math.ceil(filteredTodos.length / todosPerPage);
  const indexOfLastTodo = currentPage * todosPerPage;
  const indexOfFirstTodo = indexOfLastTodo - todosPerPage;
  const currentTodos = filteredTodos.slice(indexOfFirstTodo, indexOfLastTodo);

  // Handler: Add a new task with file upload
  const handleAddTask = async () => {
    if (!token || isTokenExpired(token)) {
      navigate('/login');
      return;
    }
    if (!newTask.title || !newTask.description) {
      alert('Please fill in both title and description.');
      return;
    }
    if (!newTask.priority) {
      alert('Please select a priority for the task.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('title', newTask.title.trim());
      formData.append('description', newTask.description.trim());
      formData.append('priority', newTask.priority);
      if (newTask.customDate) {
        formData.append('customDate', newTask.customDate);
      }
      
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      
      const response = await axios.post(
        'http://localhost:5000/api/todos',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      setTodos([response.data, ...todos]);
      setNewTask({ title: '', description: '', priority: '', customDate: '' });
      setSelectedFile(null);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error creating task:', error);
      if (error.response?.status === 400) {
        alert(error.response.data.message || 'Please check all required fields');
      } else if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        alert('Failed to create task. Please try again.');
      }
    }
  };

  // Handler: Edit Task Modal initialization
  const openEditModal = (todo) => {
    setCurrentEdit(todo);
    setEditTask({
      title: todo.title,
      description: todo.description,
      priority: todo.priority || '',
      customDate: todo.customDate ? formatDateForInput(todo.customDate) : ''
    });
    setSelectedEditFile(null);
    setIsEditModalOpen(true);
  };

  // Handler: Save edits (with optional new file)
  const handleEditSave = async () => {
    if (!editTask.title) {
      alert('Title is required');
      return;
    }
    if (!editTask.priority) {
      alert('Please select a priority for the task');
      return;
    }
    try {
      if (selectedEditFile) {
        const formData = new FormData();
        formData.append('title', editTask.title.trim());
        formData.append('description', editTask.description.trim());
        formData.append('priority', editTask.priority);
        formData.append('customDate', editTask.customDate || '');
        formData.append('completed', currentEdit.completed);
        formData.append('file', selectedEditFile);
        const response = await axios.put(
          `http://localhost:5000/api/todos/${currentEdit._id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        updateTodosState(response.data);
      } else {
        const updatedTask = {
          title: editTask.title.trim(),
          description: editTask.description.trim(),
          priority: editTask.priority,
          customDate: editTask.customDate || null,
          completed: currentEdit.completed,
        };
        const response = await axios.put(
          `http://localhost:5000/api/todos/${currentEdit._id}`,
          updatedTask,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        updateTodosState(response.data);
      }
      setCurrentEdit(null);
      setEditTask({ title: '', description: '', priority: '', customDate: '' });
      setSelectedEditFile(null);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating task:', error.response?.data || error.message);
      alert('Failed to update task. Please try again.');
    }
  };

  // Helper: Update todos state after an edit
  const updateTodosState = (updatedTodo) => {
    setTodos((prevTodos) =>
      prevTodos.map((t) => (t._id === currentEdit._id ? updatedTodo : t))
    );
  };

  const handleDelete = (id) => {
    axios
      .delete(`http://localhost:5000/api/todos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        setTodos(todos.filter((todo) => todo._id !== id));
      })
      .catch((err) => console.error('Error deleting task:', err));
  };

  const handleEditDelete = () => {
    axios
      .delete(`http://localhost:5000/api/todos/${currentEdit._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        setTodos(todos.filter((todo) => todo._id !== currentEdit._id));
        setCurrentEdit(null);
        setEditTask({ title: '', description: '', priority: '', customDate: '' });
        setIsEditModalOpen(false);
      })
      .catch((err) => console.error('Error deleting task:', err));
  };

  const cancelEdit = () => {
    setCurrentEdit(null);
    setEditTask({ title: '', description: '', priority: '', customDate: '' });
    setSelectedEditFile(null);
    setIsEditModalOpen(false);
  };

  // Toggle task completion status
  const toggleComplete = (id, currentStatus) => {
    axios
      .put(
        `http://localhost:5000/api/todos/${id}`,
        { completed: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        setTodos(todos.map((todo) => (todo._id === id ? res.data : todo)));
      })
      .catch((err) => console.error('Error toggling completion:', err));
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Team handlers
  const handleAddTeam = async () => {
    if (!token || isTokenExpired(token)) {
      navigate('/login');
      return;
    }
    if (!newTeam.teamName || !newTeam.joinEmail) {
      alert('Please enter both team name and join email.');
      return;
    }
    try {
      const response = await axios.post(
        'http://localhost:5000/api/teams',
        {
          teamName: newTeam.teamName.trim(),
          joinEmail: newTeam.joinEmail.trim(),
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const newTeamData = {
        teamName: response.data.teamName,
        joinEmail: newTeam.joinEmail,
      };
      setTeams((prevTeams) => [...prevTeams, newTeamData]);
      setNewTeam({ teamName: '', joinEmail: '' });
      setIsAddTeamModalOpen(false);
      alert('Team created successfully! Invitation email sent.');
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Failed to create team';
      console.error('Error creating team:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
      alert(errorMessage);
    }
  };

  const handleDeleteTeam = (teamToDelete) => {
    setTeams(teams.filter((team) => team.teamName !== teamToDelete.teamName));
  };

  const handleTeamClick = (team) => {
    if (!token) {
      navigate(
        `/login?redirect=${encodeURIComponent(`/invite/${team.teamName}`)}`
      );
    } else {
      navigate(`/invite/${encodeURIComponent(team.teamName)}`);
    }
  };

  // Function to handle image preview
  const handleImagePreview = (fileData, fileName, fileType) => {
    setImagePreview({
      open: true,
      src: `data:${fileType};base64,${fileData}`,
      name: fileName,
      type: fileType
    });
  };

  // Function to open camera in a new tab
  const openCameraInNewTab = () => {
    const cameraHtml = `
      <html>
        <head>
          <title>Camera Capture</title>
          <style>
            body { font-family: sans-serif; text-align: center; margin-top: 40px; }
            video { width: 90%; max-width: 400px; border-radius: 8px; }
            button { margin: 10px; padding: 8px 16px; border-radius: 4px; border: none; background: #007bff; color: #fff; cursor: pointer; }
            #preview { margin-top: 20px; }
          </style>
        </head>
        <body>
          <h2>Camera Capture</h2>
          <video id="video" autoplay playsinline></video>
          <br/>
          <button id="captureBtn">Capture</button>
          <button id="closeBtn">Close</button>
          <div id="preview"></div>
          <script>
            const video = document.getElementById('video');
            const captureBtn = document.getElementById('captureBtn');
            const closeBtn = document.getElementById('closeBtn');
            let stream = null;

            navigator.mediaDevices.getUserMedia({ video: true }).then(s => {
              stream = s;
              video.srcObject = stream;
            });

            captureBtn.onclick = () => {
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
              canvas.toBlob(blob => {
                // Send image to opener window
                if (window.opener) {
                  const reader = new FileReader();
                  reader.onloadend = function() {
                    window.opener.postMessage({
                      type: 'CAMERA_IMAGE',
                      dataUrl: reader.result
                    }, '*');
                    window.close();
                  };
                  reader.readAsDataURL(blob);
                }
              }, 'image/png');
            };

            closeBtn.onclick = () => {
              if (stream) {
                stream.getTracks().forEach(track => track.stop());
              }
              window.close();
            };
          </script>
        </body>
      </html>
    `;
    const win = window.open();
    win.document.write(cameraHtml);
    win.document.close();
  };

  useEffect(() => {
    function handleCameraImage(event) {
      if (event.data && event.data.type === 'CAMERA_IMAGE' && event.data.dataUrl) {
        // Convert dataURL to File object
        fetch(event.data.dataUrl)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], 'captured-image.png', { type: 'image/png' });
            setSelectedFile(file);
          });
      }
    }
    window.addEventListener('message', handleCameraImage);
    return () => window.removeEventListener('message', handleCameraImage);
  }, []);

  return (
    <div>
      {/* Sidebar Section */}
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
        <br />
        <div
          className="add-team-link"
          onClick={() => {
            console.log('Add Team clicked');
            setIsAddTeamModalOpen(true);
          }}
        >
          + Add Team
        </div>
        <br />
        {/* Project Section */}
        <div className="project-label">Project</div>
        <div className="project-teams">
          {teams.length > 0 ? (
            teams.map((team, index) => (
              <div
                key={index}
                className="team-item"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  margin: '0.5rem 0',
                }}
              >
                <span
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleTeamClick(team)}
                >
                  {team.teamName}
                </span>
                <button onClick={() => handleDeleteTeam(team)}>Delete</button>
              </div>
            ))
          ) : (
            <div style={{ fontStyle: 'italic', color: '#888' }}>
              No Team Added
            </div>
          )}
        </div>
      </div>
      {!isSidebarOpen && (
        <button
          className="menu-icon-persistent"
          onClick={() => setIsSidebarOpen(true)}
        >
          <FaBars size={20} />
        </button>
      )}

      {/* Todo Container */}
      <div className="todo-container">
        <div className="todo-header">
          <center>
            <h3>YOUR TASKS</h3>
          </center>
        </div>
        <br />
        <ul className="todo-list">
          {currentTodos.map((todo) => (
            <li key={todo._id} className="todo-item">
              <div className="left-section">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleComplete(todo._id, todo.completed)}
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
                <div className="task-info-row">
                  {/* Files */}
                  {((todo.files && todo.files.length > 0) || todo.file) && (
                    <div className="file-attachments">
                      {todo.file && todo.file.data && (
                        <div className="file-attachment">
                          {todo.file.contentType.startsWith('image/') ? (
                            <span
                              onClick={() => handleImagePreview(todo.file.data, todo.file.originalName, todo.file.contentType)}
                              style={{ cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              🖼️ {todo.file.originalName}
                            </span>
                          ) : (
                            <a
                              href={`data:${todo.file.contentType};base64,${todo.file.data}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="file-link"
                            >
                              {todo.file.contentType.includes('pdf') ? '📄' :
                               todo.file.contentType.includes('word') ? '📝' :
                               todo.file.contentType.includes('sheet') ? '📊' :
                               todo.file.contentType.includes('presentation') ? '📽' :
                               '📎'} {todo.file.originalName}
                            </a>
                          )}
                        </div>
                      )}
                      {todo.files && todo.files.map((file, index) => (
                        <div key={index} className="file-attachment">
                          {file.contentType.startsWith('image/') ? (
                            <span
                              onClick={() => handleImagePreview(file.data, file.originalName, file.contentType)}
                              style={{ cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              🖼️ {file.originalName}
                            </span>
                          ) : (
                            <a
                              href={`data:${file.contentType};base64,${file.data}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="file-link"
                            >
                              {file.contentType.includes('pdf') ? '📄' :
                               file.contentType.includes('word') ? '📝' :
                               file.contentType.includes('sheet') ? '📊' :
                               file.contentType.includes('presentation') ? '📽' :
                               '📎'} {file.originalName}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Date */}
                  <div className="task-date">
                    {todo.customDate
                      ? `Due on: ${new Date(todo.customDate).toLocaleString()}`
                      : `Created on: ${new Date(todo.createdAt).toLocaleString()}`}
                  </div>
                </div>
              </div>
              <div className="right-section">
                {todo.completed ? (
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(todo._id)}
                  >
                    Delete
                  </button>
                ) : (
                  <button
                    className="edit-btn"
                    onClick={() => openEditModal(todo)}
                  >
                    Edit
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
        <div className="pagination">
          {[...Array(totalPages).keys()].map((number) => (
            <button
              key={number + 1}
              onClick={() => setCurrentPage(number + 1)}
              className={currentPage === number + 1 ? 'active' : ''}
            >
              {number + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Task</h3>
            <input
              type="text"
              placeholder="Title"
              value={newTask.title}
              onChange={(e) =>
                setNewTask({ ...newTask, title: e.target.value })
              }
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            />
            <textarea
              placeholder="Description"
              value={newTask.description}
              onChange={(e) =>
                setNewTask({ ...newTask, description: e.target.value })
              }
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            />
            <select
              className="add-task-priority"
              value={newTask.priority}
              onChange={(e) =>
                setNewTask({ ...newTask, priority: e.target.value })
              }
            >
              <option value="" disabled>
                Select Priority
              </option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <div>
              <label htmlFor="customDate">Set Date &amp; Time:</label>
              <input
                id="customDate"
                type="datetime-local"
                value={newTask.customDate}
                onChange={(e) =>
                  setNewTask({ ...newTask, customDate: e.target.value })
                }
              />
            </div>
            {/* File upload input for adding a file */}
            <div>
              <label htmlFor="uploadFile">Attach File:</label>
              <input
                id="uploadFile"
                type="file"
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />
              <button
                type="button"
                style={{
                  marginLeft: '10px',
                  background: '#eee',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  padding: '6px 10px',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
                onClick={openCameraInNewTab}
              >
                <FaCamera style={{ marginRight: '5px' }} />
                Add Image
              </button>
              {selectedFile && (
                <div style={{ marginTop: '0.5rem' }}>
                  Selected: {selectedFile.name}
                </div>
              )}
            </div>
            <div className="modal-buttons">
              <button className="save-btn" onClick={handleAddTask}>
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
        <div
          className="modal-overlay"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Task</h3>
            <input
              type="text"
              value={editTask.title}
              onChange={(e) =>
                setEditTask({ ...editTask, title: e.target.value })
              }
            />
            <textarea
              value={editTask.description}
              onChange={(e) =>
                setEditTask({ ...editTask, description: e.target.value })
              }
            />
            <select
              className="edit-task-priority"
              value={editTask.priority}
              onChange={(e) =>
                setEditTask({ ...editTask, priority: e.target.value })
              }
            >
              <option value="" disabled>
                Select Priority
              </option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <div>
              <label htmlFor="editCustomDate">Set Date &amp; Time:</label>
              <input
                id="editCustomDate"
                type="datetime-local"
                value={editTask.customDate}
                onChange={(e) =>
                  setEditTask({ ...editTask, customDate: e.target.value })
                }
              />
            </div>
            {/* File upload input for updating the file in edit mode */}
            <div>
              <label htmlFor="editUploadFile">Update File:</label>
              <input
                id="editUploadFile"
                type="file"
                onChange={(e) => setSelectedEditFile(e.target.files[0])}
              />
              {selectedEditFile && (
                <div style={{ marginTop: '0.5rem' }}>
                  New file: {selectedEditFile.name}
                </div>
              )}
              {currentEdit?.file && !selectedEditFile && (
                <div style={{ marginTop: '0.5rem' }}>
                  Current file: {currentEdit.file.originalName}
                </div>
              )}
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
        <div
          className="modal-overlay"
          onClick={() => setIsAddTeamModalOpen(false)}
        >
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Team</h3>
            <input
              type="text"
              placeholder="Team Name"
              value={newTeam.teamName}
              onChange={(e) =>
                setNewTeam({ ...newTeam, teamName: e.target.value })
              }
              onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
            />
            <input
              type="email"
              placeholder="Member Join Email"
              value={newTeam.joinEmail}
              onChange={(e) =>
                setNewTeam({ ...newTeam, joinEmail: e.target.value })
              }
              onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
            />
            <div className="modal-buttons">
              <button className="save-btn" onClick={handleAddTeam}>
                Add Team
              </button>
              <button
                className="cancel-btn"
                onClick={() => setIsAddTeamModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {imagePreview.open && (
        <div
          className="modal-overlay"
          style={{ zIndex: 1002 }}
          onClick={() => setImagePreview({ ...imagePreview, open: false })}
        >
          <div
            className="modal-container"
            style={{ maxWidth: '90%', maxHeight: '90%', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{imagePreview.name}</h3>
            <img
              src={imagePreview.src}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: '80vh' }}
            />
            <div style={{ marginTop: '1rem' }}>
              <button
                onClick={() => setImagePreview({ ...imagePreview, open: false })}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoPage;