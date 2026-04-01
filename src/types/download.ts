export interface DownloadFileRequest {
  targetFolder: string;
  url: string;
  fileName: string;
}

export interface DownloadFileResponse {
  success: true;
  skipped: boolean;
  message: string;
  url: string;
  fileName: string;
  savedPath: string;
}