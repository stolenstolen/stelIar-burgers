import { test, expect, type Page, type Locator } from '@playwright/test';

/*
 * Мок-данные ингредиентов берутся из tests/hars/ingredients.har и должны
 * совпадать с теми, что подставляются в ответ на запрос GET api/ingredients.
 */
const BUN = {
  name: 'Краторная булка N-200i',
  price: 1255,
};

const MAIN_1 = {
  name: 'Биокотлета из марсианской Магнолии',
  price: 424,
};

const MAIN_2 = {
  name: 'Мясо бессмертных моллюсков Protostomia',
  price: 1337,
};

const SAUCE_1 = {
  name: 'Соус Spicy-X',
  price: 90,
};

const ORDER_NUMBER = '12345';

/*
 * Подменяет все запросы к бэкенду, выполняемые со страницы конструктора,
 * данными из заранее подготовленных HAR-файлов.
 */
const mockBackend = async (page: Page): Promise<void> => {
  await page.routeFromHAR('tests/hars/ingredients.har', {
    url: '**/api/ingredients',
    update: false,
  });
  await page.routeFromHAR('tests/hars/user.har', {
    url: '**/api/auth/user',
    update: false,
  });
  await page.routeFromHAR('tests/hars/order.har', {
    url: '**/api/orders',
    update: false,
  });
};

/*
 * Ищем карточку ингредиента только в списке выбора (data-testid="ingredients-content"),
 * а не по всей странице, чтобы не спутать её с одноимённым элементом,
 * уже добавленным в конструктор.
 */
const ingredientCard = (page: Page, name: string): Locator =>
  page.getByTestId('ingredients-content').locator('li', { hasText: name });

const addIngredientByName = async (page: Page, name: string): Promise<void> => {
  await ingredientCard(page, name).getByRole('button', { name: 'Добавить' }).click();
};

const openIngredientModal = async (page: Page, name: string): Promise<void> => {
  await ingredientCard(page, name).getByText(name, { exact: true }).click();
};

test.describe('добавление ингредиента из списка в конструктор бургера', () => {
  test.beforeEach(async ({ page }) => {
    await mockBackend(page);
    await page.goto('/');
    await expect(page.getByTestId('bun-ingredients')).toBeVisible();
  });

  test('добавление булки отображает её сверху и снизу конструктора', async ({
    page,
  }) => {
    await addIngredientByName(page, BUN.name);

    await expect(page.getByTestId('constructor-bun-1')).toContainText(BUN.name);
    await expect(page.getByTestId('constructor-bun-2')).toContainText(BUN.name);
  });

  test('добавление начинки отображает её в списке ингредиентов конструктора', async ({
    page,
  }) => {
    await addIngredientByName(page, MAIN_1.name);

    await expect(page.getByTestId('constructor-ingredients')).toContainText(MAIN_1.name);
  });

  test('можно добавить несколько ингредиентов, и итоговая стоимость пересчитывается', async ({
    page,
  }) => {
    await addIngredientByName(page, BUN.name);
    await addIngredientByName(page, MAIN_1.name);
    await addIngredientByName(page, SAUCE_1.name);

    await expect(page.getByTestId('constructor-ingredients')).toContainText(MAIN_1.name);
    await expect(page.getByTestId('constructor-ingredients')).toContainText(
      SAUCE_1.name
    );

    const expectedTotal = BUN.price * 2 + MAIN_1.price + SAUCE_1.price;
    await expect(page.getByTestId('order-summ')).toContainText(String(expectedTotal));
  });
});

test.describe('модальное окно с описанием ингредиента', () => {
  test.beforeEach(async ({ page }) => {
    await mockBackend(page);
    await page.goto('/');
    await expect(page.getByTestId('bun-ingredients')).toBeVisible();
  });

  test('открывается по клику на ингредиент из списка', async ({ page }) => {
    await openIngredientModal(page, MAIN_1.name);

    await expect(page.locator('#modals')).toContainText(MAIN_1.name);
  });

  test('в открытом модальном окне отображаются данные именно того ингредиента, по которому произошёл клик', async ({
    page,
  }) => {
    await openIngredientModal(page, MAIN_2.name);

    const modal = page.locator('#modals');
    await expect(modal).toContainText(MAIN_2.name);
    await expect(modal).not.toContainText(MAIN_1.name);
  });

  test('закрывается по клику на крестик', async ({ page }) => {
    await openIngredientModal(page, BUN.name);
    await expect(page.locator('#modals')).toContainText(BUN.name);

    await page.getByRole('button', { name: 'Закрыть' }).click();

    await expect(page.locator('#modals')).toBeEmpty();
  });

  test('закрывается по клику на оверлей', async ({ page }) => {
    await openIngredientModal(page, SAUCE_1.name);
    await expect(page.locator('#modals')).toContainText(SAUCE_1.name);

    await page.getByTestId('modal-overlay').click({ position: { x: 5, y: 5 } });

    await expect(page.locator('#modals')).toBeEmpty();
  });
});

test.describe('оформление заказа', () => {
  test.beforeEach(async ({ page }) => {
    await mockBackend(page);

    // Подставляем фейковые токены авторизации до перехода на страницу,
    // чтобы пользователь считался авторизованным.
    await page.context().addCookies([
      {
        name: 'accessToken',
        value: 'Bearer fake-access-token',
        domain: 'localhost',
        path: '/',
      },
    ]);
    await page.addInitScript(() => {
      window.localStorage.setItem('refreshToken', 'fake-refresh-token');
    });

    await page.goto('/');
    await expect(page.getByTestId('bun-ingredients')).toBeVisible();
  });

  test('собирает бургер, оформляет заказ и очищает конструктор', async ({ page }) => {
    await addIngredientByName(page, BUN.name);
    await addIngredientByName(page, MAIN_1.name);
    await addIngredientByName(page, SAUCE_1.name);

    await page.getByRole('button', { name: 'Оформить заказ' }).click();

    const modal = page.locator('#modals');
    await expect(modal.getByTestId('order-number')).toHaveText(ORDER_NUMBER);

    await page.getByRole('button', { name: 'Закрыть' }).click();
    await expect(modal).toBeEmpty();

    await expect(page.getByTestId('constructor-bun-1')).not.toBeVisible();
    await expect(page.getByTestId('constructor-ingredients')).not.toContainText(
      MAIN_1.name
    );
    await expect(page.getByTestId('constructor-ingredients')).not.toContainText(
      SAUCE_1.name
    );
  });
});
