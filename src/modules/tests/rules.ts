import { z } from "zod";

export const titleSchema = z.string().trim().min(1).max(160);
export const difficultySchema = z.enum(["EASY", "MEDIUM", "HARD"]);
export const questionSchema = z.object({
  id: z.uuid().optional(),
  text: z.string().trim().max(2000),
  format: z.literal("SINGLE_CHOICE"),
  difficulty: difficultySchema.nullable(),
  topicId: z.string().min(1).max(80).nullable(),
  eraId: z.string().min(1).max(80).nullable(),
  options: z.array(z.object({ text: z.string().trim().max(500), correct: z.boolean() })).max(6),
}).refine((question) => question.options.filter((option) => option.correct).length <= 1);

export const testSchema = z.object({
  title: titleSchema,
  revision: z.number().int().nonnegative(),
  questions: z.array(questionSchema).max(40),
  review: z.boolean(),
});

export type EditorQuestion = z.infer<typeof questionSchema>;

export function readyToReview(questions: EditorQuestion[]) {
  return questions.length > 0 && questions.every((question) => {
    const answers = question.options.map((option) => option.text.toLocaleLowerCase("ru"));
    return question.text && question.difficulty && question.topicId && question.eraId
      && answers.length >= 2 && answers.every(Boolean) && new Set(answers).size === answers.length
      && question.options.filter((option) => option.correct).length === 1;
  });
}

export const generatedSchema = z.object({
  questions: z.array(z.object({
    text: z.string().trim().min(1).max(2000),
    options: z.array(z.string().trim().min(1).max(500)).min(2).max(6),
    correctIndex: z.number().int().min(0).max(5),
    excerpt: z.string().min(12).max(1200),
    difficulty: difficultySchema,
    topicId: z.string().min(1).max(80),
    eraId: z.string().min(1).max(80),
  })).min(1).max(8),
});
