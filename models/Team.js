const mongoose = require('mongoose');

const AthleteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor, adicione um nome']
  },
  cpf: {
    type: String,
    required: [true, 'Por favor, adicione um CPF'],
    unique: false // Removemos unique aqui pois será tratado pelo índice composto
  },
  rg: {
    type: String,
    required: [true, 'Por favor, adicione um RG'],
    unique: false // Removemos unique aqui pois será tratado pelo índice composto
  },
  phone: {
    type: String,
    required: [true, 'Por favor, adicione um telefone']
  },
  email: {
    type: String,
    required: [true, 'Por favor, adicione um email'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor, adicione um email válido'
    ]
  },
  birthDate: {
    type: Date,
    required: [true, 'Por favor, adicione a data de nascimento']
  },
  address: {
    type: String,
    required: [true, 'Por favor, adicione um endereço']
  },
  race: {
    type: String,
    required: [true, 'Por favor, especifique a raça/etnia']
  },
  sex: {
    type: String,
    enum: ['masculino', 'feminino'],
    required: [true, 'Por favor, especifique o sexo biológico']
  },
  gender: {
    type: String,
    enum: ['masculino', 'feminino', 'outro'],
    required: [true, 'Por favor, especifique o gênero']
  },
  hasAllergy: {
    type: Boolean,
    required: [true, 'Por favor, informe se há alergias']
  },
  allergy: {
    type: String,
    required: function () {
      return this.hasAllergy;
    }
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: [true, 'Por favor, informe o tipo sanguíneo']
  },
  photo: {
    type: String,
    default: null
  },
  ct: {
    type: Boolean,
    required: [true, 'Por favor, informe se há alergias']
  },
  nameCT: {
    type: String,
    required: function () {
      return this.ct;
    }
  },
  emergencyContacts: [
    {
      name: {
        type: String,
        required: [true, 'Por favor, adicione um nome']
      },
      phone: {
        type: String,
        required: [true, 'Por favor, adicione um telefone']
      },
      relationship: {
        type: String,
        required: [true, 'Por favor, especifique o relacionamento']
      }
    }
  ]
});

const TeamSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  teamName: {
    type: String,
    required: [true, 'Por favor, adicione um nome para o time'],
    unique: true,
    trim: true
  },
  modality: {
    type: String,
    required: [true, 'Por favor, especifique a modalidade']
  },
  category: {
    type: String,
    required: [true, 'Por favor, especifique a categoria']
  },
  gender: {
    type: String,
    enum: ['masculino', 'feminino', 'misto'],
    required: [true, 'Por favor, especifique o gênero']
  },
  city: {
    type: String,
    enum: ['Fortaleza', 'Aquiraz'],
    required: [true, 'Por favor, especifique a cidade']
  },
  athletes: [AthleteSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índices compostos para garantir unicidade de CPF e RG por cidade
TeamSchema.index({ city: 1, 'athletes.cpf': 1 }, { unique: true });
TeamSchema.index({ city: 1, 'athletes.rg': 1 }, { unique: true });


module.exports = mongoose.model('Team', TeamSchema);