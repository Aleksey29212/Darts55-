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

echo "🚀 Начинаю процесс отправки на GitHub..."

# --- Инициализация репозитория, если его нет ---
if [ ! -d ".git" ]; then
    echo "🔍 Локальный репозиторий не найден. Инициализация..."
    git init -b main
    git remote add origin "$REPO_URL_WITH_TOKEN"
fi

# --- Конфигурация пользователя (на случай, если не задано глобально) ---
git config --global user.email "action@github.com"
git config --global user.name "DartBrig Pro Sync"

# --- Добавление всех файлов в отслеживание ---
echo "📝 Индексирую все изменения..."
git add .

# --- Проверка наличия изменений для коммита ---
# git status --porcelain - выводит изменения в коротком формате. Если вывод пустой - изменений нет.
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ Нет новых изменений для отправки. Репозиторий уже синхронизирован."
    # Добавим принудительный пуш на случай, если история разошлась
    echo "🔄 Пробую принудительно синхронизировать историю..."
    git push --force origin main
    if [ $? -eq 0 ]; then
      echo "✨ История успешно синхронизирована с GitHub: ${PUBLIC_REPO_URL}"
    else
      echo "❌ ОШИБКА: Не удалось принудительно отправить файлы."
    fi
    exit 0
fi

# --- Создание коммита ---
echo "📦 Создаю коммит..."
# Коммит с датой, чтобы избежать конфликтов с одинаковыми сообщениями
COMMIT_MESSAGE="Production Sync: $(date)"
git commit -m "$COMMIT_MESSAGE"

# --- Отправка на GitHub ---
echo "📤 Отправляю изменения в репозиторий... (Это может занять некоторое время)"
# --force нужен, чтобы перезаписать историю на GitHub и избежать конфликтов
git push --force origin main

# --- Проверка результата ---
if [ $? -eq 0 ]; then
    echo ""
    echo "✨ УСПЕХ! Репозиторий успешно синхронизирован с GitHub: ${PUBLIC_REPO_URL}"
else
    echo ""
    echo "❌ ОШИБКА: Не удалось отправить файлы. См. сообщение от Git выше."
    echo "💡 ПРОВЕРЬТЕ, что ваш GITHUB_TOKEN в файле .env корректен и имеет права 'repo' и 'workflow'."
fi
