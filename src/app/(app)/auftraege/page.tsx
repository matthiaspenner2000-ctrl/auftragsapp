import { getSession } from "@/lib/session";
import AuftraegeList from "./AuftraegeList";

export default async function AuftraegePage() {
  const session = await getSession();
  return <AuftraegeList isAdmin={session?.role === "ADMIN"} />;
}
