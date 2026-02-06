
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow;

const isDev = !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, 'icon.png'),
    show: false, // Don't show until ready
    backgroundColor: '#030712'
  });

  // Show window when its content is ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Debug info
  console.log('Environment:', {
    isDev,
    isPackaged: app.isPackaged,
    __dirname,
    resourcesPath: process.resourcesPath,
  });

  if (isDev) {
    // Load from Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, the 'dist' folder is expected to be a sibling of the 'electron' folder
    // after the build process, and electron-builder packs it correctly.
    const htmlPath = path.join(__dirname, '..', 'dist', 'index.html');
    
    console.log('Attempting to load production build from:', htmlPath);

    if (fs.existsSync(htmlPath)) {
      mainWindow.loadFile(htmlPath);
    } else {
      console.error('Could not find index.html at the expected location.');
      const errorMessage = `
        <html>
          <body style="background:#030712;color:#fff;padding:40px;font-family:sans-serif">
            <h1>Error: Could not find index.html</h1>
            <p>The application's UI could not be loaded.</p>
            <p>Attempted path: ${htmlPath}</p>
            <p>Please check the build configuration and ensure the 'dist' folder is correctly placed.</p>
          </body>
        </html>
      `;
      mainWindow.loadURL(`data:text/html,${encodeURIComponent(errorMessage)}`);
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Example: Get App Version
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});
