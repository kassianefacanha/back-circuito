const mongoose = require('mongoose');

const AdminLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: [true, 'Por favor, especifique a ação'],
    enum: ['create', 'update', 'delete', 'login', 'logout', 'other']
  },
  entity: {
    type: String,
    required: [true, 'Por favor, especifique a entidade'],
    enum: ['user', 'team', 'news', 'scoreboard', 'match', 'system']
  },
  entityId: {
    type: mongoose.Schema.ObjectId
  },
  details: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AdminLog', AdminLogSchema);