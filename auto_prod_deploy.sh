#!/bin/bash

# ----------------------------
# ⚡ Настройки GitHub
# ----------------------------
GITHUB_USER="Aleksey29212"
GITHUB_REPO="Darts55-"
GIT_BRANCH="main"
REMOTE_URL="https://github.com/$GITHUB_USER/$GITHUB_REPO.git"

# ----------------------------
# ⚡ Настройки Timeweb
# ----------------------------
TIMEWEB_API_TOKEN="ВАШ_TIMEWEB_API_TOKEN" # вставь свой токен
TIMEWEB_APP_ID=""                          # если приложение уже есть, иначе оставь пустым

# ----------------------------
# 1️⃣ Создание структуры проекта
# ----------------------------
echo "1️⃣ Создание базовой структуры..."
mkdir -p src/app src/components src/lib src/styles public

for folder in app components lib styles public; do
  if [ -d "$folder" ]; then
    # Определяем целевую директорию
    target_dir="src/$folder"
    if [ "$folder" == "public" ]; then
        target_dir="public"
    fi
    
    # Проверяем, есть ли файлы для копирования
    if [ -n "$(ls -A $folder)" ]; then
        echo "   - Перенос файлов из '$folder' в '$target_dir'..."
        cp -r "$folder"/* "$target_dir"/
        echo "   ✔ Файлы из '$folder' успешно перенесены."
    else
        echo "   - Директория '$folder' пуста, пропускаем."
    fi
  fi
done
echo "✔ Структура проекта подготовлена."
echo ""

# ----------------------------
# 2️⃣ Конфигурационные файлы
# ----------------------------
echo "2️⃣ Создание конфигурационных файлов..."
cat > package.json <<EOL
{
  "name": "darts55-firebase",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start -H 0.0.0.0 -p 3000",
    "github-push": "bash publish.sh"
  },
  "dependencies": {
    "next": "14.3.0",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "firebase": "11.9.1",
    "lucide-react": "^0.262.0",
    "react-hook-form": "^7.46.0",
    "@hookform/resolvers": "^3.2.0",
    "zod": "^3.26.0"
  },
  "engines": {
    "node": ">=20"
  }
}
EOL
echo "   ✔ package.json создан."

cat > next.config.ts <<EOL
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};
module.exports = nextConfig;
EOL
echo "   ✔ next.config.ts создан."

cat > Dockerfile <<EOL
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "start"]
EOL
echo "   ✔ Dockerfile создан."

cat > .gitignore <<EOL
node_modules
.next
.env
.env.local
.env.production
dist
coverage
EOL
echo "   ✔ .gitignore создан."

cat > .env.example <<EOL
NEXT_PUBLIC_FIREBASE_API_KEY=***
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=***
NEXT_PUBLIC_FIREBASE_PROJECT_ID=***
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=***
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=***
NEXT_PUBLIC_FIREBASE_APP_ID=***
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=***
EOL
echo "   ✔ .env.example создан."

if [ ! -f src/lib/firebase.ts ]; then
cat > src/lib/firebase.ts <<EOL
import { initializeApp } from "firebase/app";
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};
const app = initializeApp(firebaseConfig);
export default app;
EOL
echo "   ✔ src/lib/firebase.ts создан."
fi

cat > README.md <<EOL
# Darts55-Firebase

Production-ready Next.js + Firebase.

- GitHub: $REMOTE_URL
- Dockerfile ready for Timeweb Cloud
- Port: 3000
- Environment variables from .env
EOL
echo "   ✔ README.md создан."
echo ""

# ----------------------------
# 3️⃣ Установка зависимостей
# ----------------------------
echo "3️⃣ Установка зависимостей (npm install)..."
npm install || { echo "❌ npm install failed"; exit 1; }
echo "✔ Зависимости установлены."
echo ""

# ----------------------------
# 4️⃣ Сборка проекта
# ----------------------------
echo "4️⃣ Сборка проекта (npm run build)..."
npm run build || { echo "❌ Build failed"; exit 1; }
echo "✔ Проект успешно собран."
echo ""

# ----------------------------
# 5️⃣ Локальный запуск + проверка HTTP
# ----------------------------
echo "5️⃣ Локальный запуск и проверка..."
npx next start -H 0.0.0.0 -p 3000 &
SERVER_PID=$!
echo "   - Сервер запущен с PID $SERVER_PID. Ожидание 5 секунд..."
sleep 5

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$HTTP_STATUS" != "200" ]; then
  echo "❌ Локальный сервер не ответил статусом 200 (получен: $HTTP_STATUS). Прерывание."
  kill $SERVER_PID
  exit 1
fi
echo "✔ Сервер успешно ответил статусом 200 OK."
echo ""
# Убиваем локальный сервер после проверки
kill $SERVER_PID
echo "   - Локальный сервер остановлен."
echo ""

# ----------------------------
# 6️⃣ GitHub push
# ----------------------------
echo "6️⃣ Отправка изменений на GitHub..."
if [ ! -d ".git" ]; then
  git init
  git add .
  git commit -m "Production-ready setup + migration"
  git branch -M $GIT_BRANCH
  git remote add origin $REMOTE_URL
  git push -u origin $GIT_BRANCH
  echo "✔ Проект инициализирован и отправлен на GitHub: $REMOTE_URL"
else
  git add .
  git commit -m "chore: auto-sync from production setup"
  git push origin $GIT_BRANCH
  echo "✔ Изменения отправлены в существующий репозиторий: $REMOTE_URL"
fi
echo ""

# ----------------------------
# 7️⃣ Timeweb API deploy
# ----------------------------
echo "7️⃣ Деплой на Timeweb Cloud через API..."

# Проверка наличия jq
if ! command -v jq &> /dev/null; then
    echo "❌ Ошибка: утилита 'jq' не найдена. Пожалуйста, установите ее (например, 'sudo apt-get install jq')."
    exit 1
fi

if [ "$TIMEWEB_API_TOKEN" == "ВАШ_TIMEWEB_API_TOKEN" ]; then
    echo "❌ Ошибка: Пожалуйста, укажите ваш TIMEWEB_API_TOKEN в скрипте."
    exit 1
fi

if [ -z "$TIMEWEB_APP_ID" ]; then
  echo "   - Создание нового приложения на Timeweb Cloud..."
  RESPONSE=$(curl -s -X POST "https://api.timeweb.cloud/v1/apps" \
    -H "Authorization: Bearer $TIMEWEB_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Darts55-Firebase","stack":"docker"}')
  
  TIMEWEB_APP_ID=$(echo $RESPONSE | jq -r '.id')
  
  if [ -z "$TIMEWEB_APP_ID" ] || [ "$TIMEWEB_APP_ID" == "null" ]; then
      echo "❌ Не удалось создать приложение на Timeweb. Ответ API: $RESPONSE"
      exit 1
  fi
  echo "✔ Приложение создано с ID: $TIMEWEB_APP_ID"
fi

echo "   - Запуск деплоя для приложения ID: $TIMEWEB_APP_ID..."
curl -s -X POST "https://api.timeweb.cloud/v1/apps/$TIMEWEB_APP_ID/deploy" \
  -H "Authorization: Bearer $TIMEWEB_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dockerfile_path":"./Dockerfile"}'
echo ""

# ----------------------------
# 8️⃣ Проверка статуса деплоя
# ----------------------------
echo "8️⃣ Проверка статуса деплоя..."
STATUS=""
until [ "$STATUS" == "running" ] || [ "$STATUS" == "failed" ]; do
  sleep 10
  STATUS_RESPONSE=$(curl -s -H "Authorization: Bearer $TIMEWEB_API_TOKEN" \
    "https://api.timeweb.cloud/v1/apps/$TIMEWEB_APP_ID")
  STATUS=$(echo $STATUS_RESPONSE | jq -r '.status')
  echo "   - Текущий статус: $STATUS"
done

URL=$(echo $STATUS_RESPONSE | jq -r '.urls[0]')
if [ "$STATUS" == "running" ]; then
  echo "✅ Приложение успешно запущено: $URL"
else
  echo "❌ Деплой завершился с ошибкой. Проверьте логи в панели Timeweb."
fi
echo ""

# ----------------------------
# 9️⃣ Завершение
# ----------------------------
echo "🎉 ВСЕ ОПЕРАЦИИ ЗАВЕРШЕНЫ."
echo "--------------------------------"

