#!/bin/bash

# --- Загрузка переменных окружения из .env файла ---
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# --- Проверка наличия GITHUB_TOKEN ---
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ ОШИБКА: Токен для GitHub не найден в файле .env."
    echo "💡 Пожалуйста, следуйте инструкции в файле README.md."
    exit 1
fi

# --- Настройки репозитория ---
REPO_OWNER="Aleksey29212"
REPO_NAME="Darts55-"
REPO_URL_WITH_TOKEN="https://oauth2:${GITHUB_TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git"
PUBLIC_REPO_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}"

echo "🚀 Начинаю процесс БЕЗОПАСНОЙ отправки на GitHub..."
echo "🛡️ Выполняю полную очистку локальной истории Git для удаления секретов..."

# --- ПОЛНЫЙ СБРОС ЛОКАЛЬНОГО РЕПОЗИТОРИЯ ---
# Это необходимо, чтобы удалить все следы коммитов с секретами
rm -rf .git

# --- Повторная инициализация ---
git init -b main
git config --global user.email "action@github.com"
git config --global user.name "DartBrig Pro Sync"

# --- Первый коммит с .gitignore ---
# Это гарантирует, что .env НИКОГДА не попадет в историю
git add .gitignore
git commit -m "Initial commit: Add .gitignore to exclude secrets"

# --- Второй коммит со всеми остальными файлами ---
git add .
git commit -m "Production Release: Add all project files"

# --- Настройка удаленного репозитория и принудительная отправка ---
git remote add origin "$REPO_URL_WITH_TOKEN"

echo "📤 Отправка чистой истории в репозиторий... (Это может занять некоторое время)"
git push --force origin main

# --- Проверка результата ---
if [ $? -eq 0 ]; then
    echo ""
    echo "✨ УСПЕХ! Репозиторий очищен и успешно синхронизирован с GitHub: ${PUBLIC_REPO_URL}"
else
    echo ""
    echo "❌ ОШИБКА: Не удалось отправить файлы. См. сообщение от Git выше."
    echo "💡 ПРОВЕРЬТЕ, что ваш GITHUB_TOKEN в файле .env корректен и имеет права 'repo' и 'workflow'."
fi
