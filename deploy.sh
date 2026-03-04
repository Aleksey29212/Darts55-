#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Starting DartBrig Pro production build...${NC}"

# 1. Проверка окружения
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js не установлен${NC}"
    exit 1
fi

# 2. Очистка и установка
echo -e "${YELLOW}[1/4] Installing dependencies...${NC}"
rm -rf node_modules .next
npm install --prefer-offline --no-audit

# 3. Сборка standalone версии
echo -e "${YELLOW}[2/4] Building standalone application...${NC}"
# Проверка типов перед сборкой для безопасности
npm run typecheck
NODE_ENV=production npm run build

if [ ! -d ".next/standalone" ]; then
    echo -e "${RED}❌ Ошибка сборки - папка standalone не создана${NC}"
    exit 1
fi

# 4. Подготовка папки для деплоя
echo -e "${YELLOW}[3/4] Preparing deploy folder...${NC}"
mkdir -p deploy
rm -rf deploy/*

# Копируем основные файлы сервера
cp -r .next/standalone/* deploy/
# Копируем статику (она нужна отдельно в standalone режиме)
cp -r .next/static deploy/.next/ 2>/dev/null || true
cp -r public deploy/ 2>/dev/null || true
cp package.json deploy/

# 5. Создание скрипта запуска для Timeweb
echo -e "${YELLOW}[4/4] Creating start script...${NC}"
cat > deploy/start.sh << 'EOF'
#!/bin/bash
export NODE_ENV=production
export PORT=3000
node server.js
EOF
chmod +x deploy/start.sh

echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}✅ СБОРКА ГОТОВА ДЛЯ TIMEWEB${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo "📦 Расположение файлов: ./deploy/"
echo "📤 Загрузите СОДЕРЖИМОЕ папки 'deploy' в корень вашего сайта на Timeweb."
echo "⚙️  Не забудьте указать NEXT_PUBLIC_ADMIN_PASSWORD в панели Timeweb!"
echo ""
