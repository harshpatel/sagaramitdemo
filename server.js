const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// User accounts database
const users = {
  harsh: {
    username: 'harsh',
    password: '12345678',
    name: 'Harsh',
    role: 'member',
    roleLabel: 'Member'
  },
  amit: {
    username: 'amit',
    password: '12345678',
    name: 'Amit',
    role: 'member',
    roleLabel: 'Member'
  },
  sagar: {
    username: 'sagar',
    password: '12345678',
    name: 'Sagar',
    role: 'admin',
    roleLabel: 'Administrator'
  }
};

// Tasks database with seeded demo tasks
let taskIdCounter = 10;
const tasks = [
  {
    id: 1,
    title: 'Clean your room',
    description: 'Make the bed, organize desk, vacuum floor',
    assignedTo: 'harsh',
    assignedBy: 'sagar',
    status: 'pending',
    priority: 'high',
    createdAt: new Date('2024-12-23').toISOString()
  },
  {
    id: 2,
    title: 'Take out the trash',
    description: 'Both kitchen and bathroom bins',
    assignedTo: 'harsh',
    assignedBy: 'sagar',
    status: 'completed',
    priority: 'medium',
    createdAt: new Date('2024-12-22').toISOString()
  },
  {
    id: 3,
    title: 'Walk the dog',
    description: 'Morning walk around the park - at least 20 minutes',
    assignedTo: 'amit',
    assignedBy: 'sagar',
    status: 'pending',
    priority: 'high',
    createdAt: new Date('2024-12-24').toISOString()
  },
  {
    id: 4,
    title: 'Do homework',
    description: 'Math worksheet pages 24-26',
    assignedTo: 'amit',
    assignedBy: 'sagar',
    status: 'pending',
    priority: 'high',
    createdAt: new Date('2024-12-24').toISOString()
  },
  {
    id: 5,
    title: 'Water the plants',
    description: 'All indoor plants and the garden',
    assignedTo: 'amit',
    assignedBy: 'sagar',
    status: 'completed',
    priority: 'low',
    createdAt: new Date('2024-12-21').toISOString()
  },
  {
    id: 6,
    title: 'Help with dinner',
    description: 'Set the table and help prepare salad',
    assignedTo: 'harsh',
    assignedBy: 'sagar',
    status: 'pending',
    priority: 'medium',
    createdAt: new Date('2024-12-24').toISOString()
  },
  {
    id: 7,
    title: 'Practice piano',
    description: '30 minutes of practice - focus on the new piece',
    assignedTo: 'amit',
    assignedBy: 'sagar',
    status: 'pending',
    priority: 'medium',
    createdAt: new Date('2024-12-24').toISOString()
  },
  {
    id: 8,
    title: 'Grocery shopping',
    description: 'Buy milk, eggs, bread, and fruits',
    assignedTo: 'sagar',
    assignedBy: 'sagar',
    status: 'pending',
    priority: 'high',
    createdAt: new Date('2024-12-24').toISOString()
  }
];

// Simple admin check
function requireAdmin(req, res, next) {
  const adminUsername = req.headers['x-admin-user'];
  if (!adminUsername || !users[adminUsername.toLowerCase()] || users[adminUsername.toLowerCase()].role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
}

// Main route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  const user = users[username.toLowerCase()];
  
  if (!user) {
    return res.status(401).json({ success: false, message: 'User not found' });
  }

  if (user.password !== password) {
    return res.status(401).json({ success: false, message: 'Invalid password' });
  }

  const { password: _, ...safeUser } = user;
  res.json({ success: true, message: 'Login successful', user: safeUser });
});

// Get all users
app.get('/api/users', (req, res) => {
  const safeUsers = Object.values(users).map(({ password, ...user }) => user);
  res.json(safeUsers);
});

// Add a new user (admin only)
app.post('/api/users', requireAdmin, (req, res) => {
  const { username, name, password, role } = req.body;
  
  if (!username || !name || !password) {
    return res.status(400).json({ success: false, message: 'Username, name, and password are required' });
  }

  const usernameKey = username.toLowerCase().trim();
  
  if (users[usernameKey]) {
    return res.status(400).json({ success: false, message: 'Username already exists' });
  }

  if (usernameKey.length < 2) {
    return res.status(400).json({ success: false, message: 'Username must be at least 2 characters' });
  }

  const userRole = role === 'admin' ? 'admin' : 'member';
  
  users[usernameKey] = {
    username: usernameKey,
    password: password,
    name: name.trim(),
    role: userRole,
    roleLabel: userRole === 'admin' ? 'Administrator' : 'Member'
  };

  const { password: _, ...safeUser } = users[usernameKey];
  res.json({ success: true, message: `User "${name}" created successfully`, user: safeUser });
});

// Delete a user (admin only)
app.delete('/api/users/:username', requireAdmin, (req, res) => {
  const usernameKey = req.params.username.toLowerCase();
  const adminUsername = req.headers['x-admin-user'].toLowerCase();
  
  if (!users[usernameKey]) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (usernameKey === adminUsername) {
    return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
  }

  const deletedUser = users[usernameKey];
  delete users[usernameKey];
  
  // Also remove their tasks
  const userTasks = tasks.filter(t => t.assignedTo === usernameKey);
  userTasks.forEach(t => {
    const index = tasks.indexOf(t);
    if (index > -1) tasks.splice(index, 1);
  });
  
  res.json({ success: true, message: `User "${deletedUser.name}" deleted successfully` });
});

// ============ TASKS API ============

// Get all tasks (admin) or user's tasks (member)
app.get('/api/tasks', (req, res) => {
  const username = req.headers['x-user'];
  
  if (!username || !users[username.toLowerCase()]) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const user = users[username.toLowerCase()];
  
  let userTasks;
  if (user.role === 'admin') {
    // Admin sees all tasks
    userTasks = tasks;
  } else {
    // Members only see their own tasks
    userTasks = tasks.filter(t => t.assignedTo === username.toLowerCase());
  }

  // Add assignee name to each task
  const tasksWithNames = userTasks.map(task => ({
    ...task,
    assignedToName: users[task.assignedTo]?.name || task.assignedTo,
    assignedByName: users[task.assignedBy]?.name || task.assignedBy
  }));

  res.json(tasksWithNames);
});

// Create a new task (admin only)
app.post('/api/tasks', requireAdmin, (req, res) => {
  const { title, description, assignedTo, priority } = req.body;
  const adminUsername = req.headers['x-admin-user'];
  
  if (!title || !assignedTo) {
    return res.status(400).json({ success: false, message: 'Title and assignee are required' });
  }

  if (!users[assignedTo.toLowerCase()]) {
    return res.status(400).json({ success: false, message: 'Assigned user not found' });
  }

  const newTask = {
    id: ++taskIdCounter,
    title: title.trim(),
    description: description?.trim() || '',
    assignedTo: assignedTo.toLowerCase(),
    assignedBy: adminUsername.toLowerCase(),
    status: 'pending',
    priority: priority || 'medium',
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);

  res.json({ 
    success: true, 
    message: `Task assigned to ${users[assignedTo.toLowerCase()].name}`,
    task: {
      ...newTask,
      assignedToName: users[newTask.assignedTo]?.name,
      assignedByName: users[newTask.assignedBy]?.name
    }
  });
});

// Update task status (complete/uncomplete)
app.patch('/api/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const { status } = req.body;
  const username = req.headers['x-user'];
  
  if (!username || !users[username.toLowerCase()]) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const task = tasks.find(t => t.id === taskId);
  
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  const user = users[username.toLowerCase()];
  
  // Only allow if admin or task is assigned to this user
  if (user.role !== 'admin' && task.assignedTo !== username.toLowerCase()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  task.status = status;
  
  res.json({ success: true, message: 'Task updated', task });
});

// Delete a task (admin only)
app.delete('/api/tasks/:id', requireAdmin, (req, res) => {
  const taskId = parseInt(req.params.id);
  
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  
  if (taskIndex === -1) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  tasks.splice(taskIndex, 1);
  
  res.json({ success: true, message: 'Task deleted' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
