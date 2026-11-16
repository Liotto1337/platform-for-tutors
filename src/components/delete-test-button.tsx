"use client";

import { deleteTest } from "@/modules/actions/tutor";

export function DeleteTestButton({ id }: { id: string }) {
  const action = deleteTest.bind(null, id);
  const submit = async (_formData: FormData) => { await action(); };
  return <form action={submit} onSubmit={(event) => {
    if (!window.confirm("Удалить тест? Это действие нельзя отменить.")) event.preventDefault();
  }}>
    <button className="secondary" type="submit">Удалить тест</button>
  </form>;
}
