# File Downloader Service

Windows Service на Node.js/TypeScript для скачивания файла по HTTP/HTTPS-ссылке и сохранения в локальную папку.

## Что делает сервис

Сервис принимает HTTP POST-запрос, в котором передаются:

- `targetFolder` — локальная папка назначения
- `url` — прямая ссылка на файл
- `fileName` — имя файла для сохранения

После этого сервис:

1. скачивает файл по ссылке
2. сохраняет его в указанную папку
3. возвращает результат в HTTP-ответе

## Текущий контракт

### Один запрос = один файл

ELMA должна отправлять отдельный запрос на каждый файл.

При необходимости ELMA может отправлять несколько запросов параллельно.

---

## Технологии

- Node.js
- TypeScript
- Fastify
- undici
- WinSW

---

## Структура проекта

file-downloader-service/
├─ config.json
├─ package.json
├─ package-lock.json
├─ tsconfig.json
├─ README.md
├─ dist/
├─ src/
│  ├─ app.ts
│  ├─ config.ts
│  ├─ services/
│  │  └─ download-service.ts
│  ├─ types/
│  │  └─ download.ts
│  └─ utils/
│     ├─ auth.ts
│     └─ validation.ts
└─ deploy/
   ├─ build.bat
   ├─ run.bat
   ├─ install-service.bat
   ├─ uninstall-service.bat
   ├─ FileDownloaderService.exe
   └─ FileDownloaderService.xml

---

## Конфиг

Сервис читает настройки из файла: `config.json`
Файл должен лежать в корне проекта.

Как создать конфиг:

Скопировать config.example.json
Переименовать копию в config.json
Заполнить реальные значения

Пояснение параметров
`server.host` - Адрес, на котором слушает HTTP сервер.
`server.port` - Порт HTTP API.
`download.headersTimeoutMs` - Максимальное время ожидания начала ответа от удалённого сервера.
`download.bodyTimeoutMs` - Максимальное время ожидания скачивания тела ответа.
`security.apiKey` - Секретный ключ, который клиент должен передавать в заголовке

x-api-key: your-secret-key
---

