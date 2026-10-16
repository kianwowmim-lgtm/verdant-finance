import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayISO } from './utils';

const STORAGE_KEY = 'verdant:v2';
const StoreContext = createContext(null);

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export function StoreProvider({ children }) {
  const [state, setState] = useState({ transactions: [], goals: [], isDark: false });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw);
        // Basic sanitizing: drop malformed rows so one bad record can't crash the list.
        const transactions = Array.isArray(saved.transactions)
          ? saved.transactions.filter((t) => t && t.id && t.amount > 0 && /^\d{4}-\d{2}-\d{2}$/.test(t.date))
          : [];
        const goals = Array.isArray(saved.goals) ? saved.goals.filter((g) => g && g.id && g.target > 0) : [];
        setState({ transactions, goals, isDark: !!saved.isDark });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const addTransaction = useCallback((t) => {
    setState((s) => ({ ...s, transactions: [{ ...t, id: uid() }, ...s.transactions] }));
  }, []);

  const updateTransaction = useCallback((id, patch) => {
    setState((s) => ({
      ...s,
      transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }, []);

  const deleteTransaction = useCallback((id) => {
    setState((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) }));
  }, []);

  const addGoal = useCallback((g) => {
    setState((s) => ({ ...s, goals: [...s.goals, { ...g, id: uid() }] }));
  }, []);

  // Deleting a goal also removes its savings records, so the money returns to the balance.
  const deleteGoal = useCallback((id) => {
    setState((s) => ({
      ...s,
      goals: s.goals.filter((g) => g.id !== id),
      transactions: s.transactions.filter((t) => t.goalId !== id),
    }));
  }, []);

  const contribute = useCallback((goalId, amount) => {
    setState((s) => {
      const goal = s.goals.find((g) => g.id === goalId);
      if (!goal) return s;
      return {
        ...s,
        transactions: [
          {
            id: uid(),
            type: 'saving',
            amount,
            category: 'saving',
            note: `برای ${goal.name}`,
            date: todayISO(),
            goalId,
          },
          ...s.transactions,
        ],
      };
    });
  }, []);

  const toggleDark = useCallback(() => {
    setState((s) => ({ ...s, isDark: !s.isDark }));
  }, []);

  const value = useMemo(
    () => ({
      ...state, ready, addTransaction, updateTransaction, deleteTransaction,
      addGoal, deleteGoal, contribute, toggleDark,
    }),
    [state, ready, addTransaction, updateTransaction, deleteTransaction, addGoal, deleteGoal, contribute, toggleDark]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}
