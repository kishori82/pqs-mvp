const {ipcRenderer, contextBridge, dialog} = require('electron');
const os = require('os');
const fs = require('fs');
const path = require('path');


contextBridge.exposeInMainWorld("api", 
 {
    isFile: async (path) => ipcRenderer.invoke("is-file", path),

    invoke: async (channel, data) => {
        let validChannels = ['app:get-files', 'open-folder-dialog']; // list of ipcMain.handle channels allowed
        if (validChannels.includes(channel)) {
            return await ipcRenderer.invoke(channel, data); 
        }
    },
    checkDirectory: async (path) => {
        try {
            const stats = await new Promise((resolve, reject) => {
                fs.stat(path, (err, stats) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(stats);
                    }
                });
            });
            return stats.isDirectory();
        } catch (error) {
            throw new Error(error);
        }
    },

});

contextBridge.exposeInMainWorld('myAPI', {
    showAlert: (message_text) => {
      ipcRenderer.send('show-alert', message_text);
    },
  });

contextBridge.exposeInMainWorld("fileops", {
    copyFile: async (filePath, destinationFolder) => {
      console.log("Copying file " + filePath + " to folder " + destinationFolder + " in preload");
      try {
        const result = await ipcRenderer.invoke("copy-file", {
          filePath,
          destinationFolder,
        });
        return result; // Return any response from the main process
      } catch (error) {
        console.error("Error copying file:", error);
        throw error; // Re-throw to propagate to renderer
      }
    },
    
    executeEncode: async (args) => await ipcRenderer.invoke('execute-encode', args),
    executeDecode: async (args) => await ipcRenderer.invoke('execute-decode', args),

    // Listen for the 'folder-change' message from the main process

  });
  

contextBridge.exposeInMainWorld('fileCompressor', {
    compressFile: async (filePath) => {
      try {
        const compressedFilePath = await ipcRenderer.invoke('compress-file', filePath);
        return compressedFilePath;
      } catch (error) {
        console.error('Error while compressing file:', error);
        throw new Error('Compression failed'); // Propagate the error back to the caller
      }
    },
  });

contextBridge.exposeInMainWorld("os", {
    homedir: () => os.homedir(),
});

contextBridge.exposeInMainWorld("path", {
    resolve: (...args) => path.resolve(...args),
}); 


contextBridge.exposeInMainWorld("fs", {
    statSync: (filepath) => fs.statSync(filepath),
    readdirSync: (filepath) => fs.readdirSync(filepath),
});


// Expose IPCRenderer to the renderer process
contextBridge.exposeInMainWorld('ipcRenderer', {
  send: (channel, data) => {
      ipcRenderer.send(channel, data);
  },
  receive: (channel, callback) => {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
  }
});
