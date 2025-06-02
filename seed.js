require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Team = require('./models/Team');
const News = require('./models/News');
const Scoreboard = require('./models/Scoreboard');
const Match = require('./models/Match');

connectDB();

// Função para limpar o banco
const clearDB = async () => {
  await User.deleteMany();
  await Team.deleteMany();
  await News.deleteMany();
  await Scoreboard.deleteMany();
  await Match.deleteMany();
};

// Função principal
const seedDB = async () => {
  try {
    await clearDB();

    // Criar usuários admin
    const admin1 = await User.create({
      name: 'Admin DEV',
      email: 'adminDev@admin.com',
      phone: '85999999999',  
      password: '@dev123',
      confirmPassword: '@dev123',
      role: 'admin'
    });

    const admin2 = await User.create({
      name: 'Admin Principal',
      email: 'admin@admin.com',
      phone: '85999999998', 
      password: '@admin123',
      confirmPassword: '@admin123',
      role: 'admin'
    });
  
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();