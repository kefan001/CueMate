import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import type { Order } from '../data/mock';
import { mockOrders } from '../data/mock';
import { STORAGE_KEYS, normalizeOrder } from '../../../shared/cuemate-core';
import { readJson, writeJson } from '../utils/storage';

interface OrderContextValue {
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrder: (id: string, patch: Partial<Order>) => void;
}

const OrderContext = createContext<OrderContextValue | undefined>(undefined);

const STORAGE_KEY = STORAGE_KEYS.ORDERS;

export function OrderProvider({ children }: PropsWithChildren) {
  const [orders, setOrders] = useState<Order[]>(() =>
    readJson<(Order & { review?: Order['customerReview'] })[]>(STORAGE_KEY, mockOrders).map(normalizeOrder)
  );

  useEffect(() => {
    writeJson(STORAGE_KEY, orders);
  }, [orders]);

  const addOrder = (order: Order) => {
    setOrders(prev => [order, ...prev]);
  };

  const updateOrder = (id: string, patch: Partial<Order>) => {
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, ...patch } : o)));
  };

  const value = useMemo(() => ({ orders, addOrder, updateOrder }), [orders]);

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) {
    throw new Error('useOrders must be used within OrderProvider');
  }
  return ctx;
}
