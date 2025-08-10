import React, { useState, useEffect, useMemo } from 'react';

const load = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
};
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const sampleBooks = [
  { id: crypto.randomUUID(), title: "サンプル本", author: "みきG", total: 320, current: 90, dailyTarget: 20 },
];

export default function App() {
  const [books, setBooks] = useState(() => load("books", sampleBooks));
  const [filter, setFilter] = useState("all");

  useEffect(() => save("books", books), [books]);

  const addBook = () => {
    const title = prompt("タイトル?");
    const total = Number(prompt("総ページ?"));
    if (!title || !total) return;
    setBooks([{ id: crypto.randomUUID(), title, total, current: 0, dailyTarget: 20 }, ...books]);
  };

  const updateBook = (id, patch) => setBooks(b => b.map(x => x.id === id ? { ...x, ...patch } : x));
  const filtered = useMemo(() => {
    if (filter === "done") return books.filter(b => b.current >= b.total);
    if (filter === "active") return books.filter(b => b.current < b.total);
    return books;
  }, [books, filter]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">📚 読書管理</h1>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilter("all")}>すべて</button>
        <button onClick={() => setFilter("active")}>読書中</button>
        <button onClick={() => setFilter("done")}>読了</button>
        <button onClick={addBook}>＋本追加</button>
      </div>
      {filtered.map(b => (
        <div key={b.id} className="border p-2 mb-2">
          <div>{b.title} ({b.current}/{b.total}p)</div>
          <input type="number" value={b.current} onChange={e => updateBook(b.id, { current: Number(e.target.value) })} />
          <div className="bg-gray-200 h-4 mt-1">
            <div className="bg-green-500 h-4" style={{ width: `${Math.min(100, b.current / b.total * 100)}%` }}></div>
          </div>
        </div>
      ))}
    </div>
  );
}
