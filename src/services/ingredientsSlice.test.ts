import { fetchIngredients, ingredientsReducer } from './ingredientsSlice';

import type { TIngredient } from '@utils-types';

const testIngredient: TIngredient = {
  _id: '643d69a5c3f7b9001cfa093c',
  name: 'Краторная булка N-200i',
  type: 'bun',
  proteins: 80,
  fat: 24,
  carbohydrates: 53,
  calories: 420,
  price: 1255,
  image: 'https://code.s3.yandex.net/react/code/bun-02.png',
  image_large: 'https://code.s3.yandex.net/react/code/bun-02-large.png',
  image_mobile: 'https://code.s3.yandex.net/react/code/bun-02-mobile.png',
};

describe('редьюсер ingredientsSlice (массив ингредиентов)', () => {
  const initialState = {
    items: [],
    isLoading: false,
    error: null,
  };

  it('должен вернуть начальное состояние при вызове с неизвестным экшеном', () => {
    const action = { type: 'UNKNOWN_ACTION' };

    const state = ingredientsReducer(undefined, action);

    expect(state).toEqual(initialState);
  });

  it('должен установить isLoading в true и обнулить error при экшене fetchIngredients.pending', () => {
    const previousState = {
      items: [],
      isLoading: false,
      error: 'предыдущая ошибка',
    };

    const state = ingredientsReducer(
      previousState,
      fetchIngredients.pending('', undefined)
    );

    expect(state).toEqual({
      items: [],
      isLoading: true,
      error: null,
    });
  });

  it('должен записать полученные ингредиенты и снять isLoading при экшене fetchIngredients.fulfilled', () => {
    const previousState = {
      items: [],
      isLoading: true,
      error: null,
    };

    const state = ingredientsReducer(
      previousState,
      fetchIngredients.fulfilled([testIngredient], '', undefined)
    );

    expect(state).toEqual({
      items: [testIngredient],
      isLoading: false,
      error: null,
    });
  });

  it('должен записать текст ошибки и снять isLoading при экшене fetchIngredients.rejected', () => {
    const previousState = {
      items: [],
      isLoading: true,
      error: null,
    };

    const state = ingredientsReducer(
      previousState,
      fetchIngredients.rejected(
        new Error('Ошибка запроса'),
        '',
        undefined,
        'Не удалось загрузить ингредиенты'
      )
    );

    expect(state).toEqual({
      items: [],
      isLoading: false,
      error: 'Не удалось загрузить ингредиенты',
    });
  });
});
