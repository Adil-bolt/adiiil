const fs = require('fs');
const path = require('path');

// Créer le nom du dossier de backup avec la date
const date = new Date();
const backupName = `Backup_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}`;
const backupDir = path.join(__dirname, '..', 'backups', backupName);

// Créer le dossier de backup
fs.mkdirSync(backupDir, { recursive: true });

// Liste des fichiers à sauvegarder
const filesToBackup = [
    'src/contexts/DataContext.tsx',
    'src/pages/Patients.tsx',
    'src/services/patient/PatientNumberService.ts'
];

// Copier les fichiers
filesToBackup.forEach(file => {
    const sourcePath = path.join(__dirname, '..', file);
    const destPath = path.join(backupDir, file);
    
    // Créer les dossiers nécessaires
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    
    // Copier le fichier
    try {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✓ Sauvegarde de ${file}`);
    } catch (error) {
        console.error(`✗ Erreur lors de la sauvegarde de ${file}:`, error);
    }
});

console.log(`\nSauvegarde terminée dans le dossier: ${backupDir}`);
