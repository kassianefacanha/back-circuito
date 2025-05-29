const AdminLog = require('../models/AdminLog');
const asyncHandler = require('./async');

exports.logAdminAction = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    const action = req.method.toLowerCase() === 'post' ? 'create' : 
                  req.method.toLowerCase() === 'put' || req.method.toLowerCase() === 'patch' ? 'update' :
                  req.method.toLowerCase() === 'delete' ? 'delete' : 'other';

    let entity = req.baseUrl.split('/').pop();
    if (entity === 'api') entity = 'system';

    await AdminLog.create({
      adminId: req.user._id,
      action,
      entity,
      entityId: req.params.id || null,
      details: JSON.stringify(req.body)
    });
  }
  next();
});