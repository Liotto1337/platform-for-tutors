import type { Metadata } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource/pt-serif/400.css";
import "@fontsource/pt-serif/700.css";
import "./styles.css";

export const metadata: Metadata = {
  title: { default: "Chronosphere", template: "%s · Chronosphere" },
  description: "Кабинет репетитора по истории",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="ru"><body>{children}</body></html>;
}
