import api from '@/api';
import * as FileSystem from 'expo-file-system';

export async function requestPresignedUrl(
  uri: string,
  mimeType: string | string[],
) {
  const { putUrl, key } = (
    await api.post('/upload/url', {
      filename: uri.split('/').pop(),
      mime: mimeType,
    })
  ).data;
  return { putUrl, key };
}

export async function uploadToS3(putUrl: string, uri: string) {
  return await FileSystem.uploadAsync(putUrl, uri, {
    httpMethod: 'PUT',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: { 'Content-Type': 'image/jpeg' },
  });
}

export async function generate(key: string, mode: string) {
  return (await api.post(`/generate`, { key, mode })).data.jobId;
}

export async function getDownloadUrl(jobId: string) {
  // let status = 'PENDING';
  // let outputUrl = '';
  // while (status === 'PENDING') {
  const { data } = await api.get(`/jobs/${jobId}`);
  console.log(data);
  // status = response.data.status;
  // outputUrl = response.data.outputUrl;
  // await new Promise((r) => setTimeout(r, 2000));
  // }
  return data.downloadUrl;
}

export async function downloadGif(outputUrl: string) {
  const localUri = FileSystem.cacheDirectory + `result_${Date.now()}.gif`;
  const downloadRes = await FileSystem.downloadAsync(outputUrl, localUri);
  return downloadRes.uri;
}

export async function downloadAudio(outputUrl: string) {
  const localUri = FileSystem.cacheDirectory + `result_${Date.now()}.mp3`;
  const downloadRes = await FileSystem.downloadAsync(outputUrl, localUri);
  return downloadRes.uri;
}
