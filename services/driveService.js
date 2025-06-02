const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class DriveService {
    constructor() {
        this.driveClient = this.createDriveClient();
        this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;; // Substitua pelo ID da sua pasta
    }

    createDriveClient() {
        const auth = new google.auth.GoogleAuth({
            keyFile: path.join(__dirname, 'credentials.json'), // Arquivo de credenciais
            scopes: ['https://www.googleapis.com/auth/drive'],
        });

        return google.drive({
            version: 'v3',
            auth,
        });
    }

    async uploadFile(file) {
    try {
        // Verifica se o arquivo temporário existe
        if (!fs.existsSync(file.path)) {
            throw new Error('Arquivo temporário não encontrado');
        }

        const fileMetadata = {
            name: file.originalname,
            parents: [this.folderId],
        };

        const media = {
            mimeType: file.mimetype,
            body: fs.createReadStream(file.path),
        };

        // Configuração completa do upload
        const response = await this.driveClient.files.create({
            resource: fileMetadata,
            media,
            fields: 'id,name,webViewLink,webContentLink',
            supportsAllDrives: true, // Essencial para pastas compartilhadas
        });

        // Configura permissão pública para o arquivo
        await this.driveClient.permissions.create({
            fileId: response.data.id,
            requestBody: {
                role: 'reader',
                type: 'anyone', // Torna público para leitura
            },
            supportsAllDrives: true,
        });

        // Cria URLs de acesso
        const fileData = {
            id: response.data.id,
            name: response.data.name,
            webViewLink: response.data.webViewLink,
            directDownload: `https://drive.google.com/uc?id=${response.data.id}&export=download`,
            thumbnail: `https://drive.google.com/thumbnail?id=${response.data.id}&sz=w500`,
        };

        // Limpeza do arquivo temporário
        try {
            fs.unlinkSync(file.path);
        } catch (cleanupError) {
            console.warn('Aviso: Não foi possível deletar arquivo temporário', cleanupError);
        }

        return fileData;

    } catch (error) {
        console.error('Erro detalhado no upload:', {
            message: error.message,
            response: error.response?.data,
            stack: error.stack
        });

        // Tenta limpar o arquivo temporário mesmo em caso de erro
        if (file?.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }

        // Transforma erros específicos do Google em mensagens mais amigáveis
        if (error.message.includes('insufficientFilePermissions')) {
            throw new Error('Permissões insuficientes na pasta de destino');
        } else if (error.message.includes('storageQuotaExceeded')) {
            throw new Error('Cota de armazenamento excedida no Google Drive');
        }

        throw error;
    }
}
}

module.exports = DriveService;