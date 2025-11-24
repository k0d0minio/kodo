import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/app/(auth)/auth";
import { generateWelcomeMessage } from "@/app/(chat)/actions";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { getChatById, getMessagesByChatId } from "@/lib/db/queries";
import { getLinearProjectMetadata } from "@/lib/linear/client";
import { getProjectByKey } from "@/lib/linear/project-utils";
import { convertToUIMessages } from "@/lib/utils";

export default async function Page(props: { params: Promise<{ projectKey: string; id: string }> }) {
  const params = await props.params;
  const { projectKey, id } = params;

  const session = await auth();

  if (!session) {
    redirect("/api/auth/guest");
  }

  const project = await getProjectByKey(projectKey);

  if (!project) {
    notFound();
  }

  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  if (chat.visibility === "private") {
    if (!session.user) {
      return notFound();
    }

    if (session.user.id !== chat.userId) {
      return notFound();
    }
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  const uiMessages = convertToUIMessages(messagesFromDb);

  // Fetch project metadata (will only display if no messages)
  let projectMetadata = null;
  try {
    projectMetadata = await getLinearProjectMetadata(project.id);
  } catch (error) {
    console.error("Failed to fetch project metadata:", error);
    // Continue without metadata if fetch fails
  }

  // Generate welcome message based on project metadata (only shown if no messages)
  const welcomeMessage = await generateWelcomeMessage(projectMetadata);

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get("chat-model");

  if (!chatModelFromCookie) {
    return (
      <>
        <Chat
          autoResume={true}
          id={chat.id}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialLastContext={chat.lastContext ?? undefined}
          initialMessages={uiMessages}
          initialProject={project}
          initialWelcomeMessage={welcomeMessage}
          isReadonly={session?.user?.id !== chat.userId}
          lockedProject={true}
          customerRoute={projectKey}
          initialProjectMetadata={projectMetadata}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <Chat
        autoResume={true}
        id={chat.id}
        initialChatModel={chatModelFromCookie.value}
        initialLastContext={chat.lastContext ?? undefined}
        initialMessages={uiMessages}
        initialProject={project}
        initialWelcomeMessage={welcomeMessage}
        isReadonly={session?.user?.id !== chat.userId}
        lockedProject={true}
        customerRoute={projectKey}
        initialProjectMetadata={projectMetadata}
      />
      <DataStreamHandler />
    </>
  );
}
