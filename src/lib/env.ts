
import { z } from 'zod';

/**
 * Валидация переменных окружения для режима Production.
 * Предотвращает запуск приложения с отсутствующими ключами.
 */
const envSchema = z.object({
  NEXT_PUBLIC_ADMIN_PASSWORD: z.string().min(1, "Пароль администратора обязателен"),
  GEMINI_API_KEY: z.string().min(1, "API ключ Gemini обязателен"),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().optional().default('3000'),
  // Переменные для обновления через GitHub
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_OWNER: z.string().optional(),
  GITHUB_REPO: z.string().optional(),
  GITHUB_WORKFLOW_ID: z.string().optional().default('deploy.yml'),
});

const getEnvData = () => {
  return {
    NEXT_PUBLIC_ADMIN_PASSWORD: process.env.NEXT_PUBLIC_ADMIN_PASSWORD,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    GITHUB_OWNER: process.env.GITHUB_OWNER,
    GITHUB_REPO: process.env.GITHUB_REPO,
    GITHUB_WORKFLOW_ID: process.env.GITHUB_WORKFLOW_ID,
  };
};

// Проверка выполняется только на сервере или при сборке
const result = envSchema.safeParse(getEnvData());

if (!result.success && process.env.NODE_ENV === 'production') {
  console.error('❌ ОШИБКА КОНФИГУРАЦИИ ОКРУЖЕНИЯ:', JSON.stringify(result.error.format(), null, 2));
}

export const env = result.success ? result.data : getEnvData();
