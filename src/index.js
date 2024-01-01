const { app, BrowserWindow, ipcMain, dialog } = require('electron')

const path = require("path");
const { lstatSync } = require('fs')
const { gzip } = require('zlib');
const os = require('os');
const fs = require("fs");

// local dependencies
const {getFiles} = require( './io' );

let mainWindow;

app.whenReady().then(() => {
      mainWindow = new BrowserWindow({
          width: 800, height: 800, show:true,
          autoHideMenuBar: true,
          whaterver: true,
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
          }
      });

    console.log(path.join(__dirname, 'preload.js'));
    mainWindow.loadFile(path.join(__dirname, './index.html'));

    //mainWindow.webContents.openDevTools();
});

// when all windows are closed, quit the app
app.on( 'window-all-closed', () => {
    if( process.platform !== 'darwin' ) {
        app.quit();
    }
} );

// when app activates, open a window
app.on( 'activate', () => {
    if( BrowserWindow.getAllWindows().length === 0 ) {
        openWindow();
    }
} );

ipcMain.handle("is-file", async (_, path) => {
    return lstatSync(path).isFile();
});


// return list of files
ipcMain.handle('app:get-files', async (_, folder_path) => {
    files  =   getFiles(folder_path);
    return files;
} );

ipcMain.handle('open-folder-dialog', async (_) => {
    try {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory']
        });
        if (!result.canceled) {
            console.log("Selected folder: " + result.filePaths[0]);
            return result.filePaths[0]; // Return the selected folder path
        } else {
            return null; // Return null if no folder is selected
        }
    } catch (error) {
        console.error("Error opening folder dialog:", error);
        throw error; // Throw error to indicate failure
    }
});

ipcMain.on('compress-file', async (event, filePath) => {
    const input = fs.createReadStream(filePath);
    const output = fs.createWriteStream(`${filePath}.gz`);
  
    const gzipper = gzip();
  
    input.pipe(gzipper).pipe(output);
  
    output.on('finish', () => {
      event.sender.send('compression-done', `${filePath}.gz`);
    });
  
    gzipper.on('error', (err) => {
      console.error('Error compressing file:', err);
      event.sender.send('compression-failed');
    });
  });


ipcMain.handle("copy-file", async (event, args) => {
    console.log("Copying file " + args.filePath + " to " + args.destinationFolder);
    try {
      await fs.promises.copyFile(args.filePath, path.join(args.destinationFolder, path.basename(args.filePath)));
      return "File copied successfully!"; // Optional success message
    } catch (error) {
      console.error("Error in main process:", error);
      throw error; // Re-throw to propagate back to preload
    }
  });


ipcMain.handle('execute-encode', async (event, args) => {
    const { input, output, r, p } = args;
    // Assuming 'encode' is in your system PATH, adjust accordingly if not
    const command = `assets/encode -a encode -i "${input}" -o "${output}" -r ${r} -p ${p}`;
    

    const util = require('util');
    const exec = util.promisify(require('child_process').exec);
    console.log(command);
    try {
      const { stdout } = await exec(command);
      return stdout;
    } catch (error) {
      throw error;
    }

  });

ipcMain.handle('execute-decode', async (event, args) => {
    const { input1, input2,  output} = args;
    // Assuming 'encode' is in your system PATH, adjust accordingly if not
    const command = `assets/encode -a decode -i "${input1}" -I "${input2}" -o "${output}"`;
    

    const util = require('util');
    const exec = util.promisify(require('child_process').exec);
    console.log(command);
    try {
      const { stdout } = await exec(command);
      return stdout;
    } catch (error) {
      throw error;
    }

  });

// Create a window and load your HTML file
ipcMain.on('show-alert', (event, message_text) => {
    // Show a modal dialog box that blocks the main window
    const response = dialog.showMessageBoxSync(mainWindow, {
        type: 'info',
        title: 'Alert',
        message: message_text,
        buttons: ['OK'],
      });
});
  
ipcMain.on('start-folder-watching', (event, folderPath) => {
  // Set up folder watching logic
  console.log(`registering the folder path ${folderPath}`);

  const watcher = fs.watch(folderPath, (eventType, filename) => {
      // Notify the renderer process about the folder change
      console.log(`sending registering the folder path ${folderPath}`);

      mainWindow.webContents.send('folder-change-notification', folderPath);
  });

  // Ensure the watcher is closed when the app quits
  app.on('before-quit', () => {
      watcher.close();
  });
});