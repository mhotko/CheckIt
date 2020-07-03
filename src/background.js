'use strict'

import { app, protocol, BrowserWindow, Tray, globalShortcut } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'
const path = require('path')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let tray

const assets = path.join(__dirname, '../src/assets')

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

//dont show app in dock! on mac
if (app.dock) {
  app.dock.hide()
}

let h = 500
let w = 300

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: w,
    minWidth: w,
    maxWidth: w,
    height: h,
    minHeight: h,
    maxHeight: h,
    skipTaskbar: true,
    show: false,
    resizable: false,
    fullscreenable: false,
    frame: false,
    useContentSize: true,
    autoHideMenuBar: true,

    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    //if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  win.on('closed', () => {
    win = null
  })

  win.on('blur', () => {
    win.hide()
  })
}

function createTray() {
  tray = new Tray(path.join(assets, 'logo.png'))
  tray.on('right-click', function() {
    console.log('right-click')
    toggleWindow()

  })
  tray.on('double-click', function () {
    console.log('double-click')
    toggleWindow()

  })
  tray.on('click', function (event) {
    toggleWindow()


    if (win.isVisible() && process.defaultApp && event.metaKey) {
      win.openDevTools({
        mode: 'detach'
      })
    }

  })

}

function toggleWindow() {
  if (win.isVisible()) {
    win.hide()
  } else {
    showWindow()
  }
}

function showWindow() {
  const position = getWinPos()
  // had to set position this way otherwise windows grows by 1px each time it is shown.
  // this is also not the best solution because the height and width fluctuate by 1px
  // that is a known bug in electron community
  win.setBounds({
    width: w,
    height: h,
    x: position.x,
    y: position.y
  });
  win.show()
  win.focus()
}

function getWinPos() {
  //win.setSize(300, 500)
  const winBound = win.getBounds()
  const trayBound = tray.getBounds()
  const x = Math.round(trayBound.x + (trayBound.width / 2) - (winBound.width / 2))

  // for windows we should subtract the height of the window on OS-es that have the taskbar on top this will not be possible
  // figure out logic for that or a better method to do it
  const y = Math.round(trayBound.y - winBound.height - 4)

  return {x: x, y: y}
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createTray()
  createWindow()
})

app.whenReady().then(() => {
  globalShortcut.register('CommandOrControl+Alt+Y', () => {
    if (!win.isVisible()) {
      showWindow()
    }
  })
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
