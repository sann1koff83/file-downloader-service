# File Downloader Service

Windows Service на Node.js/TypeScript для скачивания файлов по HTTP/HTTPS и сохранения в целевую директорию.

## Назначение

Сервис предназначен для интеграции с ELMA365.

Сервис:
- принимает массив файлов на загрузку;
- скачивает файлы во временную директорию;
- при успешной загрузке всей пачки переносит их в целевую директорию;
- при ошибке не переносит файлы в целевую директорию.

## Endpoints

- `GET /health`
- `POST /api/downloads`

## Конфигурация

Сервис читает настройки из файла `config.json` в корне проекта.

### Пример `config.json`

```json
{
  "server": {
    "host": "0.0.0.0",
    "port": 3000
  },
  "storage": {
    "targetFolder": "C:\\FileDownloader",
    "tempFolder": "C:\\FileDownloaderTemp"
  },
  "download": {
    "headersTimeoutMs": 5000,
    "bodyTimeoutMs": 45000,
    "concurrency": 10
  },
  "security": {
    "apiKey": "your-api-key-here"
  }
}
```

### Параметры

- `server.host` — адрес HTTP-сервера
- `server.port` — порт HTTP API
- `storage.targetFolder` — конечная папка для сохранения файлов
- `storage.tempFolder` — временная папка для промежуточной загрузки
- `download.headersTimeoutMs` — ожидание начала ответа от удалённого сервера
- `download.bodyTimeoutMs` — ожидание загрузки тела ответа
- `download.concurrency` — количество параллельных загрузок внутри одной пачки
- `security.apiKey` — ключ авторизации, передаётся в заголовке `x-api-key`

## API contract

### Request

```ts
interface DownloadItemRequest {
  url: string;
  fileName: string;
}

interface DownloadBatchRequest {
  files: DownloadItemRequest[];
}
```

### Success response

```ts
interface DownloadedFileInfo {
  sourceFileName: string;
  generatedFileName: string;
  savedPath: string;
  url: string;
}

interface DownloadBatchResponse {
  success: true;
  message: string;
  files: DownloadedFileInfo[];
}
```

### Error response

```ts
interface ErrorResponse {
  success: false;
  errorCode: string;
  message: string;
}
```

## Правила работы

- `targetFolder` и `tempFolder` задаются через конфиг
- при старте сервиса проверяется доступность `targetFolder` и `tempFolder`
- итоговое имя файла формируется в сервисе с использованием UUID
- файлы сначала сохраняются в `tempFolder`
- если хотя бы один файл из пачки не скачался, в `targetFolder` не переносится ничего
- временные файлы из `tempFolder` очищаются отдельной задачей

## Авторизация

Для вызова `POST /api/downloads` нужно передавать заголовок:

```http
x-api-key: your-api-key
```

## Health check

```http
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

## Локальный запуск

```bash
npm install
npm run build
npm start
```

## Windows Service

Файлы для установки находятся в папке `deploy`.

Основные файлы:
- `build.bat`
- `install-service.bat`
- `uninstall-service.bat`
- `run.bat`
- `cleanup-temp.ps1`

Порядок установки:
1. создать `config.json`
2. выполнить `deploy\build.bat`
3. выполнить `deploy\install-service.bat`

## Очистка временной папки

Для очистки временной папки используется `deploy\cleanup-temp.ps1`.

Пример запуска:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy\cleanup-temp.ps1 -TempFolder "C:\FileDownloaderTemp" -OlderThanHours 24
```

## Требования

- Windows
- Node.js
- npm
