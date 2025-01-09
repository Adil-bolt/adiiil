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
        // Créer le nom du dossier de backup avec la date
        const date = new Date();
        const backupName = `Backup_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}`;
        
        // Chemin source (racine du projet)
        const sourceDir = path.join(__dirname, '..');
        
        // Chemin de destination (dossier parent/Backups)
        const parentDir = path.dirname(sourceDir);
        const backupDir = path.join(parentDir, backupName);
        
        console.log('Début de la sauvegarde...');
        console.log(`Source: ${sourceDir}`);
        console.log(`Destination: ${backupDir}`);
        
        // Copier tous les fichiers
        await copyDirectory(sourceDir, backupDir);
        
        // Créer un fichier README dans le backup
        const readmeContent = `Backup créé le ${date.toLocaleString()}

Ce dossier contient une sauvegarde complète de l'application Cabinet Medical.
Version: 2.0
Date de sauvegarde: ${date.toISOString()}
`;
        
        await fs.writeFile(path.join(backupDir, 'README.md'), readmeContent);
        
        console.log('\nSauvegarde terminée avec succès !');
        console.log(`L'application a été sauvegardée dans: ${backupDir}`);
        
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
    }
}

// Exécuter la sauvegarde
backupApp();
