const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOADS_DIR || '../uploads')));

// Routes
app.get('/', (req, res) => {
    res.send('VFD Management API is running...');
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/vfds', require('./routes/vfds'));
app.use('/api/repairs', require('./routes/repairs'));
app.use('/api/images', require('./routes/images'));
app.use('/api/email', require('./routes/email'));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
