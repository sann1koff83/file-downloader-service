# File Downloader Service

Windows Service на Node.js/TypeScript для скачивания файлов по HTTP/HTTPS и сохранения в целевую директорию.

## Назначение

Сервис предназначен для интеграции с ELMA365.

Сервис:
- принимает массив файлов на загрузку;
- скачивает файлы во временную директорию;
- при успешной загрузке всей пачки копирует их в целевую директорию;
- после успешного копирования удаляет временные файлы;
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
    "targetFolder": "\\\\kaz-fs2\\HR PROJECTS\\01 Elma Promo\\Input",
    "tempFolder": "C:\\FileDownloaderTemp"
  },
  "download": {
    "headersTimeoutMs": 5000,
    "bodyTimeoutMs": 45000,
    "concurrency": 10
  },
  "cleanup": {
    "cron": "0 * * * *",
    "olderThanHours": 24
  },
  "serviceLogon": {
    "username": "DOMAIN\\account",
    "password": "your-password"
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
- `cleanup.cron` — расписание очистки `tempFolder`
- `cleanup.olderThanHours` — удалять файлы и папки старше указанного времени
- `serviceLogon.username` — учётная запись, под которой должна запускаться служба
- `serviceLogon.password` — пароль учётной записи службы
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

- `targetFolder` и `tempFolder` задаются только через конфиг
- сервис не принимает целевую директорию через API
- при старте сервиса проверяется доступность `targetFolder` и `tempFolder`
- итоговое имя файла формируется в сервисе с использованием UUID
- файлы сначала сохраняются в `tempFolder`
- если хотя бы один файл из пачки не скачался, в `targetFolder` не копируется ничего
- временные файлы из `tempFolder` очищаются самим приложением по cron-расписанию
- служба настраивается на запуск под учётной записью из `serviceLogon`

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

## Особенности работы с сетевой папкой

Если `targetFolder` указывает на сетевую шару, например `\\\\kaz-fs2\\...`, служба должна быть запущена под учётной записью, у которой есть права на запись в эту папку.

Для этого в конфиге используется блок:

```json
"serviceLogon": {
  "username": "DOMAIN\\svc_file_downloader",
  "password": "your-password-here"
}
```

Во время установки `install-service.bat` применяет эти креды к Windows Service.

## Перенос файлов между temp и target

Если `tempFolder` и `targetFolder` находятся на разных storage, например:
- `tempFolder` на `C:\...`
- `targetFolder` на `\\my-network\...`

то обычный `rename` работать не будет.

Поэтому сервис после успешной загрузки использует:
- `copyFile`
- затем удаление временного файла

Это позволяет корректно работать со сценарием локальный temp + сетевая конечная папка.

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

Порядок установки:
1. создать `config.json`
2. выполнить `deploy\build.bat`
3. выполнить `deploy\install-service.bat`

## Очистка временной папки

Очистка `tempFolder` выполняется самим приложением по расписанию.

Настройки очистки задаются в секции `cleanup` файла `config.json`:

- `cleanup.cron` — cron-выражение расписания
- `cleanup.olderThanHours` — удалять файлы и папки старше указанного времени

Пример:

```json
"cleanup": {
  "cron": "0 * * * *",
  "olderThanHours": 24
}
```

## Требования

- Windows
- Node.js
- npm
