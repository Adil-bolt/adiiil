import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function copyDirectory(source, destination) {
    try {
        // Créer le répertoire de destination
        await fs.mkdir(destination, { recursive: true });
        
        // Lire le contenu du répertoire source
        const entries = await fs.readdir(source, { withFileTypes: true });
        
        for (const entry of entries) {
            const sourcePath = path.join(source, entry.name);
            const destPath = path.join(destination, entry.name);
            
            // Ignorer les dossiers node_modules, .git, et les fichiers de backup
            if (entry.name === 'node_modules' || 
                entry.name === '.git' || 
                entry.name === 'dist' ||
                entry.name === 'build' ||
                entry.name.startsWith('Backup_') ||
                entry.name.startsWith('.')) {
                continue;
            }
            
            if (entry.isDirectory()) {
                // Récursivement copier les sous-répertoires
                await copyDirectory(sourcePath, destPath);
            } else {
                // Copier les fichiers
                await fs.copyFile(sourcePath, destPath);
                console.log(`✓ Copié: ${entry.name}`);
            }
        }
    } catch (error) {
        console.error(`Erreur lors de la copie du répertoire: ${error}`);
    }
}

async function backupApp() {
    try {
        // Chemin source (racine du projet)
        const sourceDir = path.join(__dirname, '..');
        
        // Chemin de destination spécifique
        const destinationDir = 'C:\\Users\\21266\\Desktop\\Backup_2024-12-29';
        
        console.log('Début de la sauvegarde...');
        console.log('Source:', sourceDir);
        console.log('Destination:', destinationDir);
        
        // Copier les fichiers
        await copyDirectory(sourceDir, destinationDir);
        
        console.log('\nSauvegarde terminée avec succès !');
        console.log(`L'application a été sauvegardée dans: ${destinationDir}`);
        
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
    }
}

// Exécuter la sauvegarde
backupApp();
