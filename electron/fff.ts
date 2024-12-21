import { ipcMain  } from 'electron'
import { spawn , ChildProcessWithoutNullStreams } from 'child_process'
import path from 'node:path'

const __dirname = path.dirname('../')
// 根据操作系统动态设置 FFmpeg 路径
const ffmpegPath = process.platform === 'win32'
    ? path.join(__dirname, 'resources', 'ffmpeg.exe') // Windows 平台
    : path.join(__dirname, 'resources', 'ffmpeg');    // macOS/Linux 平台

// 开始转码
let ffmpegProcess:ChildProcessWithoutNullStreams|null = null;

ipcMain.on('start-ffmpeg', (event, filePath) => {
    console.log('start-ffmpeg', filePath);
    const input = filePath
    const output = input.substr(0, input.length - 3) + 'mp4'
    const ffmpegArgs = [
        '-hwaccel', 'videotoolbox',
        '-i', input,  
        '-vf', 'scale=-1:1080',
        '-b:v', '3000K',
        '-c:v', 'h264_videotoolbox', 
        output       
    ];
    // 视频总时长（秒） - 这里需要通过其他手段获取视频时长
    let totalDuration = 0;

    // 用于匹配时间进度的正则表达式：time=00:01:23.45
    const timeRegex = /time=(\d+):(\d+):(\d+\.\d+)/;
    ffmpegProcess = spawn(ffmpegPath, ffmpegArgs);


    // 监听 FFmpeg 输出
    ffmpegProcess.stderr.on('data', (data) => {
        const message = data.toString();

        // 提取视频总时长（你可以用 ffprobe 事先获取视频总时长）
        if (message.includes('Duration:')) {
            const durationMatch = message.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
            if (durationMatch) {
                const hours = parseFloat(durationMatch[1]);
                const minutes = parseFloat(durationMatch[2]);
                const seconds = parseFloat(durationMatch[3]);
                totalDuration = hours * 3600 + minutes * 60 + seconds; // 视频总时长（秒）
                console.log(`视频总时长：${totalDuration} 秒`);
            }
        }

        // 解析时间进度
        const timeMatch = message.match(timeRegex);
        if (timeMatch) {
            const hours = parseFloat(timeMatch[1]);
            const minutes = parseFloat(timeMatch[2]);
            const seconds = parseFloat(timeMatch[3]);
            const currentTime = hours * 3600 + minutes * 60 + seconds;

            if (totalDuration > 0) {
                const progress = ((currentTime / totalDuration) * 100);
                console.log(`当前进度：${progress}%`);
                event.sender.send('ffmpeg-progress', progress)
            }
        }
    });

    // 监听 FFmpeg 进程结束
    ffmpegProcess.on('close', (code) => {
        event.sender.send('ffmpeg-success', input, code)
        ffmpegProcess = null;
    });

});


  
// 取消转码
ipcMain.on('cancel-ffmpeg', (event) => {
    if (ffmpegProcess) {
        console.log(`取消 FFmpeg 转码，终止子进程 PID: ${ffmpegProcess.pid}`);
        ffmpegProcess.kill('SIGTERM'); // 向子进程发送终止信号
        ffmpegProcess = null;
        event.reply('ffmpeg-cancelled'); // 通知渲染进程转码已取消
    } else {
        console.log('没有正在运行的 FFmpeg 进程');
        event.reply('ffmpeg-cancelled'); // 通知渲染进程没有任务需要取消
    }
});
