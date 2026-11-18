"use client";

import { useState } from "react";
import { templates } from "@/modules/presentations/templates";
import { ActionForm } from "@/components/action-form";
import { queueGamma } from "@/modules/actions/tutor";

const normalize = (value: string) => value.toLocaleLowerCase("ru").replaceAll("ё", "е").trim();

export function Catalog({ gamma, requestKey }: { gamma: boolean; requestKey: string }) {
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [slides, setSlides] = useState<string[][]>([]);
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const matches = templates.filter(t => words.every(word => normalize([t.topic, t.name, t.subject, t.keywords].join(" ")).includes(word)));
  const plan = [title, ...slides.map(([heading, body]) => heading + "\n" + body)].join("\n\n");
  function edit(index: number, column: number, value: string) {
    setSlides(current => current.map((s, i) => i === index ? s.map((v, j) => j === column ? value : v) : s));
  }
  return <section className="panel stack"><h2>Каталог шаблонов</h2>
    <label>Тема презентации<input type="search" value={query} maxLength={160} placeholder="Например, фотосинтез" onChange={e => setQuery(e.target.value)} /></label>
    <div className="overview-grid">{matches.map(t => <article className="panel stack" key={t.name}>
      <small>{t.subject} · {t.name}</small><h3>{t.topic}</h3>
      <button className="secondary" onClick={() => { setTitle(t.topic); setSlides(t.slides); }}>Собрать презентацию</button>
    </article>)}</div>
    {!matches.length && <div className="stack"><p>Готового шаблона по этой теме пока нет.</p>
      <button className="secondary" onClick={() => { setTitle(query.trim()); setSlides([
        ["Цель урока", "Какой вопрос мы разберём по теме «" + query.trim() + "»?"],
        ["Основные понятия", ""], ["Разбор примера", ""], ["Практическое задание", ""],
      ]); }}>Собрать план по теме «{query.trim()}»</button></div>}
    {!!slides.length && <div className="stack"><h3>Редактор презентации</h3>
      <label>Название<input value={title} maxLength={160} onChange={e => setTitle(e.target.value)} /></label>
      {slides.map(([heading, body], i) => <fieldset className="option-fields" key={i}><legend>Слайд {i + 2}</legend>
        <label>Заголовок<input value={heading} maxLength={160} onChange={e => edit(i, 0, e.target.value)} /></label>
        <label>Текст<textarea value={body} rows={2} maxLength={2200} onChange={e => edit(i, 1, e.target.value)} /></label>
      </fieldset>)}
      <button type="button" disabled={!title.trim()} onClick={() => window.print()}>Распечатать или сохранить PDF</button>
      {gamma && <ActionForm key={plan} action={queueGamma} label="Оформить в Gamma">
        <input type="hidden" name="requestKey" value={requestKey} /><input type="hidden" name="title" value={title} />
        <input type="hidden" name="lessonPlan" value={plan} />
        <label className="check"><input name="confirmed" type="checkbox" required />Я проверил материалы для отправки в Gamma.</label>
      </ActionForm>}
      <div className="print-deck">{[[title, ""], ...slides].map(([heading, body], i) =>
        <article key={i}><h1>{heading}</h1><p>{body}</p></article>)}</div>
    </div>}
  </section>;
}

