import { redirect } from "next/navigation";
import { currentUser, home } from "@/modules/access/session";

export default async function Index() {
  const user = await currentUser();
  redirect(user ? home[user.role] : "/login");
}
