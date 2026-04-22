import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ConsolidadoView } from "./consolidado-view";

export default async function ConsolidadoPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  return <ConsolidadoView />;
}
