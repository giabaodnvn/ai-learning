import { redirect } from "next/navigation";

// `/` has no content of its own (it used to serve the create-next-app
// template). Signed-in users belong on the dashboard; everyone else is bounced
// to /login by the proxy guarding /app/*.
export default function Home() {
  redirect("/app/dashboard");
}
