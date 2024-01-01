
function executeDecode(inputFilePath1, inputFilePath2, outputFilePath) {

    const status = document.getElementById( 'result1' );

    window.fileops.executeDecode({input1: inputFilePath1, input2:inputFilePath2,  output: outputFilePath})
      .then((response) => {
        status.style.color = 'green';
        status.innerText = 'Decryption successful';
      })
      .catch((error) => {
        status.style.color = 'red';
        status.innerText = 'Decryption failed: ' + error;
      });
}


function executeEncode(inputFilePath, outputFilePath) {
    const r = 5; // Change this as needed
    const p = 15; // Change this as needed
    const status = document.getElementById( 'result0' );

    window.fileops.executeEncode({ input: inputFilePath, output: outputFilePath, r, p })
      .then((response) => {
        status.style.color = 'green';
        status.innerText = 'Encryption successful';

      })
      .catch((error) => {
        status.style.color = 'red';
        status.innerText = 'Encryption failed: ' + error;
      });

    return status.innerText;
}


async function handleDrop(dropzone_id, urlInput_id, event){
  
   // Prevent the default behavior of dropping (e.g., opening the files)
    event.preventDefault();

    if (document.getElementById("urlInput0")==document.getElementById("urlInput1")) {
           window.myAPI.showAlert("Encryption and Decryption folders cannot be same!");
           return;
    }

    // Access the data that was set during the dragstart operation
    const filepath = event.dataTransfer.getData('text/plain');
    console.log(event.dataTransfer);

    // Check if the data is available
    /*
    if (filepath) {
      console.log('Dropped Filepath:', filepath);
      // Perform actions with the filepath as needed
    } else {
      console.log('No data found from the source element.');
    }*/

    files  = [filepath];
    const urlInput = document.getElementById(urlInput_id);
    const inputValue = urlInput.value;


    if (!inputValue) {
        window.myAPI.showAlert("Please provide a directory path.");
        return;
    }
    
    try {
        const isDirectory = await window.api.checkDirectory(inputValue);
    
        if (!isDirectory) {
            window.myAPI.showAlert("Please provide a valid directory path.");
            return;
        }

        for (const filePath of files) {
            try {
                let resultText = "Not processed";
                // Use a regular expression to split the filepath by either '/' or '\'
                const parts = filePath.split(/[\/\\]/);
                // Get the last part of the array, which is the filename
                const fileName = parts[parts.length - 1];
                
                // if dropped on the encrypt zone
                if (dropzone_id=="dropzone0") {
                    // Use contextBridge to securely call the main process function
                    resultText = executeEncode(filePath, inputValue + "/" +  fileName);
                }

                // if dropped on the decrypt zone
                if (dropzone_id=="dropzone1") {
                    let filepath1 = null;
                    let filepath2 = null;

                    if (filePath.endsWith('.pqs1')) {
                        // If filePath ends with ".1", replace it with ".2" for filepath2
                        filepath2 = filePath.replace(/\.pqs1$/, '.pqs2');
                        filepath1 = filePath;
                    } else if (filePath.endsWith('.pqs2')) {
                        // If filePath ends with ".2", replace it with ".1" for filepath1
                        filepath1 = filePath.replace(/\.pqs2$/, '.pqs1');
                        filepath2 = filePath;
                    }
                    if (filepath1) {
                        let fileNameOutput = fileName.replace(/\.pqs[12]$/, '');
                        resultText = executeDecode(filepath1, filepath2,  inputValue + "/" +  fileNameOutput);
                    } else {
                        console.log(`${filePath} is  not a PQS file` )
                        const status = document.getElementById( 'result0' );
                        status.style.color = 'orange';
                        status.innerText = 'Not a PQS file';
                    }
                }
            } catch (error) {
              console.error("Error encoding file:" + filePath, error);
              // Provide user feedback or implement retry mechanisms as needed
            }
          }

        // Proceed with directory operations
    } catch (error) {
        console.error("An error occurred checking the directory:", error);
        return;
    }
    // if a valid directory we will list the files
    let local_files = [];
    await window.api.invoke('app:get-files', inputValue).then((localfiles=[]) => {
       local_files = localfiles;
    })
    .catch((error) => {
        console.error('Error getting files:', error);
    });

    displayFiles(dropzone_id, local_files);
};

async function handleDragOver(event) {
    event.stopPropagation();
    event.preventDefault();
}

// when file is released
const  dropzone1 = document.getElementById("dropzone1");

// when file is released
const  dropzone0 = document.getElementById("dropzone0");

// Add the event listener to both dropzone elements
dropzone0.addEventListener("drop", (event) => handleDrop("dropzone0", "urlInput0", event));
dropzone1.addEventListener("drop", (event) => handleDrop("dropzone1", "urlInput1", event));

// Add the event listener to both dropzone elements
dropzone0.addEventListener("dragover", (event) => handleDragOver(event));
dropzone1.addEventListener("dragover", (event) => handleDragOver(event));

function truncateString(str, maxLength) {
    if (str.length > maxLength) {
    return str.slice(0, maxLength - 3) + '...';
   }
   return str;
}

displayFiles = (dropzone_id, files = [] ) => {
    const fileListElem = document.getElementById( dropzone_id );
    fileListElem.innerHTML = '';

    files.forEach( file => {
        const itemDomElem = document.createElement( 'div' );
        itemDomElem.setAttribute( 'id', file.name ); // set `id` attribute
        itemDomElem.setAttribute( 'class', 'icon' ); // set `class` attribute
        itemDomElem.setAttribute( 'data-filepath', file.path ); // set `data-filepath` attribute

        // Set up the dragstart event listener with an anonymous function
        itemDomElem.addEventListener('dragstart', (event) => {
            // Access the `data-filepath` attribute from the current element
            const filepath = itemDomElem.getAttribute('data-filepath');
            
            // Set the data to be transferred during the drag operation
            event.dataTransfer.setData('text/plain', filepath);
        });

        let shortName = truncateString(file.name, 20);
        itemDomElem.innerHTML = `
                <img src="../assets/document.svg" draggable="true" alt="Drag Me" alt="Folder Icon" data-filepath="${file.path}" >
                <span class="icon-name">${shortName}</span>
                <span class="tooltip">${file.name}</span>
       `;

        fileListElem.appendChild( itemDomElem );
    } );

    // Get the draggable elements inside the dropzone
     const draggableElements = document.querySelectorAll('#dropzone [draggable="true"]');

    // Add a 'dragstart' event listener to each draggable element
    draggableElements.forEach((element) => {
        element.addEventListener('dragstart', (event) => {
            const iconFilename = element.getAttribute('src'); // Get the icon's filename
            event.dataTransfer.setData('text/plain', iconFilename);
        });
    });

    //console.log(fileListElem.innerHTML);
};

const loadButton0 = document.getElementById("loadbutton0");
const loadButton1 = document.getElementById("loadbutton1");

async function handleLoadClick(dropzone_id, urlInput_id, event) {

    try {
        const folderPath = await window.api.invoke('open-folder-dialog');
   
        if (folderPath) {
            const urlInput = document.getElementById(urlInput_id);
            urlInput.value = folderPath; // Update the input field value with the folder path

            let local_files;
            await window.api.invoke('app:get-files', folderPath).then((localfiles=[]) => {
                local_files = localfiles;
             })
             .catch((error) => {
                 console.error('Error getting files:', error);
             });
             displayFiles(dropzone_id, local_files);

        } else {
            console.log("No folder selected");
            // Handle case when no folder is selected
        }
    } catch (error) {
        console.error('Error opening folder dialog:', error);
        // Handle error condition
    }
};
// Add the event listener to both dropzone elements
loadButton0.addEventListener("click", (event) => handleLoadClick("dropzone0", "urlInput0", event));
loadButton1.addEventListener("click", (event) => handleLoadClick("dropzone1", "urlInput1", event));

async function handleUrlInput(dropzone_id, event){
    const inputValue = event.target.value;
    //console.log("Input value changed:", inputValue);
    try {
        const isDirectory = await window.api.checkDirectory(inputValue);
        if (isDirectory) {
            let local_files;
            await window.api.invoke('app:get-files', inputValue).then((localfiles=[]) => {
                local_files = localfiles;
             })
             .catch((error) => {
                 console.error('Error getting files:', error);
             });
             displayFiles(dropzone_id, local_files);
        } 
    } catch (error) {
        //console.error('Error checking directory:', error);
        // Handle error
    }
};
const  urlInput0 = document.getElementById("urlInput0");
const  urlInput1 = document.getElementById("urlInput1");

// Add the event listener to both dropzone elements
urlInput0.addEventListener("input", (event) => handleUrlInput("dropzone0",  event));
urlInput1.addEventListener("input", (event) => handleUrlInput("dropzone1",  event));


    // Get the progress bar element
const progressBar = document.getElementById('progress-bar');
let progressValue = 0;

    // Function to update progress bar
const updateProgress = () => {
        progressValue += 1;
        progressBar.style.width = progressValue + '%';
        // Repeat the function every second (1000ms)
        if (progressValue < 100) {
            setTimeout(updateProgress, 500);
        }
    };

// Initial call to start updating progress bar
console.log("progressing....");
//updateProgress();

// Receive folder change notifications from the main process
ipcRenderer.receive('folder-change-notification', (message) => {
    // Print the notification message to the console
    let local_files;
    window.api.invoke('app:get-files', message).then((localfiles=[]) => {
        local_files = localfiles;
     })
     .catch((error) => {
         console.error('Error getting files:', error);
     });
    //console.log(`message recieved ${message}`); // This will print "Folder has changed" when a change is detected
});


async function updateFiles(urlInput0, dropzone_id) {
    const inputValue = urlInput0.value;

    if (inputValue.trim().length ===0 ) {
        return
    }

    try {
        const isDirectory = await window.api.checkDirectory(inputValue);
        if (isDirectory) {
            let local_files;
            await window.api.invoke('app:get-files', inputValue).then((localfiles=[]) => {
                local_files = localfiles;
             })
             .catch((error) => {
                 console.error('Error getting files:', error);
             });
             displayFiles(dropzone_id, local_files);
        } 
    } catch (error) {
        //console.error('Error checking directory:', error);
        // Handle error
    }
}

// Set up an interval to print "hello" every 1000 milliseconds (1 second)
const intervalId0 = setInterval( () => { updateFiles(urlInput0, "dropzone0"); }, 2000);
const intervalId1 = setInterval( () => { updateFiles(urlInput1, "dropzone1"); }, 2000);

// To stop the interval after a certain duration (e.g., 10 seconds), you can use setTimeout
/*
const intervalId = setInterval(() => {
    printHello("Hello, custom message!");
}, 1000);
*/