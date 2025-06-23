const mongoose = require('mongoose');
const Team = require('../models/Team');

const connectDB = async () => {
  try {
    // Configuração otimizada para MongoDB 4.0+
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
      socketTimeoutMS: 45000,
      family: 4, // Usar IPv4
      retryWrites: true,
      retryReads: true
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📁 Database: ${conn.connection.name}`);

    // Migração segura de índices
    if (process.env.ALLOW_INDEX_MIGRATION === 'true') {
      await handleIndexMigration(conn.connection.db);
    }

    // Verificação de índices (apenas para desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      await verifyIndexes(conn.connection.db);
    }
  } catch (err) {
    console.error(`❌ Database connection error: ${err.message}`);
    process.exit(1);
  }
};

/**
 * Migração segura de índices com tratamento de dados duplicados
 */
async function handleIndexMigration(db) {
  try {
    console.log('🔄 Starting index migration...');
    const collection = db.collection('teams');

    // 1. Verificar e corrigir duplicatas antes de criar índices
    const duplicates = await findDuplicates(db);
    
    if (duplicates.length > 0) {
      console.warn('⚠️ Found duplicates:');
      console.table(duplicates);
      throw new Error('Duplicate documents found. Clean data before migration.');
    }

    // 2. Remover índices antigos se existirem
    const oldIndexes = [
      { 'athletes.cpf': 1 },
      { 'athletes.rg': 1 },
      { 'athletes.cpf': 1, city: 1 },
      { 'athletes.rg': 1, city: 1 }
    ];

    for (const index of oldIndexes) {
      try {
        await collection.dropIndex(index);
        console.log(`🗑️ Removed old index: ${JSON.stringify(index)}`);
      } catch (err) {
        if (err.code !== 27) { // Ignorar erro "Index not found"
          throw err;
        }
      }
    }

    // 3. Criar novos índices compostos
    const newIndexes = [
      {
        key: { city: 1, 'athletes.cpf': 1 },
        options: { 
          unique: true,
          name: 'city_cpf_unique',
          background: true // Criar em segundo plano
        }
      },
      {
        key: { city: 1, 'athletes.rg': 1 },
        options: { 
          unique: true,
          name: 'city_rg_unique',
          background: true
        }
      }
    ];

    for (const { key, options } of newIndexes) {
      try {
        await collection.createIndex(key, options);
        console.log(`✅ Created index: ${options.name}`);
      } catch (err) {
        if (err.code === 85) { // Index already exists
          console.log(`ℹ️ Index already exists: ${options.name}`);
        } else {
          throw err;
        }
      }
    }

    console.log('🎉 Index migration completed successfully');
  } catch (error) {
    console.error('❌ Index migration failed:', error);
    throw error;
  }
}

/**
 * Encontrar documentos com CPF/RG duplicados
 */
async function findDuplicates(db) {
  const duplicates = [];
  const collections = ['teams']; // Adicione outras coleções se necessário

  for (const collName of collections) {
    const collection = db.collection(collName);
    
    // Verificar duplicatas de CPF por cidade
    const cpfDups = await collection.aggregate([
      { $unwind: "$athletes" },
      { 
        $group: {
          _id: { city: "$city", cpf: "$athletes.cpf" },
          count: { $sum: 1 },
          docs: { $push: { teamId: "$_id", athlete: "$athletes.name" } }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    // Verificar duplicatas de RG por cidade
    const rgDups = await collection.aggregate([
      { $unwind: "$athletes" },
      { 
        $group: {
          _id: { city: "$city", rg: "$athletes.rg" },
          count: { $sum: 1 },
          docs: { $push: { teamId: "$_id", athlete: "$athletes.name" } }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    duplicates.push(...cpfDups, ...rgDups);
  }

  return duplicates;
}

/**
 * Verificar índices (apenas para desenvolvimento)
 */
async function verifyIndexes(db) {
  try {
    const collection = db.collection('teams');
    const indexes = await collection.indexes();
    
    console.log('🔍 Current indexes:');
    console.table(indexes.map(idx => ({
      name: idx.name,
      key: JSON.stringify(idx.key),
      unique: idx.unique || false,
      background: idx.background || false
    })));
  } catch (error) {
    console.error('❌ Index verification failed:', error);
  }
}

module.exports = connectDB;