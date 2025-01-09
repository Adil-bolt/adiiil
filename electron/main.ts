import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // En développement, chargez l'URL de dev
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // En production, chargez le fichier index.html
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Gestionnaire pour la lecture de fichier
ipcMain.handle('read-file', async (_, filePath: string) => {
  try {
    // Vérifier si le dossier parent existe, sinon le créer
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    // Lire le fichier
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // Le fichier n'existe pas encore
      return null;
    }
    throw error;
  }
});

// Gestionnaire pour l'écriture de fichier
ipcMain.handle('write-file', async (_, { path: filePath, content }: { path: string; content: string }) => {
  try {
    // Vérifier si le dossier parent existe, sinon le créer
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    // Écrire le fichier
    await fs.writeFile(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'écriture du fichier:', error);
    throw error;
  }
});

// Gestionnaire pour sauvegarder le fichier
ipcMain.handle('save-file', async (event, { content, filePath }) => {
  try {
    const dir = path.dirname(filePath);
    
    // Créer le dossier s'il n'existe pas
    if (!(await fs.exists(dir))) {
      await fs.mkdir(dir, { recursive: true });
    }
    
    // Écrire le fichier
    await fs.writeFile(filePath, content);
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du fichier:', error);
    throw error;
  }
});
