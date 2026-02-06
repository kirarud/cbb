import { test, expect } from '@playwright/test';

test('smoke: register, login, navigate all views', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('MUZA NEXUS')).toBeVisible();

  // Register
  await page.getByRole('button', { name: /РЕГИСТРАЦИЯ/i }).click();
  const user = `e2e_${Date.now()}`;
  const pass = 'MuzaE2E!123';

  await page.locator('input[type="text"]').first().fill(user);
  const passInputs = page.locator('input[type="password"]');
  await passInputs.nth(0).fill(pass);
  await passInputs.nth(1).fill(pass);

  await page.getByRole('button', { name: /СОЗДАТЬ СУЩНОСТЬ/i }).click();
  await expect(page.getByText(/Сохраните этот ключ/i)).toBeVisible({ timeout: 15_000 });

  // Switch to login and authenticate
  await page.getByRole('button', { name: /ВОЙТИ КАК/i }).click();
  await page.locator('input[type="password"]').fill(pass);
  await page.getByRole('button', { name: /ДОСТУП/i }).click();

  await expect(page.getByTestId('nav')).toBeVisible({ timeout: 15_000 });

  const openView = async (mode: string, expected: RegExp | string) => {
    await page.getByTestId(`nav-${mode}`).click();
    await expect(page.getByText(expected)).toBeVisible({ timeout: 10_000 });
  };

  await openView('FOCUS', /Потоки Мыслей/i);
  await openView('DATA_VAULT', /ХРОНИКИ ХРАНИТЕЛЯ/i);
  await openView('SYNESTHESIA', /Ядро Синестезии/i);
  await openView('DESIGN_STUDIO', /Студия Дизайна/i);
  await openView('EVOLUTION', /Индекс Эволюции Сознания/i);
  await openView('MUSIC_LAB', /Нейро.?Генезис/i);
  await page.getByTestId('nav-SPLIT_CODE').click();
  await expect(page.getByRole('button', { name: 'JS' })).toBeVisible();
  await openView('IMMERSIVE_SPACE', /Нейросеть \\(3D\\)/i);
  await openView('MATRIX', /Зрительный Нерв/i);
  await openView('NEURAL_STUDIO', /Нейро-Студия/i);
  await openView('DEPLOY', /Экспорт Ядра/i);
  await openView('SETTINGS', /Конфигурация Ядра/i);
  await openView('WIKI', /Архивы Знаний/i);
});
