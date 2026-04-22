import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { UploadView } from "./upload-view";

export default async function UploadPage() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") redirect("/dashboard");

  return <UploadView />;
}
