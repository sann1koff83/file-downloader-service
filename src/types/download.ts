export interface DownloadFileRequest {
  targetFolder: string;
  url: string;
  fileName: string;
}

export interface DownloadFileResponse {
  message: string;
  url: string;
  fileName: string;
  savedPath: string;
}