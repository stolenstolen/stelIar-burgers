import {
  addIngredient,
  clearConstructor,
  constructorReducer,
  moveIngredient,
  removeIngredient,
} from './constructorSlice';

import type { TIngredient } from '@utils-types';

const bun: Omit<TIngredient, '_id'> & { _id: string } = {
  _id: 'bun-1',
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

const filling: TIngredient = {
  _id: 'main-1',
  name: 'Биокотлета из марсианской Магнолии',
  type: 'main',
  proteins: 420,
  fat: 142,
  carbohydrates: 242,
  calories: 4242,
  price: 424,
  image: 'https://code.s3.yandex.net/react/code/meat-01.png',
  image_large: 'https://code.s3.yandex.net/react/code/meat-01-large.png',
  image_mobile: 'https://code.s3.yandex.net/react/code/meat-01-mobile.png',
};

const sauce: TIngredient = {
  _id: 'sauce-1',
  name: 'Соус Spicy-X',
  type: 'sauce',
  proteins: 30,
  fat: 20,
  carbohydrates: 40,
  calories: 30,
  price: 90,
  image: 'https://code.s3.yandex.net/react/code/sauce-02.png',
  image_large: 'https://code.s3.yandex.net/react/code/sauce-02-large.png',
  image_mobile: 'https://code.s3.yandex.net/react/code/sauce-02-mobile.png',
};

describe('редьюсер constructorSlice (burgerConstructor)', () => {
  const initialState = {
    bun: null,
    ingredients: [],
  };

  it('должен вернуть начальное состояние при вызове с неизвестным экшеном', () => {
    const action = { type: 'UNKNOWN_ACTION' };

    const state = constructorReducer(undefined, action);

    expect(state).toEqual(initialState);
  });

  it('должен положить булку в поле bun при экшене addIngredient с ингредиентом типа bun', () => {
    const state = constructorReducer(initialState, addIngredient(bun));

    expect(state.bun).not.toBeNull();
    expect(state.bun).toMatchObject(bun);
    expect(typeof state.bun?.id).toBe('string');
    expect(state.ingredients).toHaveLength(0);
  });

  it('должен добавить ингредиент в конец списка ingredients при экшене addIngredient с ингредиентом не типа bun', () => {
    const state = constructorReducer(initialState, addIngredient(filling));

    expect(state.ingredients).toHaveLength(1);
    expect(state.ingredients[0]).toMatchObject(filling);
    expect(typeof state.ingredients[0].id).toBe('string');
    expect(state.bun).toBeNull();
  });

  it('каждому добавленному ингредиенту должен присваиваться уникальный id', () => {
    const stateAfterFirst = constructorReducer(initialState, addIngredient(filling));
    const stateAfterSecond = constructorReducer(stateAfterFirst, addIngredient(filling));

    expect(stateAfterSecond.ingredients).toHaveLength(2);
    expect(stateAfterSecond.ingredients[0].id).not.toBe(
      stateAfterSecond.ingredients[1].id
    );
  });

  it('должен удалить ингредиент по id при экшене removeIngredient', () => {
    const stateWithIngredients = constructorReducer(
      constructorReducer(initialState, addIngredient(filling)),
      addIngredient(sauce)
    );
    const idToRemove = stateWithIngredients.ingredients[0].id;

    const state = constructorReducer(stateWithIngredients, removeIngredient(idToRemove));

    expect(state.ingredients).toHaveLength(1);
    expect(state.ingredients.find((item) => item.id === idToRemove)).toBeUndefined();
  });

  it('не должен ничего менять при экшене removeIngredient с несуществующим id', () => {
    const stateWithIngredient = constructorReducer(initialState, addIngredient(filling));

    const state = constructorReducer(
      stateWithIngredient,
      removeIngredient('non-existing-id')
    );

    expect(state.ingredients).toEqual(stateWithIngredient.ingredients);
  });

  it('должен менять местами ингредиенты при экшене moveIngredient с направлением "up"', () => {
    const stateWithIngredients = constructorReducer(
      constructorReducer(initialState, addIngredient(filling)),
      addIngredient(sauce)
    );
    const [first, second] = stateWithIngredients.ingredients;

    const state = constructorReducer(
      stateWithIngredients,
      moveIngredient({ index: 1, direction: 'up' })
    );

    expect(state.ingredients[0]).toEqual(second);
    expect(state.ingredients[1]).toEqual(first);
  });

  it('должен менять местами ингредиенты при экшене moveIngredient с направлением "down"', () => {
    const stateWithIngredients = constructorReducer(
      constructorReducer(initialState, addIngredient(filling)),
      addIngredient(sauce)
    );
    const [first, second] = stateWithIngredients.ingredients;

    const state = constructorReducer(
      stateWithIngredients,
      moveIngredient({ index: 0, direction: 'down' })
    );

    expect(state.ingredients[0]).toEqual(second);
    expect(state.ingredients[1]).toEqual(first);
  });

  it('не должен ничего менять при экшене moveIngredient, если целевой индекс выходит за границы массива', () => {
    const stateWithIngredient = constructorReducer(initialState, addIngredient(filling));

    const stateUp = constructorReducer(
      stateWithIngredient,
      moveIngredient({ index: 0, direction: 'up' })
    );
    const stateDown = constructorReducer(
      stateWithIngredient,
      moveIngredient({ index: 0, direction: 'down' })
    );

    expect(stateUp.ingredients).toEqual(stateWithIngredient.ingredients);
    expect(stateDown.ingredients).toEqual(stateWithIngredient.ingredients);
  });

  it('должен полностью очищать конструктор при экшене clearConstructor', () => {
    const filledState = constructorReducer(
      constructorReducer(initialState, addIngredient(bun)),
      addIngredient(filling)
    );

    const state = constructorReducer(filledState, clearConstructor());

    expect(state).toEqual(initialState);
  });
});
