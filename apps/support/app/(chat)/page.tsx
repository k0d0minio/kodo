import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { generateUUID } from "@/lib/utils";
import { auth } from "../(auth)/auth";
import { generateWelcomeMessage } from "./actions";

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/guest");
  }

  const cookieStore = await cookies();
  const customerRouteCookie = cookieStore.get("customer-route");

  // If user is on a customer route, redirect them back to it
  if (customerRouteCookie?.value) {
    redirect(`/c/${customerRouteCookie.value}`);
  }

  const id = generateUUID();
  const modelIdFromCookie = cookieStore.get("chat-model");

  // Generate welcome message (no project selected)
  const welcomeMessage = await generateWelcomeMessage(null);

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          autoResume={false}
          id={id}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialMessages={[]}
          initialProject={null}
          initialWelcomeMessage={welcomeMessage}
          isReadonly={false}
          key={id}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <Chat
        autoResume={false}
        id={id}
        initialChatModel={modelIdFromCookie.value}
        initialMessages={[]}
        initialProject={null}
        initialWelcomeMessage={welcomeMessage}
        isReadonly={false}
        key={id}
      />
      <DataStreamHandler />
    </>
  );
}
