import assert from "node:assert/strict";
import { test } from "node:test";
import { readyToReview, testSchema, type EditorQuestion } from "../src/modules/tests/rules";
import { readSource } from "../src/modules/sources/input";

const complete: EditorQuestion = {
  text: "Когда началась Северная война?",
  format: "SINGLE_CHOICE", difficulty: "MEDIUM", topicId: "events", eraId: "early-modern",
  options: [{ text: "1700", correct: true }, { text: "1721", correct: false }],
};

test("проверка допускает полный вопрос и отклоняет черновики и дубликаты", () => {
  assert.equal(readyToReview([complete]), true);
  assert.equal(readyToReview([]), false);
  assert.equal(readyToReview([{ ...complete, topicId: null }]), false);
  assert.equal(readyToReview([{ ...complete, options: [{ text: "1700", correct: false }, { text: "1700", correct: true }] }]), false);
});

test("сервер принимает незаполненный черновик и отклоняет два верных ответа", () => {
  const base = { title: "Новый тест", revision: 0, review: false };
  assert.equal(testSchema.safeParse({ ...base, questions: [{ ...complete, text: "", options: [] }] }).success, true);
  assert.equal(testSchema.safeParse({ ...base, questions: [{
    ...complete, options: complete.options.map((answer) => ({ ...answer, correct: true })),
  }] }).success, false);
});

test("загрузка TXT декодирует UTF-8 и отклоняет битую кодировку и двойной ввод", async () => {
  const data = new FormData();
  const sample = "В 1700 году началась Северная война.";
  data.set("file", new File([sample], "source.txt"));
  assert.deepEqual(await readSource(data), { success: true, data: sample });
  data.set("text", sample);
  assert.equal(await readSource(data), null);
  data.delete("text");
  data.set("file", new File([new Uint8Array([0xc3, 0x28])], "bad.txt"));
  assert.equal(await readSource(data), null);
});
