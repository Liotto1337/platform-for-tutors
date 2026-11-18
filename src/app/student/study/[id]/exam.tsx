"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ActionForm } from "@/components/action-form";
import { recordPause, submitExam } from "@/modules/actions/schoolwork";

export function Exam({ id, title, questions }: { id: string; title: string; questions: { text: string; options: string[] }[] }) {
  const surface = useRef<HTMLElement>(null);
  const active = useRef(false);
  const [phase, setPhase] = useState<"ready" | "active" | "paused">("ready");
  const [error, setError] = useState("");
  useEffect(() => {
    function pause() {
      if (!active.current) return;
      active.current = false;
      setPhase("paused");
      void recordPause(id).catch(() => setError("Не удалось сохранить отметку о паузе."));
    }
    function fullscreen() { if (document.fullscreenElement !== surface.current) pause(); }
    function visibility() { if (document.hidden) pause(); }
    function leaving(e: BeforeUnloadEvent) { if (active.current) e.preventDefault(); }
    window.addEventListener("blur", pause);
    window.addEventListener("beforeunload", leaving);
    document.addEventListener("visibilitychange", visibility);
    document.addEventListener("fullscreenchange", fullscreen);
    return () => {
      active.current = false;
      window.removeEventListener("blur", pause);
      window.removeEventListener("beforeunload", leaving);
      document.removeEventListener("visibilitychange", visibility);
      document.removeEventListener("fullscreenchange", fullscreen);
    };
  }, [id]);
  async function start() {
    setError("");
    try {
      if (document.fullscreenElement !== surface.current) await surface.current!.requestFullscreen();
      if (document.fullscreenElement !== surface.current || document.hidden) throw new Error();
      active.current = true;
      setPhase("active");
    } catch {
      setError("Полный экран недоступен. Разрешите его в браузере или откройте тест на компьютере.");
    }
  }
  return <main ref={surface} className="exam-surface"><div className="stack exam-body">
    <h1>{title}</h1>
    {phase !== "active" && <section className="panel stack"><h2>{phase === "paused" ? "Тест приостановлен" : "Перед началом"}</h2>
      <p>Тест проходит во весь экран. При смене вкладки или окна вопросы скроются, а преподаватель увидит отметку о паузе.</p>
      <button onClick={start}>{phase === "paused" ? "Продолжить во весь экран" : "Начать во весь экран"}</button>
      <Link href="/student/study">Вернуться к заданиям</Link></section>}
    {error && <p className="error" role="alert">{error}</p>}
    <div hidden={phase !== "active"}>
      <ActionForm action={submitExam.bind(null, id)} label="Завершить тест">
        {questions.map((q, i) => <fieldset className="panel stack" key={i}><legend>{i + 1}. {q.text}</legend>
          {q.options.map((opt, j) => <label className="check" key={j}><input type="radio" name={"q" + i} value={j} required />{opt}</label>)}
        </fieldset>)}
      </ActionForm>
    </div>
  </div></main>;
}

