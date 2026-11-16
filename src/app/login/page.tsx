import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { currentUser, home } from "@/modules/access/session";
import { LoginForm } from "./form";

export default async function Login() {
  const user = await currentUser();
  if (user) redirect(home[user.role]);
  return <main className="login-layout">
    <section className="login-brand">
      <Brand />
      <div className="login-copy"><p className="eyebrow">Платформа репетитора по истории</p>
        <h1>Время<br />истории.</h1>
        <p>Тесты, учебные источники и презентации для уроков истории.</p>
      </div>
      <div className="timeline" aria-hidden="true"><i /><i /><i /><i /><i /></div>
    </section>
    <section className="login-form"><div>
      <h2>Вход в кабинет</h2><p>Введите почту и пароль, которые выдал оператор.</p>
      <LoginForm />
    </div></section>
  </main>;
}
