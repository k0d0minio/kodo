"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import type { WelcomeMessage } from "@/app/(chat)/actions";
import { ChatHeader } from "@/components/chat-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAgentChat } from "@/hooks/use-agent-chat";
import { useArtifactSelector } from "@/hooks/use-artifact";
import { useLinearProject } from "@/hooks/use-linear-project";
import type { Vote } from "@/lib/db/schema";
import type { Attachment, ChatMessage } from "@/lib/types";
import type { AppUsage } from "@/lib/usage";
import { fetcher } from "@/lib/utils";
import { Artifact } from "./artifact";
import { useDataStream } from "./data-stream-provider";
import type { LinearProject } from "./linear-project-selector";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import type { ProjectMetadata } from "./project-info";

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialProject,
  isReadonly,
  autoResume,
  initialLastContext,
  lockedProject,
  customerRoute,
  initialProjectMetadata,
  initialWelcomeMessage,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialProject: LinearProject | null;
  isReadonly: boolean;
  autoResume: boolean;
  initialLastContext?: AppUsage;
  lockedProject?: boolean;
  customerRoute?: string;
  initialProjectMetadata?: ProjectMetadata | null;
  initialWelcomeMessage?: WelcomeMessage;
}) {
  const { selectedProject, updateProject } = useLinearProject({
    chatId: id,
    initialProject,
    locked: lockedProject,
  });

  const { mutate } = useSWRConfig();
  const { setDataStream } = useDataStream();

  const [input, setInput] = useState<string>("");
  const [usage, _setUsage] = useState<AppUsage | undefined>(initialLastContext);
  const [showCreditCardAlert, setShowCreditCardAlert] = useState(false);
  const [currentModelId, setCurrentModelId] = useState(initialChatModel);
  const currentModelIdRef = useRef(currentModelId);

  useEffect(() => {
    currentModelIdRef.current = currentModelId;
  }, [currentModelId]);

  const { messages, setMessages, sendMessage, status, error, interrupt, regenerate, isLoading } =
    useAgentChat({
      id,
      selectedProject,
      initialMessages,
    });

  const searchParams = useSearchParams();
  const query = searchParams.get("query");

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      sendMessage(query);

      setHasAppendedQuery(true);
      window.history.replaceState({}, "", `/chat/${id}`);
    }
  }, [query, sendMessage, hasAppendedQuery, id]);

  const { data: votes } = useSWR<Vote[]>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  // Note: Auto-resume functionality removed for Agent SDK
  // useAutoResume({
  //   autoResume,
  //   initialMessages,
  //   resumeStream,
  //   setMessages,
  // });

  return (
    <>
      <div className="overscroll-behavior-contain flex h-dvh min-w-0 touch-pan-y flex-col bg-background safe-area-inset">
        <ChatHeader
          chatId={id}
          isReadonly={isReadonly}
          selectedProject={selectedProject}
          onProjectChange={updateProject}
          lockedProject={lockedProject}
          customerRoute={customerRoute}
          projectMetadata={initialProjectMetadata}
        />

        <Messages
          chatId={id}
          isArtifactVisible={isArtifactVisible}
          isReadonly={isReadonly}
          messages={messages}
          regenerate={regenerate}
          selectedModelId={initialChatModel}
          setMessages={setMessages}
          status={status}
          votes={votes}
          welcomeMessage={initialWelcomeMessage}
        />

        <div className="sticky bottom-0 z-10 mx-auto flex w-full max-w-4xl gap-2 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-2 pb-safe pb-3 md:px-4 md:pb-4">
          {!isReadonly && (
            <MultimodalInput
              attachments={attachments}
              chatId={id}
              input={input}
              messages={messages}
              onModelChange={setCurrentModelId}
              selectedModelId={currentModelId}
              selectedProject={selectedProject}
              sendMessage={sendMessage}
              setAttachments={setAttachments}
              setInput={setInput}
              setMessages={setMessages}
              status={status}
              stop={interrupt}
              usage={usage}
            />
          )}
        </div>
      </div>

      <Artifact
        attachments={attachments}
        chatId={id}
        input={input}
        isReadonly={isReadonly}
        messages={messages}
        regenerate={regenerate}
        selectedModelId={currentModelId}
        selectedProject={selectedProject}
        sendMessage={sendMessage}
        setAttachments={setAttachments}
        setInput={setInput}
        setMessages={setMessages}
        status={status}
        stop={interrupt}
        votes={votes}
      />

      <AlertDialog onOpenChange={setShowCreditCardAlert} open={showCreditCardAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate AI Gateway</AlertDialogTitle>
            <AlertDialogDescription>
              This application requires{" "}
              {process.env.NODE_ENV === "production" ? "the owner" : "you"} to activate Vercel AI
              Gateway.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                window.open(
                  "https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dadd-credit-card",
                  "_blank",
                );
                window.location.href = "/";
              }}
            >
              Activate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
