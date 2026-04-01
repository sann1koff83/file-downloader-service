export interface DownloadItemRequest {
  url: string;
  fileName: string;
}

export interface DownloadBatchRequest {
  files: DownloadItemRequest[];
}

export interface DownloadedFileInfo {
  sourceFileName: string;
  generatedFileName: string;
  savedPath: string;
  url: string;
}

export interface DownloadBatchResponse {
  success: true;
  message: string;
  files: DownloadedFileInfo[];
}