const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const url = require('url');
//process.env.NODE_ENV = 'production';


var knex = require('knex')({
    client: "sqlite3",
    connection: {
        filename: "./database.sqlite"
    },
    useNullAsDefault: true
});

app.on("ready", () => {

    knex.schema.hasTable('Users').then(function(exists) {
        if (!exists) {
          return knex.schema.createTable('Users', function(table) {
            table.increments('id').primary();
            table.string('FirstName', 100).notNullable();
            table.string('LastName', 100).notNullable();
            table.string('RoomNumber', 100).notNullable();
            table.string('CellPhone', 100);
            table.string('EmergencyContactName', 100).notNullable();
            table.string('EmergencyContactNumber', 100).notNullable();
          });
        }
      });
    

    // Build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate)
    // Insert menu
    Menu.setApplicationMenu(mainMenu);

    let mainWindow = new BrowserWindow({ 
        webPreferences: { nodeIntegration: true},
        height: 800, width: 800, show: false, kiosk: false });
        //height: 800, width: 800, show: false, kiosk: false });
        mainWindow.loadURL(url.format({        
        // or mainWindow.loadURL(`file://${__dirname}/mainWindow.html`)
        pathname: path.join(__dirname, 'mainWindow.html'),
        protocol: 'file:',
        slashes: true        
    }));    

    mainWindow.once("ready-to-show", () => {mainWindow.show() });

    ipcMain.on("mainWindowLoaded", function () {
        if (process.env.NODE_ENV !== 'production') {
            mainWindow.setKiosk(true);
        } else {
            mainWindow.setKiosk(false);
        }        
        knex.select("FirstName").from("Users")
        .returning()
        .then(data => {          
            if (data.length < 1 && process.env.NODE_ENV !== 'production'){
                console.log("No Users found so Adding some now")
                var insert1 = [{FirstName: 'Test', LastName: 'Then'},{ FirstName: 'Delete', LastName: 'Me'}]
                knex.insert(insert1).into("Users")
                .then(function (rows) {
                    candidateWindow.webContents.send("resultSent", rows);
                    if (process.env.NODE_ENV !== 'production') {
                        mainWindow.setKiosk(true);
                    } else {
                        mainWindow.setKiosk(false);
                    }                         
                });
            }; 
            if (data.length >= 1){
                console.log("We already have users so not adding sample data")
                let result = knex.select("FirstName").from("Users")
                    result.then(function(rows){
                        candidateWindow.webContents.send("resultSent", rows);
                        if (process.env.NODE_ENV !== 'production') {
                            mainWindow.setKiosk(true);
                        } else {
                            mainWindow.setKiosk(false);
                        }                             
                    });     
                };            
        });
    });

    ipcMain.on("add-candidate-window", () => {
        console.log("This is from the add candidate call")
        createAddWindow();
    })  
    
    ipcMain.on("open-webcam-window", () => {
        console.log("recieved from AddWindow")
        createCamWindow();
    })
    
    ipcMain.on('info:add', function(e, candidateInfo){
        var candidate = [{FirstName: candidateInfo.firstName, 
            LastName: candidateInfo.lastName, 
            RoomNumber: candidateInfo.roomNumber,
            CellPhone: candidateInfo.cellPhone,
            EmergencyContactName: candidateInfo.emergencyContactName,
            EmergencyContactNumber: candidateInfo.emergencyContactNumber
        }]
                    knex.insert(candidate).into("Users")
                    .then(function () {
                        knex.select("FirstName").from("Users")
                        .returning()
                        .then(data => {  
                        candidateWindow.webContents.send("resultSent", data);
                        if (process.env.NODE_ENV !== 'production') {
                            mainWindow.setKiosk(true);
                        } else {
                            mainWindow.setKiosk(false);
                        }                             
                        });
                    });
        
        addWindow.close();
    });

    ipcMain.on('candidateWindowLoaded', function() {
        knex.select("*").from("Users")
        .returning()
        .then(data => {
            candidateWindow.webContents.send("resultSent", data);
        });
    });

    ipcMain.on('enable-submit', function() {
        addWindow.webContents.send("enable-submit");
    })

    ipcMain.on('download-csv', function() {
        knex.select().from("Users").returning()
        .then(data => {  
            var dataArray = arrayToCSV(data);     
            console.log(dataArray);
            candidateWindow.webContents.send("csvData", dataArray);
        });        
    }) 

    

});

const mainMenuTemplate = [
    {
        label:'File',
        submenu: [
            {
                label: 'Add Item',
                click(){
                    createAddWindow();
                }
            },
            {
                label: 'Quit',
                accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                click(){
                    app.quit();
                }
            },
            {
                label: 'Show Candidates',
                click(){
                    showCandidateWindow();
                }
            }
        ]        
    }
];

function createAddWindow() {
    addWindow = new BrowserWindow(
        {webPreferences: { nodeIntegration: true},
        width: 800,
        height: 1000,
        title: 'Add New Candidate'
    });
    // Load HTML file into window
    addWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'addWindow.html'),
        protocol: 'file:',
        slashes: true
    }));    
    
    // Garbage collection handel
    addWindow.on('close', function() {
        addWindow = null;
    });
}

function createCamWindow() {
    camWindow = new BrowserWindow(
        {webPreferences: { nodeIntegration: true},
        width: 600,
        height: 800,
        title: 'Camera'
    });
    // Load HTML file into window
    camWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'camWindow.html'),
        protocol: 'file:',
        slashes: true
    }));    
    
    // Garbage collection handel
    camWindow.on('close', function() {
        camWindow = null;
    });
}

function showCandidateWindow() {
    candidateWindow = new BrowserWindow(
        {webPreferences: { nodeIntegration: true},
        width: 600,
        height: 800,
        title: 'Candidates'
    });
    // Load HTML file into window
    candidateWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'candidateWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    
    // Garbage collection handel
    candidateWindow.on('close', function() {
        candidateWindow = null;
    });
}

if (process.env.NODE_ENV !== 'production') {
    mainMenuTemplate.push({
        label: 'Dev Tools',
        submenu: [
            {
                label: 'Toggle Dev Tools',
                accelerator: process.platform === 'darwin' ? 'Cmd+D' : 'Ctrl+D',
                click(item, focusedWindow) {
                    focusedWindow.toggleDevTools();
                }
            },
            {
                role: 'reload'
            }
        ]
    })
}

function downloadableCSV(rows) {
    var content = "data:text/csv;charset=utf-8,";
    var rows = new Array;
    rows = knex.select("*").from("Users");
  
    rows.forEach(function(row, index) {
      content += row.join(",") + "\n";
    });
  
    return encodeURI(content);
  }
  
  function arrayToCSV(objArray) {
    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    let csvContent = "data:text/csv;charset=utf-8,";
    let str = csvContent + `${Object.keys(array[0]).map(value => `"${value}"`).join(",")}` + '\r\n';

    return array.reduce((str, next) => {
        str += `${Object.values(next).map(value => `"${value}"`).join(",")}` + '\r\n';
        return str;
       }, str);
}
  


