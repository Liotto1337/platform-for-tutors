"use client";

import { useState } from "react";
import { ActionForm } from "@/components/action-form";
import { submitPractice } from "@/modules/actions/schoolwork";

export function PracticeResponse({ id }: { id: string }) {
  const [camera, setCamera] = useState(false);
  const [notice, setNotice] = useState("");
  function block(event: React.SyntheticEvent) {
    event.preventDefault();
    setNotice("Введите ответ самостоятельно. Копирование и вставка отключены.");
  }
  return <ActionForm action={submitPractice.bind(null, id)} label="Сдать задание">
    <label>Ответ<textarea name="answer" rows={4} maxLength={6000} onCopy={block} onPaste={block} onCut={block} onDrop={block}
      onBeforeInput={event => { if ((event.nativeEvent as InputEvent).inputType === "insertFromPaste") block(event); }} /></label>
    {notice && <small role="status">{notice}</small>}
    <label className="check"><input type="checkbox" checked={camera} onChange={e => setCamera(e.target.checked)} />Снять на камеру телефона</label>
    <label>Фото тетради · JPEG или PNG до 5 МБ<input type="file" name="photo" accept="image/jpeg,image/png" capture={camera ? "environment" : undefined} /></label>
  </ActionForm>;
}

