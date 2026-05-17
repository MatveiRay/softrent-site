import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }
  return (
    <ProfileClient
      name={session.user.name ?? ""}
      email={session.user.email ?? ""}
    />
  );
}
