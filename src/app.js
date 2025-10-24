const express = require('express');
require('dotenv').config();

const app = express();

// Then add other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes and other middleware follow...

// ... rest of your existing app.js code 