const express = require('express');
const router = express.Router();
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const DriveService = require('../services/driveService');
const driveService = new DriveService();

router.post('/', uploadMiddleware.single('file'), async (req, res) => {
    
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado' });
        }

        const uploadedFile = await driveService.uploadFile(req.file);
        
        res.json({
            success: true,
            message: 'Arquivo enviado com sucesso',
            file: uploadedFile,
        });
    } catch (error) {
        console.error('Erro no upload:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erro ao processar upload',
        });
    }
});


module.exports = router;