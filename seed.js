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
      name: 'Admin Principal',
      email: 'admin@example.com',
      phone: '85999999999', 
      gender: 'masculino', 
      city: 'Fortaleza', 
      password: 'senhasegura123',
      confirmPassword: 'senhasegura123',
      role: 'admin'
    });

    const admin2 = await User.create({
      name: 'Admin Dev',
      email: 'adminDev@example.com',
      phone: '85999999998', 
      gender: 'masculino', 
      city: 'Fortaleza', 
      password: 'senhasegura123',
      confirmPassword: 'senhasegura123',
      role: 'admin'
    });
    console.log('Admin users created!');

    // Criar alguns times de exemplo
    const team1 = await Team.create({
      teamName: 'Time A Fortaleza',
      modality: 'Futebol',
      category: 'Sub20',
      gender: 'masculino',
      city: 'Fortaleza',
      athletes: [
        {
          name: 'Jogador 1',
          cpf: '12345678901',
          rg: '1234567',
          phone: '85988888888',
          email: 'jogador1@example.com',
          birthDate: '2003-05-15',
          address: 'Rua A, 123 - Fortaleza',
          race: 'Parda',
          sex: 'masculino',
          gender: 'masculino',
          hasAllergy: false,
          allergy: '',
          bloodType: 'O+',
          emergencyContacts: [
            { name: 'Mãe', phone: '85977777777', relationship: 'Mãe' }
          ]
        }
      ]
    });

    const team2 = await Team.create({
      teamName: 'Time B Aquiraz',
      modality: 'Vôlei',
      category: 'Adulto',
      gender: 'feminino',
      city: 'Aquiraz',
      athletes: [
        {
          name: 'Jogadora 1',
          cpf: '98765432109',
          rg: '7654321',
          phone: '85988888889',
          email: 'jogadora1@example.com',
          birthDate: '1995-08-20',
          address: 'Rua B, 456 - Aquiraz',
          race: 'Branca',
          sex: 'feminino',
          gender: 'feminino',
          hasAllergy: true,
          allergy: 'Amendoim',
          bloodType: 'A+',
          emergencyContacts: [
            { name: 'Pai', phone: '85977777778', relationship: 'Pai' }
          ]
        }
      ]
    });

    console.log('Sample teams created!');

    // Criar notícias de exemplo
    await News.create([
      {
        titulo: "Campeonato de Futebol Inicia em Fortaleza",
        resumo: "A abertura do campeonato contou com a presença de 10 times",
        autor: "Admin Equipe",
        modalidade: "Futebol",
        cidade: "Fortaleza"
      },
      {
        titulo: "Vôlei em Aquiraz tem recorde de inscrições",
        resumo: "Mais de 15 times femininos se inscreveram este ano",
        autor: "Admin Dev",
        modalidade: "Vôlei",
        cidade: "Aquiraz"
      }
    ]);

    console.log('Sample news created!');

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();