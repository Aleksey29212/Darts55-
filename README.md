# DartBrig Pro - Профессиональная рейтинговая система

DartBrig Pro — это полнофункциональное веб-приложение, созданное на Next.js для отслеживания и отображения рейтингов игроков в дартс. Оно включает в себя панель администратора для управления турнирами, игроками, стилями и многим другим.

## 🚀 Технологический стек

-   **Фреймворк:** [Next.js](https://nextjs.org/) (App Router)
-   **Язык:** [TypeScript](https://www.typescriptlang.org/)
-   **База данных:** [Firebase Firestore](https://firebase.google.com/products/firestore)
-   **Аутентификация:** [Firebase Authentication](https://firebase.google.com/products/auth)
-   **UI компоненты:** [ShadCN/UI](https://ui.shadcn.com/)
-   **Стилизация:** [Tailwind CSS](https://tailwindcss.com/)
-   **ИИ-функции:** [Google AI (Gemini)](https://ai.google.dev/)
-   **Парсинг:** [Cheerio](https://cheerio.js.org/)

## 🏁 Начало работы (Локальная разработка)

1.  **Установите зависимости:**
    ```bash
    npm install
    ```

2.  **Настройте переменные окружения:**
    Скопируйте файл `.env.local.example` (если он есть) в `.env` и заполните необходимые ключи для Firebase, Google AI и пароль администратора.

3.  **Запустите сервер для разработки:**
    ```bash
    npm run dev
    ```
    Приложение будет доступно по адресу `http://localhost:3000`.

## 📦 Развертывание (Deployment)

Проект полностью сконфигурирован для развертывания на различных платформах.

### Автоматическое развертывание на Timeweb

При каждом `push` в `main` ветку запускается GitHub Action, который автоматически собирает и развертывает приложение на хостинг Timeweb.

-   **Подробная инструкция по настройке:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

### Развертывание на Vercel

Проект также можно легко развернуть на Vercel, платформе от создателей Next.js.

-   **Руководство по развертыванию на Vercel:** [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)

### Ручная сборка для хостинга

Вы можете создать оптимизированную `standalone` сборку для любого хостинга, поддерживающего Node.js.

1.  **Запустите скрипт сборки:**
    ```bash
    npm run build
    ```
    Или воспользуйтесь готовым скриптом, который подготовит папку `deploy`:
    ```bash
    ./deploy.sh
    ```
2.  Загрузите содержимое папки `deploy` на ваш хостинг.
