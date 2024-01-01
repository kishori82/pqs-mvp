const { ipcMain } = require( 'electron' );
const path = require( 'path' );
const fs = require( 'fs-extra' );
const os = require( 'os' );
//const chokidar = require( 'chokidar' );

// local dependencies
//const notification = require( './notification' );

// get application directory
const appDir = path.resolve( os.homedir());


// watch files from the application's storage directory
exports.watchFiles = ( win ) => {
    chokidar.watch( appDir ).on( 'unlink', ( filepath ) => {
        win.webContents.send( 'app:delete-file', path.parse( filepath ).base );
    } );
}


exports.getFiles = (folderPath) => {
    try {
        // Read the contents of the directory synchronously
        const files = fs.readdirSync(folderPath);

        // Map through the files to get their sizes
        const filesWithSizes = files.map((file) => {
            const filePath = path.join(folderPath, file);
            const stats = fs.statSync(filePath);
            return {
                name: file,
                path: filePath,
                size: Number( stats.size / 1000 ).toFixed( 1 ), // kb
            };
        });

        return filesWithSizes;
    } catch (error) {
        console.error('Error reading files:', error);
        return [];
    }
}



