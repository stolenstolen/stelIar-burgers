import { Preloader, OrderInfoUI } from '@ui';
import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { fetchOrderByNumber } from '@services/orderSlice';
import {
  selectFeedState,
  selectIngredients,
  selectOrderState,
} from '@services/selectors';
import { useDispatch, useSelector } from '@services/store';

import type { TIngredient } from '@utils-types';

export const OrderInfo = (): React.JSX.Element => {
  const { number } = useParams();
  const storedOrder = useSelector(selectFeedState).orders.find(
    (order) => order.number === Number(number)
  );
  const ingredients: TIngredient[] = useSelector(selectIngredients);
  const dispatch = useDispatch();
  const { details, detailsLoading } = useSelector(selectOrderState);

  useEffect(() => {
    if (storedOrder || !number) return;
    void dispatch(fetchOrderByNumber(Number(number)));
  }, [dispatch, number, storedOrder]);

  const loadedOrder = details?.number === Number(number) ? details : null;
  const orderData = storedOrder ?? loadedOrder;

  /**
   * использование useMemo не обязательно
   */
  /* Готовим данные для отображения */
  const orderInfo = useMemo(() => {
    if (!orderData || !ingredients.length) return null;

    const date = new Date(orderData.createdAt);

    type TIngredientsWithCount = Record<string, TIngredient & { count: number }>;

    const ingredientsInfo = orderData.ingredients.reduce(
      (acc: TIngredientsWithCount, item) => {
        if (!acc[item]) {
          const ingredient = ingredients.find((ing) => ing._id === item);
          if (ingredient) {
            acc[item] = {
              ...ingredient,
              count: 1,
            };
          }
        } else {
          acc[item].count++;
        }

        return acc;
      },
      {}
    );

    const total = Object.values(ingredientsInfo).reduce(
      (acc, item) => acc + item.price * item.count,
      0
    );

    return {
      ...orderData,
      ingredientsInfo,
      date,
      total,
    };
  }, [orderData, ingredients]);

  if (detailsLoading || !orderInfo) {
    return <Preloader />;
  }

  return <OrderInfoUI orderInfo={orderInfo} />;
};
