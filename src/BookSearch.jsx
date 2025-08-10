import React, { useMemo, useState } from "react";

export default function BookSearch({ open, onClose, onPick }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [err, setErr] = useState("");

  if (!open) return null;

  const search = async (e) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    setLoading(true);
    setErr("");
    try {
      // 1) Google Books
      const gb = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(
          query
        )}&maxResults=20`
      ).then((r) => r.json());

      const gbItems =
        (gb.items || []).map((it) => {
          const v = it.volumeInfo || {};
          return normalize({
            source: "google",
            title: v.title,
            authors: v.authors || [],
            pageCount: v.pageCount || null,
            infoLink: v.infoLink || (it.selfLink ?? ""),
            cover:
              (v.imageLinks && (v.imageLinks.thumbnail || v.imageLinks.smallThumbnail)) ||
              "",
          });
        }) || [];

      // 2) Open Library（補完用）
      const ol = await fetch(
        `https://openlibrary.org/search.json?title=${encodeURIComponent(
          query
        )}&limit=20`
      ).then((r) => r.json());

      const olItems =
        (ol.docs || []).map((d) =>
          normalize({
            source: "openlibrary",
            title: d.title,
            authors: d.author_name || [],
            pageCount: d.number_of_pages_median || null,
            infoLink: d.key ? `https://openlibrary.org${d.key}` : "",
            cover: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : "",
          })
        ) || [];

      // マージ：タイトル＋主要著者でざっくり統合。Google優先、欠けはOLで補完
      const byKey = new Map();
      for (const item of [...gbItems, ...olItems]) {
        const key = (
          (item.title || "").toLowerCase() +
          "|" +
          (item.authors[0] || "").toLowerCase()
        ).trim();
        if (!byKey.has(key)) {
          byKey.set(key, item);
        } else {
          const cur = byKey.get(key);
          byKey.set(key, {
            ...cur,
            pageCount: cur.pageCount || item.pageCount || null,
            infoLink: cur.infoLink || item.infoLink || "",
            cover: cur.cover || item.cover || "",
          });
        }
      }
      setResults([...byKey.values()]);
    } catch (e) {
      setErr("検索でエラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  const show = useMemo(() => results.slice(0, 20), [results]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">書籍検索</h2>
          <a
            className="text-sm text-neutral-500 underline"
            href="https://books.google.com/"
            target="_blank"
            rel="noreferrer"
            title="情報サイトを別タブで見る"
          >
            情報サイトを開く
          </a>
        </div>

        <form onSubmit={search} className="flex gap-2 mb-3">
          <input
            className="flex-1 rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-300"
            placeholder="タイトルを入力（例：君たちはどう生きるか）"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            className="rounded-xl bg-neutral-900 text-white px-4 py-2 text-sm hover:opacity-90"
            type="submit"
          >
            検索
          </button>
          <button className="rounded-xl px-3 py-2 text-sm border" type="button" onClick={onClose}>
            閉じる
          </button>
        </form>

        {loading && <div className="text-sm text-neutral-500">検索中…</div>}
        {err && <div className="text-sm text-red-600">{err}</div>}

        <ul className="divide-y max-h-[60vh] overflow-auto">
          {show.map((b, i) => (
            <li key={i} className="py-3 flex gap-3 items-center">
              {b.cover ? (
                <img src={b.cover} alt="" className="w-12 h-16 object-cover rounded border" />
              ) : (
                <div className="w-12 h-16 grid place-items-center text-xs text-neutral-400 border rounded">
                  no img
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{b.title}</div>
                <div className="text-sm text-neutral-600 truncate">
                  {b.authors.join(", ") || "著者不明"}
                </div>
                <div className="text-xs text-neutral-500">
                  ページ数: {b.pageCount ?? "不明"}{" "}
                  {b.infoLink && (
                    <>
                      ·{" "}
                      <a
                        href={b.infoLink}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                        title="情報サイトで開く"
                      >
                        情報サイト
                      </a>
                    </>
                  )}
                </div>
              </div>
              <button
                className="rounded-xl border px-3 py-1.5 text-sm hover:bg-neutral-100"
                onClick={() => onPick(b)}
              >
                これにする
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function normalize(obj) {
  // 最低限の型そろえ
  return {
    source: obj.source,
    title: obj.title || "",
    authors: Array.isArray(obj.authors) ? obj.authors : obj.authors ? [obj.authors] : [],
    pageCount: typeof obj.pageCount === "number" ? obj.pageCount : null,
    infoLink: obj.infoLink || "",
    cover: obj.cover || "",
  };
}
