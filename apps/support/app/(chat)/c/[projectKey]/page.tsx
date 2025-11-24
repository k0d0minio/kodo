import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { generateWelcomeMessage } from "@/app/(chat)/actions";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { getLinearProjectMetadata } from "@/lib/linear/client";
import { getProjectByKey } from "@/lib/linear/project-utils";
import { generateUUID } from "@/lib/utils";

export default async function Page(props: { params: Promise<{ projectKey: string }> }) {
  const params = await props.params;
  const { projectKey } = params;

  const session = await auth();

  if (!session) {
    redirect("/api/auth/guest");
  }

  const project = await getProjectByKey(projectKey);

  if (!project) {
    notFound();
  }

  // Fetch project metadata
  let projectMetadata = null;
  try {
    projectMetadata = await getLinearProjectMetadata(project.id);
  } catch (error) {
    console.error("Failed to fetch project metadata:", error);
    // Continue without metadata if fetch fails
  }

  // Generate welcome message based on project metadata
  const welcomeMessage = await generateWelcomeMessage(projectMetadata);

  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get("chat-model");

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          autoResume={false}
          id={id}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialMessages={[]}
          initialProject={project}
          initialWelcomeMessage={welcomeMessage}
          isReadonly={false}
          lockedProject={true}
          customerRoute={projectKey}
          initialProjectMetadata={projectMetadata}
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
        initialProject={project}
        initialWelcomeMessage={welcomeMessage}
        isReadonly={false}
        lockedProject={true}
        customerRoute={projectKey}
        initialProjectMetadata={projectMetadata}
        key={id}
      />
      <DataStreamHandler />
    </>
  );
}
