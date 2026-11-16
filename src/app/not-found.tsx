import Link from "next/link";

export default function Missing() {
  return <main className="simple-page"><section className="panel">
    <h1>Страница недоступна</h1>
    <p>Проверьте адрес или вернитесь в свой кабинет.</p>
    <Link className="button" href="/">В кабинет</Link>
  </section></main>;
}
