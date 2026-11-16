"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { updateTest } from "@/modules/actions/tutor";
import { useHydrated } from "@/components/use-hydrated";
import type { EditorQuestion } from "@/modules/tests/rules";

type Term = { id: string; name: string };
type Evidence = { id: string; title: string; excerpt: string };
type Question = EditorQuestion & { evidence?: Evidence };
type Row = Question & { localId: string };
const emptyOption = () => ({ text: "", correct: false });
const emptyQuestion = (): Row => ({
  localId: crypto.randomUUID(), text: "", format: "SINGLE_CHOICE",
  difficulty: null, topicId: null, eraId: null, options: [emptyOption(), emptyOption()],
});

export function TestEditor({ id, revision, initialTitle, initialQuestions, topics, eras }: {
  id: string; revision: number; initialTitle: string; initialQuestions: Question[]; topics: Term[]; eras: Term[];
}) {
  const [title, setTitle] = useState(initialTitle);
  const [questions, setQuestions] = useState<Row[]>(initialQuestions.map((question) => ({ ...question, localId: question.id! })));
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const hydrated = useHydrated();

  function update(key: string, fields: Partial<Question>) {
    setQuestions((current) => current.map((item) => item.localId === key ? { ...item, ...fields } : item));
  }

  function move(index: number, delta: number) {
    setQuestions((current) => {
      const updated = [...current];
      [updated[index], updated[index + delta]] = [updated[index + delta], updated[index]];
      return updated;
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    setError("");
    startTransition(async () => {
      const result = await updateTest(id, {
        title, revision, questions: questions.map(({ localId, evidence, ...question }) => question),
        review: submitter?.getAttribute("value") === "review",
      });
      setError(result.error);
    });
  }

  return <form className="stack" method="post" onSubmit={submit}>
    <fieldset className="editor-fields stack" disabled={!hydrated || pending}>
      <section className="panel"><label>Название теста<input required maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} /></label></section>
      {questions.map((question, index) => <section key={question.localId} className="panel stack">
        <header className="question-header"><h2>Вопрос {index + 1}</h2><div className="row-actions">
          <button type="button" className="secondary" aria-label={"Поднять вопрос " + (index + 1)} disabled={!index} onClick={() => move(index, -1)}>↑</button>
          <button type="button" className="secondary" aria-label={"Опустить вопрос " + (index + 1)} disabled={index === questions.length - 1} onClick={() => move(index, 1)}>↓</button>
          <button type="button" className="quiet danger" onClick={() => setQuestions((current) => current.filter((item) => item.localId !== question.localId))}>Удалить вопрос</button>
        </div></header>
        <label>Формулировка<textarea rows={2} maxLength={2000} value={question.text}
          onChange={(event) => update(question.localId, { text: event.target.value })} /></label>
        {question.evidence && <blockquote><p>{question.evidence.excerpt}</p>
          <Link href={"/tutor/sources/" + question.evidence.id}>{question.evidence.title}</Link></blockquote>}
        <div className="classification">
          <label>Формат<select value="SINGLE_CHOICE" disabled><option value="SINGLE_CHOICE">Один правильный ответ</option></select></label>
          <label>Тема<select value={question.topicId ?? ""} onChange={(event) => update(question.localId, { topicId: event.target.value || null })}>
            <option value="">Выберите тему</option>{topics.map((term) => <option key={term.id} value={term.id}>{term.name}</option>)}
          </select></label>
          <label>Эпоха<select value={question.eraId ?? ""} onChange={(event) => update(question.localId, { eraId: event.target.value || null })}>
            <option value="">Выберите эпоху</option>{eras.map((term) => <option key={term.id} value={term.id}>{term.name}</option>)}
          </select></label>
          <label>Сложность<select value={question.difficulty ?? ""} onChange={(event) => update(question.localId, { difficulty: (event.target.value || null) as Row["difficulty"] })}>
            <option value="">Выберите сложность</option><option value="EASY">Лёгкая</option><option value="MEDIUM">Средняя</option><option value="HARD">Высокая</option>
          </select></label>
        </div>
        <fieldset className="option-fields"><legend>Варианты ответа</legend>
          <p>Отметьте один правильный вариант.</p>
          {question.options.map((option, optionIndex) => <div key={optionIndex} className="option-row">
            <input type="radio" name={"correct-" + question.localId} aria-label={"Правильный вариант " + (optionIndex + 1)}
              checked={option.correct} onChange={() => update(question.localId, {
                options: question.options.map((item, position) => ({ ...item, correct: position === optionIndex })),
              })} />
            <input maxLength={500} aria-label={"Вариант " + (optionIndex + 1)} value={option.text}
              onChange={(event) => update(question.localId, { options: question.options.map((item, position) =>
                position === optionIndex ? { ...item, text: event.target.value } : item) })} />
            <button type="button" className="quiet danger" aria-label={"Удалить вариант " + (optionIndex + 1)}
              onClick={() => update(question.localId, { options: question.options.filter((_, position) => position !== optionIndex) })}>×</button>
          </div>)}
          <button type="button" className="secondary" disabled={question.options.length >= 6}
            onClick={() => update(question.localId, { options: [...question.options, emptyOption()] })}>Добавить вариант</button>
        </fieldset>
      </section>)}
      <div><button type="button" className="secondary" disabled={questions.length >= 40}
        onClick={() => setQuestions([...questions, emptyQuestion()])}>Добавить вопрос</button></div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="editor-footer row-actions">
        <button className="secondary" value="draft">Сохранить черновик</button>
        <button value="review">{pending ? "Сохраняем…" : "Подтвердить проверку"}</button>
      </div>
    </fieldset>
  </form>;
}
