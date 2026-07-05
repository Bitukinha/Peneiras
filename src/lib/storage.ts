import { useEffect, useState, useCallback, useRef } from "react";
import {
  listMoinhos, upsertMoinho, removeMoinho,
  listPeneiras, upsertPeneira, removePeneira,
  listMotivos, upsertMotivo, removeMotivo,
  listTrocas, upsertTroca, removeTroca,
} from "./api";
import type { Moinho, Peneira, Motivo, Troca } from "./api";

export type { Moinho, Peneira, Motivo, Troca };

export const uid = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36));

function useServerCollection<T extends { id: string }>(
  list: () => Promise<T[]>,
  upsert: (input: { data: T }) => Promise<unknown>,
  remove: (input: { data: { id: string } }) => Promise<unknown>,
) {
  const [items, setItemsState] = useState<T[]>([]);
  const loaded = useRef(false);

  useEffect(() => {
    let cancelled = false;
    list().then((rows) => {
      if (!cancelled) {
        setItemsState(rows);
        loaded.current = true;
      }
    }).catch((err) => console.error(err));
    return () => { cancelled = true; };
  }, []);

  const setItems = useCallback((next: T[] | ((p: T[]) => T[])) => {
    setItemsState((prev) => {
      const resolved = typeof next === "function" ? (next as (p: T[]) => T[])(prev) : next;
      if (!loaded.current) return resolved;

      const prevById = new Map(prev.map((i) => [i.id, i] as const));
      const nextIds = new Set(resolved.map((i) => i.id));

      for (const item of resolved) {
        const before = prevById.get(item.id);
        if (!before || JSON.stringify(before) !== JSON.stringify(item)) {
          upsert({ data: item }).catch((err) => console.error(err));
        }
      }
      for (const item of prev) {
        if (!nextIds.has(item.id)) {
          remove({ data: { id: item.id } }).catch((err) => console.error(err));
        }
      }
      return resolved;
    });
  }, [upsert, remove]);

  return [items, setItems] as const;
}

export function useMoinhos() {
  return useServerCollection<Moinho>(listMoinhos, upsertMoinho, removeMoinho);
}
export function usePeneiras() {
  return useServerCollection<Peneira>(listPeneiras, upsertPeneira, removePeneira);
}
export function useMotivos() {
  return useServerCollection<Motivo>(listMotivos, upsertMotivo, removeMotivo);
}
export function useTrocas() {
  return useServerCollection<Troca>(listTrocas, upsertTroca, removeTroca);
}

export function useCrud<T extends { id: string }>(
  state: readonly [T[], (v: T[] | ((p: T[]) => T[])) => void],
) {
  const [items, setItems] = state;
  const add = useCallback((item: Omit<T, "id">) => {
    const novo = { ...(item as object), id: uid() } as T;
    setItems((p) => [...p, novo]);
    return novo;
  }, [setItems]);
  const update = useCallback((id: string, patch: Partial<T>) => {
    setItems((p) => p.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, [setItems]);
  const remove = useCallback((id: string) => {
    setItems((p) => p.filter((i) => i.id !== id));
  }, [setItems]);
  return { items, add, update, remove };
}
