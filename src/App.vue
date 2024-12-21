<script setup lang="ts">
import { UploadFilled } from '@element-plus/icons-vue'
import type { UploadUserFile } from 'element-plus'
import { ref, onMounted } from "vue";
const fileList = ref<UploadUserFile>()
const percentage = ref(0)

function onChange(params:UploadUserFile) {
  console.log(params);
  fileList.value = params;
}

function sendFile() {
  if (fileList.value) {
    window.ipcRenderer.send('start-ffmpeg', fileList.value.raw?.path)
  }
}

function selectNext() {
  fileList.value = undefined
  percentage.value = 0
}

onMounted(() =>{
  window.ipcRenderer.on('ffmpeg-progress', (_, progress) => {
    percentage.value = Math.round(progress * 100) / 100
    console.log('progress', progress);
  })

  window.ipcRenderer.on('ffmpeg-success', (_, code) => {
    percentage.value =  100
    console.log('ffmpeg-success', code);
  })
})
</script>

<template>
  <el-upload
    v-if="!fileList"
    class="upload-demo"
    drag
    :auto-upload="false"
    :show-file-list="false"
    :on-change="onChange"
  >
    <el-icon class="el-icon--upload"><upload-filled /></el-icon>
    <div class="el-upload__text">
      拖拽文件到此处 <em>或点击上传</em>
    </div>
    <template #tip>
      <div class="el-upload__tip">
        转码后会在所选文件目录输出同名MP4文件
      </div>
    </template>
  </el-upload>

  <div v-if="fileList">
    <div>{{ fileList.name }}</div>
    <el-progress v-if="percentage" :percentage="percentage" />
    <el-button type="primary" @click="sendFile" v-else-if="percentage !== 100">开始转码</el-button>
    <el-button type="primary" @click="selectNext" v-else-if="percentage === 100">继续选择文件</el-button>
  </div>

</template>

<style >
.upload-demo{
  width: 400px;
}

</style>
