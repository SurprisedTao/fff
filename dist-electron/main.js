import { ipcMain, app, BrowserWindow } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { spawn } from "child_process";
const __dirname$1 = path.dirname("../");
const ffmpegPath = process.platform === "win32" ? path.join(__dirname$1, "resources", "ffmpeg.exe") : path.join(__dirname$1, "resources", "ffmpeg");
let ffmpegProcess = null;
ipcMain.on("start-ffmpeg", (event, filePath) => {
  console.log("start-ffmpeg", filePath);
  const input = filePath;
  const output = input.substr(0, input.length - 3) + "mp4";
  const ffmpegArgs = [
    "-hwaccel",
    "videotoolbox",
    "-i",
    input,
    "-vf",
    "scale=-1:1080",
    "-b:v",
    "3000K",
    "-c:v",
    "h264_videotoolbox",
    output
  ];
  let totalDuration = 0;
  const timeRegex = /time=(\d+):(\d+):(\d+\.\d+)/;
  ffmpegProcess = spawn(ffmpegPath, ffmpegArgs);
  ffmpegProcess.stderr.on("data", (data) => {
    const message = data.toString();
    if (message.includes("Duration:")) {
      const durationMatch = message.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
      if (durationMatch) {
        const hours = parseFloat(durationMatch[1]);
        const minutes = parseFloat(durationMatch[2]);
        const seconds = parseFloat(durationMatch[3]);
        totalDuration = hours * 3600 + minutes * 60 + seconds;
        console.log(`视频总时长：${totalDuration} 秒`);
      }
    }
    const timeMatch = message.match(timeRegex);
    if (timeMatch) {
      const hours = parseFloat(timeMatch[1]);
      const minutes = parseFloat(timeMatch[2]);
      const seconds = parseFloat(timeMatch[3]);
      const currentTime = hours * 3600 + minutes * 60 + seconds;
      if (totalDuration > 0) {
        const progress = currentTime / totalDuration * 100;
        console.log(`当前进度：${progress}%`);
        event.sender.send("ffmpeg-progress", progress);
      }
    }
  });
  ffmpegProcess.on("close", (code) => {
    event.sender.send("ffmpeg-success", input, code);
    ffmpegProcess = null;
  });
});
ipcMain.on("cancel-ffmpeg", (event, files) => {
  if (ffmpegProcess) {
    console.log(`取消 FFmpeg 转码，终止子进程 PID: ${ffmpegProcess.pid}`);
    ffmpegProcess.kill("SIGTERM");
    ffmpegProcess = null;
    event.reply("ffmpeg-cancelled");
  } else {
    console.log("没有正在运行的 FFmpeg 进程");
    event.reply("ffmpeg-cancelled");
  }
});
createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs")
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  win.webContents.openDevTools();
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(createWindow);
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
