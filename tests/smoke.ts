import "dotenv/config";
import assert from "node:assert/strict";

const url = new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000");
const password = process.env.PILOT_PASSWORD;
assert.ok(password, "Укажите PILOT_PASSWORD для вымышленных аккаунтов");

async function request(path: string, init: RequestInit = {}) {
  return fetch(new URL(path, url), { ...init, redirect: "manual", signal: AbortSignal.timeout(20_000) });
}

function cookieHeader(response: Response) {
  return response.headers.getSetCookie().map((cookie) => cookie.split(";")[0]).join("; ");
}

function authPost(path: string, body: object, cookie?: string) {
  return request("/api/auth/" + path, {
    method: "POST",
    headers: { Origin: url.origin, "Content-Type": "application/json", Cookie: cookie ?? "" },
    body: JSON.stringify(body),
  });
}

const unsigned = await request("/tutor");
assert.ok([303, 307, 308].includes(unsigned.status), "Требуется вход");
assert.equal(new URL(unsigned.headers.get("location")!, url).pathname, "/login");

for (const [name, page, forbidden] of [
  ["tutor", "/tutor", "/student"], ["student", "/student", "/tutor"], ["parent", "/parent", "/tutor"],
]) {
  const signIn = await authPost("sign-in/email", { email: name + "@example.test", password });
  assert.equal(signIn.status, 200, "Вход " + name);
  const cookie = cookieHeader(signIn);
  assert.ok(cookie, "Cookie сессии");
  const options = { headers: { Cookie: cookie } };
  assert.equal((await request(page, options)).status, 200, "Свой кабинет " + name);
  assert.equal((await request(forbidden, options)).status, 404, "Чужой кабинет " + name);
  assert.equal((await authPost("sign-out", {}, cookie)).status, 200, "Выход " + name);
  assert.ok([303, 307, 308].includes((await request(page, options)).status), "Сессия отозвана");
  console.log("OK", name);
}

const signup = await authPost("sign-up/email", { email: "blocked@example.test", password, name: "Blocked" });
assert.ok([400, 403, 404, 422].includes(signup.status), "Публичная регистрация закрыта");
console.log("OK регистрация закрыта");
