// This is main process of Electron, started as first thing when your
// app starts. It runs through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

// import path from "path";
// import url from "url";
import {app, ipcMain, shell} from "electron";
import createWindow from "./helpers/window";

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from "env";
let deeplinkingUrl;

// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
if (env.name !== "production") {
    const userDataPath = app.getPath("userData");
    app.setPath("userData", `${userDataPath} (${env.name})`);
}

const setApplicationMenu = () => {
    const menus = [appMenuTemplate, editMenuTemplate];
    if (env.name !== "production") {
        menus.push(devMenuTemplate);
    }
    Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
};

// We can communicate with our window (the renderer process) via messages.
const initIpc = () => {
    ipcMain.on("need-app-path", (event) => {
        event.reply("app-path", app.getAppPath());
    });
    ipcMain.on("open-external-link", (event, href) => {
        shell.openExternal(href);
    });
};

app.setAsDefaultProtocolClient('medaica-live');

app.on('open-url', function (event, url) {
    event.preventDefault();
    deeplinkingUrl = url;
});

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    app.quit()
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        deeplinkingUrl = argv.find((arg) => arg.startsWith('medaica-live://'));
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()
        }
    })

    app.on("ready", () => {
        //setApplicationMenu();
        initIpc();

        const mainWindow = createWindow("main", {
            width: 1000,
            height: 600,
            webPreferences: {
                // Two properties below are here for demo purposes, and are
                // security hazard. Make sure you know what you're doing
                // in your production app.
                nodeIntegration: true,
                contextIsolation: false,
                // Spectron needs access to remote module
                enableRemoteModule: env.name === "test"
            }
        });

        mainWindow.loadURL("https://patient.dev.medaica.com/live-exam");

        if (env.name === "development") {
            mainWindow.openDevTools();
        }
    });
    // Handle the protocol. In this case, we choose to show an Error Box.
    app.on('open-url', (event, url) => {
        dialog.showErrorBox('Welcome Back', `You arrived from: ${url}`)
    })
}

app.on("window-all-closed", () => {
    app.quit();
});
