const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// User accounts database (in production, use a real database with hashed passwords)
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

// Simple admin check (in production, use proper JWT/session authentication)
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
    return res.status(400).json({ 
      success: false, 
      message: 'Username and password are required' 
    });
  }

  const user = users[username.toLowerCase()];
  
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      message: 'User not found' 
    });
  }

  if (user.password !== password) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid password' 
    });
  }

  // Don't send password back to client
  const { password: _, ...safeUser } = user;
  
  res.json({ 
    success: true, 
    message: 'Login successful',
    user: safeUser
  });
});

// Get all users (for display, without passwords)
app.get('/api/users', (req, res) => {
  const safeUsers = Object.values(users).map(({ password, ...user }) => user);
  res.json(safeUsers);
});

// Add a new user (admin only)
app.post('/api/users', requireAdmin, (req, res) => {
  const { username, name, password, role } = req.body;
  
  if (!username || !name || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Username, name, and password are required' 
    });
  }

  const usernameKey = username.toLowerCase().trim();
  
  if (users[usernameKey]) {
    return res.status(400).json({ 
      success: false, 
      message: 'Username already exists' 
    });
  }

  if (usernameKey.length < 2) {
    return res.status(400).json({ 
      success: false, 
      message: 'Username must be at least 2 characters' 
    });
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
  
  res.json({ 
    success: true, 
    message: `User "${name}" created successfully`,
    user: safeUser
  });
});

// Delete a user (admin only)
app.delete('/api/users/:username', requireAdmin, (req, res) => {
  const usernameKey = req.params.username.toLowerCase();
  const adminUsername = req.headers['x-admin-user'].toLowerCase();
  
  if (!users[usernameKey]) {
    return res.status(404).json({ 
      success: false, 
      message: 'User not found' 
    });
  }

  // Prevent admin from deleting themselves
  if (usernameKey === adminUsername) {
    return res.status(400).json({ 
      success: false, 
      message: 'You cannot delete your own account' 
    });
  }

  const deletedUser = users[usernameKey];
  delete users[usernameKey];
  
  res.json({ 
    success: true, 
    message: `User "${deletedUser.name}" deleted successfully` 
  });
});

// API endpoint example
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello World!', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
