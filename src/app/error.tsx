"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="simple-page"><section className="panel stack">
    <h1>Не удалось открыть страницу</h1>
    <p>Попробуйте загрузить её ещё раз.</p>
    <button type="button" onClick={reset}>Повторить</button>
  </section></main>;
}
