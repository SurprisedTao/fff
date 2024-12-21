import { ipcMain as _, app as i, BrowserWindow as P } from "electron";
import { fileURLToPath as D } from "node:url";
import e from "node:path";
import { spawn as L } from "child_process";
import { fileURLToPath as b } from "url";
const h = e.dirname(b(import.meta.url)), w = process.platform === "win32" ? e.join(h, "../resources", "ffmpeg.exe") : e.join(h, "../resources", "ffmpeg");
console.log(`ffmpegPath: ${w}`);
let s = null;
_.on("start-ffmpeg", (t, u) => {
  console.log("start-ffmpeg", u);
  const r = u, F = r.substr(0, r.length - 3) + "mp4", I = [
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
    F
  ];
  let c = 0;
  const j = /time=(\d+):(\d+):(\d+\.\d+)/;
  s = L(w, I), s.stderr.on("data", (a) => {
    const p = a.toString();
    if (p.includes("Duration:")) {
      const n = p.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
      if (n) {
        const m = parseFloat(n[1]), f = parseFloat(n[2]), d = parseFloat(n[3]);
        c = m * 3600 + f * 60 + d, console.log(`视频总时长：${c} 秒`);
      }
    }
    const l = p.match(j);
    if (l) {
      const n = parseFloat(l[1]), m = parseFloat(l[2]), f = parseFloat(l[3]), d = n * 3600 + m * 60 + f;
      if (c > 0) {
        const R = d / c * 100;
        console.log(`当前进度：${R}%`), t.sender.send("ffmpeg-progress", R);
      }
    }
  }), s.on("close", (a) => {
    t.sender.send("ffmpeg-success", r, a), s = null;
  });
});
_.on("cancel-ffmpeg", (t) => {
  s ? (console.log(`取消 FFmpeg 转码，终止子进程 PID: ${s.pid}`), s.kill("SIGTERM"), s = null, t.reply("ffmpeg-cancelled")) : (console.log("没有正在运行的 FFmpeg 进程"), t.reply("ffmpeg-cancelled"));
});
const T = e.dirname(D(import.meta.url));
process.env.APP_ROOT = e.join(T, "..");
const g = process.env.VITE_DEV_SERVER_URL, x = e.join(process.env.APP_ROOT, "dist-electron"), E = e.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = g ? e.join(process.env.APP_ROOT, "public") : E;
let o;
function v() {
  o = new P({
    icon: e.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: e.join(T, "preload.mjs")
    }
  }), o.webContents.on("did-finish-load", () => {
    o == null || o.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), g ? o.loadURL(g) : o.loadFile(e.join(E, "index.html"));
}
i.on("window-all-closed", () => {
  process.platform !== "darwin" && (i.quit(), o = null);
});
i.on("activate", () => {
  P.getAllWindows().length === 0 && v();
});
i.whenReady().then(v);
export {
  x as MAIN_DIST,
  E as RENDERER_DIST,
  g as VITE_DEV_SERVER_URL
};
