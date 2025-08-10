import React, { useEffect, useMemo, useState } from "react";
import BookSearch from "./BookSearch.jsx";

const load = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const sampleBooks = [
  { id: crypto.randomUUID(), title: "サンプル本", author: "みきG", total: 320, current: 90, dailyTarget: 20 },
];

export default function App() {
  const [books, setBooks] = useState(() => load("books", sampleBooks));
  const [filter, setFilter] = useState("all");
  const [searchOpen, setSearchOpen] = useState(false);

  // 追加用の仮データ（検索から拾った値をここに入れて確認してから追加）
  const [draft, setDraft] = useState({ title: "", author: "", total: 200, dailyTarget: 20 });

  useEffect(() => save("books", books), [books]);

  const addBook = () => {
    const t = prompt("タイトル?");
    const total = Number(prompt("総ページ?"));
    if (!t || !total) return;
    setBooks([{ id: crypto.randomUUID(), title: t, total, current: 0, dailyTarget: 20 }, ...books]);
  };

  const addFromDraft = () => {
    if (!draft.title.trim()) return;
    setBooks([
      {
        id: crypto.randomUUID(),
        title: draft.title.trim(),
        author: draft.author?.trim() || undefined,
        total: Math.max(1, Number(draft.total || 0)),
        current: 0,
        dailyTarget: Math.max(1, Number(draft.dailyTarget || 20)),
      },
      ...books,
    ]);
    setDraft({ title: "", author: "", total: 200, dailyTarget: 20 });
  };

  const updateBook = (id, patch) => setBooks(b => b.map(x => x.id === id ? { ...x, ...patch } : x));
  const removeBook = (id) => setBooks(b => b.filter(x => x.id !== id));

  const filtered = useMemo(() => {
    if (filter === "done") return books.filter(b => b.current >= (b.total || 1));
    if (filter === "active") return books.filter(b => b.current < (b.total || 1));
    return books;
  }, [books, filter]);

  const onPickFromSearch = (b) => {
    // 検索結果を草案に反映（ページ数は未取得なら200のまま。後から手で修正可）
    setDraft({
      title: b.title || "",
      author: b.authors?.[0] || "",
      total: b.pageCount || 200,
      dailyTarget: 20,
    });
    setSearchOpen(false);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-3">📚 読書管理</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setFilter("all")} className="border rounded px-3 py-1.5">すべて</button>
        <button onClick={() => setFilter("active")} className="border rounded px-3 py-1.5">読書中</button>
        <button onClick={() => setFilter("done")} className="border rounded px-3 py-1.5">読了</button>
        <button onClick={addBook} className="rounded bg-neutral-900 text-white px-3 py-1.5">＋本追加（手動）</button>
        <button
  onClick={() => { setSearchOpen(true); alert('open'); }}
  className="rounded border px-3 py-1.5"
>
  🔎 本を検索して追加
</button>
🔎 本を検索して追加</button>
      </div>

      {/* 検索から拾った下書きを確認 → 追加 */}
      {(draft.title || draft.author) && (
        <div className="mb-4 p-3 rounded-xl border bg-white">
          <div className="text-sm text-neutral-500 mb-1">検索結果から追加</div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-sm grid gap-1">
              <span>タイトル</span>
              <input className="rounded border px-2 py-1.5" value={draft.title}
                     onChange={(e)=>setDraft({...draft, title:e.target.value})}/>
            </label>
            <label className="text-sm grid gap-1">
              <span>著者</span>
              <input className="rounded border px-2 py-1.5" value={draft.author}
                     onChange={(e)=>setDraft({...draft, author:e.target.value})}/>
            </label>
            <label className="text-sm grid gap-1">
              <span>総ページ</span>
              <input type="number" className="rounded border px-2 py-1.5" value={draft.total}
                     onChange={(e)=>setDraft({...draft, total:Number(e.target.value)})}/>
            </label>
            <label className="text-sm grid gap-1">
              <span>1日の目標ページ</span>
              <input type="number" className="rounded border px-2 py-1.5" value={draft.dailyTarget}
                     onChange={(e)=>setDraft({...draft, dailyTarget:Number(e.target.value)})}/>
            </label>
          </div>
          <div className="mt-2 flex gap-2">
            <button className="rounded bg-neutral-900 text-white px-3 py-1.5" onClick={addFromDraft}>この内容で追加</button>
            <button className="rounded border px-3 py-1.5" onClick={()=>setDraft({ title:"", author:"", total:200, dailyTarget:20 })}>クリア</button>
          </div>
        </div>
      )}

      {filtered.map(b => (
        <div key={b.id} className="border p-3 mb-3 rounded-xl bg-white">
          <div className="font-medium">{b.title} <span className="text-neutral-500 text-sm">({b.current}/{b.total}p)</span></div>
          <div className="text-sm text-neutral-600">{b.author || "著者情報なし"}</div>
          <div className="bg-gray-200 h-3 mt-2 rounded">
            <div className="bg-green-500 h-3 rounded" style={{ width: `${Math.min(100, (b.current / b.total) * 100)}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-2 items-center text-sm">
            <input type="number" className="rounded border px-2 py-1.5"
                   value={b.current}
                   onChange={(e)=>updateBook(b.id,{ current: Math.max(0, Math.min(Number(e.target.value), b.total))})}/>
            <button className="rounded border px-3 py-1" onClick={()=>updateBook(b.id,{ current: Math.min(b.current+10, b.total) })}>+10p</button>
            <button className="rounded border px-3 py-1" onClick={()=>updateBook(b.id,{ current: Math.max(b.current-10, 0) })}>-10p</button>
            <button className="rounded border px-3 py-1 text-red-600" onClick={()=>removeBook(b.id)}>削除</button>
          </div>
        </div>
      ))}

      <BookSearch
        open={searchOpen}
        onClose={()=>setSearchOpen(false)}
        onPick={onPickFromSearch}
      />
    </div>
  );
}