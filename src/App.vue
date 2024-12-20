<script setup lang="ts">
import { UploadFilled } from '@element-plus/icons-vue'
import type { UploadUserFile } from 'element-plus'
import { ref } from "vue";
const fileList = ref<UploadUserFile[]>([])

function onChange(params:UploadUserFile[]) {
  console.log(params);
  fileList.value = params;
}
</script>

<template>
  <el-upload
    v-if="!fileList.length"
    class="upload-demo"
    drag
    multiple
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

  <div v-if="fileList.length">
    <div v-for="file in fileList" :key="file.name">{{ file.name }}</div>
  </div>

</template>

<style >
.upload-demo{
  width: 400px;
}

</style>
