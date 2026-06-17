import { expect, test } from '@playwright/test';

test('un invio vuoto consuma un tentativo e resta persistente cambiando livello', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Invia' }).click();
  await expect(page.getByText('Tentativo 1/4 consumato')).toBeVisible();
  await expect(page.getByText('Immagine 2/4')).toBeVisible();

  await page.getByRole('button', { name: 'Cambia livello' }).click();
  await page.getByRole('button', { name: /#2/ }).click();
  await expect(page.getByText('Livello 2')).toBeVisible();

  await page.getByRole('button', { name: 'Cambia livello' }).click();
  await page.getByRole('button', { name: /#1/ }).click();
  await expect(page.getByText('Immagine 2/4')).toBeVisible();
  await expect(page.getByLabel(/1 tentativi usati su 4/)).toBeVisible();
});
