import { getOrderByNumberApi, orderBurgerApi } from '@api';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import type { TOrder } from '@utils-types';

type TOrderState = {
  order: TOrder | null;
  details: TOrder | null;
  isLoading: boolean;
  error: string | null;
  detailsLoading: boolean;
  detailsError: string | null;
};

const initialState: TOrderState = {
  order: null,
  details: null,
  isLoading: false,
  error: null,
  detailsLoading: false,
  detailsError: null,
};

export const createOrder = createAsyncThunk<TOrder, string[], { rejectValue: string }>(
  'order/create',
  async (ingredients, { rejectWithValue }) => {
    try {
      return (await orderBurgerApi(ingredients)).order;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Не удалось оформить заказ'
      );
    }
  }
);

export const fetchOrderByNumber = createAsyncThunk<
  TOrder | null,
  number,
  { rejectValue: string }
>('order/fetchByNumber', async (number, { rejectWithValue }) => {
  try {
    return (await getOrderByNumberApi(number)).orders[0] ?? null;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Не удалось загрузить заказ'
    );
  }
});

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    clearOrder: (state) => {
      state.order = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.order = action.payload;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.payload ?? action.error.message ?? 'Не удалось оформить заказ';
      })
      .addCase(fetchOrderByNumber.pending, (state) => {
        state.details = null;
        state.detailsLoading = true;
        state.detailsError = null;
      })
      .addCase(fetchOrderByNumber.fulfilled, (state, action) => {
        state.details = action.payload;
        state.detailsLoading = false;
      })
      .addCase(fetchOrderByNumber.rejected, (state, action) => {
        state.details = null;
        state.detailsLoading = false;
        state.detailsError =
          action.payload ?? action.error.message ?? 'Не удалось загрузить заказ';
      });
  },
});

export const { clearOrder } = orderSlice.actions;
export const orderReducer = orderSlice.reducer;
