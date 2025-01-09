import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Créer le nom du dossier de backup avec la date
const date = new Date();
const backupName = `Backup_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}`;
const backupDir = path.join(__dirname, '..', 'backups', backupName);

// Créer le dossier de backup
await fs.mkdir(backupDir, { recursive: true });

// Liste des fichiers à sauvegarder
const filesToBackup = [
    'src/contexts/DataContext.tsx',
    'src/pages/Patients.tsx',
    'src/services/patient/PatientNumberService.ts'
];

// Copier les fichiers
for (const file of filesToBackup) {
    const sourcePath = path.join(__dirname, '..', file);
    const destPath = path.join(backupDir, file);
    
    // Créer les dossiers nécessaires
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    
    // Copier le fichier
    try {
        await fs.copyFile(sourcePath, destPath);
        console.log(`✓ Sauvegarde de ${file}`);
    } catch (error) {
        console.error(`✗ Erreur lors de la sauvegarde de ${file}:`, error);
    }
}

console.log(`\nSauvegarde terminée dans le dossier: ${backupDir}`);
