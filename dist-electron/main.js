import { ipcMain as h, app as i, BrowserWindow as w } from "electron";
import { fileURLToPath as I } from "node:url";
import e from "node:path";
import { spawn as j } from "child_process";
const R = e.dirname("../"), b = process.platform === "win32" ? e.join(R, "resources", "ffmpeg.exe") : e.join(R, "resources", "ffmpeg");
let s = null;
h.on("start-ffmpeg", (t, u) => {
  console.log("start-ffmpeg", u);
  const r = u, T = r.substr(0, r.length - 3) + "mp4", D = [
    "-hwaccel",
    "videotoolbox",
    "-i",
    r,
    "-vf",
    "scale=-1:1080",
    "-b:v",
    "3000K",
    "-c:v",
    "h264_videotoolbox",
    T
  ];
  let c = 0;
  const F = /time=(\d+):(\d+):(\d+\.\d+)/;
  s = j(b, D), s.stderr.on("data", (a) => {
    const p = a.toString();
    if (p.includes("Duration:")) {
      const n = p.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
      if (n) {
        const d = parseFloat(n[1]), m = parseFloat(n[2]), f = parseFloat(n[3]);
        c = d * 3600 + m * 60 + f, console.log(`视频总时长：${c} 秒`);
      }
    }
    const l = p.match(F);
    if (l) {
      const n = parseFloat(l[1]), d = parseFloat(l[2]), m = parseFloat(l[3]), f = n * 3600 + d * 60 + m;
      if (c > 0) {
        const _ = f / c * 100;
        console.log(`当前进度：${_}%`), t.sender.send("ffmpeg-progress", _);
      }
    }
  }), s.on("close", (a) => {
    t.sender.send("ffmpeg-success", r, a), s = null;
  });
});
h.on("cancel-ffmpeg", (t) => {
  s ? (console.log(`取消 FFmpeg 转码，终止子进程 PID: ${s.pid}`), s.kill("SIGTERM"), s = null, t.reply("ffmpeg-cancelled")) : (console.log("没有正在运行的 FFmpeg 进程"), t.reply("ffmpeg-cancelled"));
});
const v = e.dirname(I(import.meta.url));
process.env.APP_ROOT = e.join(v, "..");
const g = process.env.VITE_DEV_SERVER_URL, S = e.join(process.env.APP_ROOT, "dist-electron"), E = e.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = g ? e.join(process.env.APP_ROOT, "public") : E;
let o;
function P() {
  o = new w({
    icon: e.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: e.join(v, "preload.mjs")
    }
  }), o.webContents.on("did-finish-load", () => {
    o == null || o.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), o.webContents.openDevTools(), g ? o.loadURL(g) : o.loadFile(e.join(E, "index.html"));
}
i.on("window-all-closed", () => {
  process.platform !== "darwin" && (i.quit(), o = null);
});
i.on("activate", () => {
  w.getAllWindows().length === 0 && P();
});
i.whenReady().then(P);
export {
  S as MAIN_DIST,
  E as RENDERER_DIST,
  g as VITE_DEV_SERVER_URL
};
