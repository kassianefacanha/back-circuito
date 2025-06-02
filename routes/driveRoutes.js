const express = require('express');
const router = express.Router();
const DriveService = require('../services/driveService');

router.get('/drive-image/:fileId', async (req, res) => {
    try {
        const fileId = req.params.fileId;
        const driveService = new DriveService();
        
        const response = await driveService.driveClient.files.get({
            fileId,
            alt: 'media'
        }, { responseType: 'stream' });

        res.setHeader('Content-Type', 'image/jpeg'); // Ajuste conforme necessário
        res.setHeader('Cache-Control', 'public, max-age=86400');
        response.data.pipe(res);
    } catch (error) {
        console.error('Erro ao servir imagem:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao carregar imagem'
        });
    }
});

module.exports = router;