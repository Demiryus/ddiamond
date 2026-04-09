const { app, BrowserWindow, Tray, Menu, nativeImage } = require('electron')
const { spawn } = require('child_process')
const path = require('path')

let mainWindow
let tray
let backendProcess

const isDev = !app.isPackaged

function startBackend() {
  const backendPath = isDev
    ? path.join(__dirname, '..', 'backend')
    : path.join(process.resourcesPath, 'backend')

  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'

  backendProcess = spawn(pythonCmd, ['-m', 'uvicorn', 'main:app', '--port', '8765', '--host', '127.0.0.1'], {
    cwd: backendPath,
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    windowsHide: true,
  })

  backendProcess.stdout.on('data', (d) => console.log('[backend]', d.toString()))
  backendProcess.stderr.on('data', (d) => console.error('[backend]', d.toString()))
  backendProcess.on('exit', (code) => console.log('[backend] çıkış kodu:', code))
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'D Diamond CRM',
    webPreferences: {
      contextIsolation: true,
    },
    backgroundColor: '#1A1A2E',
  })

  const url = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '..', 'frontend', 'dist', 'index.html')}`

  // Backend'in hazır olması için kısa bekleme
  setTimeout(() => mainWindow.loadURL(url), 2000)

  mainWindow.on('close', (e) => {
    e.preventDefault()
    mainWindow.hide()
  })
}

function createTray() {
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  tray.setToolTip('D Diamond CRM')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Aç', click: () => mainWindow.show() },
      { type: 'separator' },
      { label: 'Çıkış', click: () => {
        if (backendProcess) backendProcess.kill()
        app.exit(0)
      }},
    ])
  )
  tray.on('double-click', () => mainWindow.show())
}

app.whenReady().then(() => {
  startBackend()
  createWindow()
  createTray()
})

app.on('window-all-closed', () => {
  // Tray'de çalışmaya devam et
})

app.on('before-quit', () => {
  if (backendProcess) backendProcess.kill()
})
