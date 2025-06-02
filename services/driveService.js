const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Carrega ENV 
const envPath = path.join(__dirname, '..', '.env');
require('dotenv').config({ path: envPath });

class DriveService {
    constructor() {
        this.driveClient = this.createDriveClient();
        this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    }

    createDriveClient() {
        const credentials = {
            type: 'service_account',
            project_id: process.env.GOOGLE_PROJECT_ID,
            private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
            private_key: process.env.GOOGLE_PRIVATE_KEY,
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            client_id: process.env.GOOGLE_CLIENT_ID,
            auth_uri: 'https://accounts.google.com/o/oauth2/auth',
            token_uri: 'https://oauth2.googleapis.com/token',
            auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
            client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL,
            universe_domain: 'googleapis.com'
        };

        // Ensure private key is properly formatted with newlines
        if (credentials.private_key) {
            credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
        }

        const auth = new google.auth.GoogleAuth({
            credentials: credentials, // Usa o objeto de credenciais diretamente
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
                supportsAllDrives: true,
            });

            // Configura permissão pública para o arquivo
            await this.driveClient.permissions.create({
                fileId: response.data.id,
                requestBody: {
                    role: 'reader',
                    type: 'anyone',
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