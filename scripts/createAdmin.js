// scripts/createAdmin.js
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcrypt');

async function createAdmin() {
  try {
    await mongoose.connect('mongodb+srv://admin:admin@cluster0.yb3vt.mongodb.net/test?retryWrites=true&w=majority');
    console.log('Connected to MongoDB');

    const hashedPassword = await bcrypt.hash('adminpassword', 10);

    const admin = new User({
      name: 'Admin',
      surname: 'Adminov',
      email: 'newadmin@example.com', // Измените email на уникальный
      username: 'newadmin', // Измените username на уникальный
      password: hashedPassword,
      role: 'admin',
      isVerified: true, // Админ сразу верифицирован
    });

    await admin.save();
    console.log('Admin created successfully');
  } catch (err) {
    console.error('Error creating admin:', err);
  } finally {
    mongoose.connection.close();
  }
}

createAdmin();
