import api from '@/api';
import * as FileSystem from 'expo-file-system';

export async function requestPresignedUrl(
  uri: string,
  mimeType: string | string[],
) {
  const { putUrl, key } = (
    await api.post('upload-url', {
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

export async function requestGenerate(key: string) {
  return (await api.post('/convert', { key })).data.jobId;
}

export async function pollJobStatus(jobId: string) {
  let status = 'PENDING';
  while (status === 'PENDING') {
    status = (await api.get(`/jobs/${jobId}`)).data.status;
    await new Promise((r) => setTimeout(r, 20000));
  }
  return status;
}

export async function downloadGif(outputUrl: string) {
  const localUri = FileSystem.cacheDirectory + `result_${Date.now()}.gif`;
  const downloadRes = await FileSystem.downloadAsync(outputUrl, localUri);
  return downloadRes.uri;
}
