"use client";

import { useCallback, useRef, useState } from "react";
import type { LinearProject } from "@/components/linear-project-selector";
import type { ChatMessage } from "@/lib/types";

type AgentStatus = "idle" | "streaming" | "error";

type AgentMessage = {
  type: "assistant" | "user" | "result" | "system" | "stream_event" | "error";
  content?: string;
  toolUse?: any;
  error?: string;
};

export function useAgentChat({
  id,
  selectedProject,
  initialMessages = [],
}: {
  id: string;
  selectedProject: LinearProject | null;
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [status, setStatus] = useState<AgentStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!selectedProject) {
        setError("Please select a Linear project first");
        return;
      }

      if (status === "streaming") {
        return;
      }

      setStatus("streaming");
      setError(null);

      // Add user message immediately
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        parts: [{ type: "text", text: content }],
        metadata: { createdAt: new Date().toISOString() },
      };

      setMessages((prev) => [...prev, userMessage]);

      // Create abort controller for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const response = await fetch("/api/agent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chatId: id,
            message: content,
            selectedProject,
            action: "send",
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const assistantMessageId = `assistant-${Date.now()}`;
        const contentRef = { current: "" };
        const toolUsesRef: any[] = [];

        // Add assistant message placeholder
        const assistantMessage: ChatMessage = {
          id: assistantMessageId,
          role: "assistant",
          parts: [{ type: "text", text: "" }],
          metadata: { createdAt: new Date().toISOString() },
        };

        setMessages((prev) => [...prev, assistantMessage]);

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                handleAgentMessage(data, assistantMessageId, contentRef, toolUsesRef);
              } catch (parseError) {
                console.warn("Failed to parse SSE data:", parseError);
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Request was aborted, don't set error
          return;
        }

        console.error("Agent chat error:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setStatus("idle");
        abortControllerRef.current = null;
      }
    },
    [id, selectedProject, status, handleAgentMessage],
  );

  const handleAgentMessage = (
    message: any,
    assistantMessageId: string,
    contentRef: { current: string },
    _toolUsesRef: any[],
  ) => {
    switch (message.type) {
      case "assistant":
        // Complete assistant message with full content
        if (message.message?.content?.[0]?.text) {
          contentRef.current = message.message.content[0].text;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, parts: [{ type: "text", text: contentRef.current }] }
                : msg,
            ),
          );
        }
        break;

      case "stream_event": {
        // Handle streaming events (partial messages)
        const event = message.event;
        if (event?.type === "content_block_delta" && event?.delta?.type === "text_delta") {
          const deltaText = event.delta.text;
          if (deltaText) {
            contentRef.current += deltaText;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, parts: [{ type: "text", text: contentRef.current }] }
                  : msg,
              ),
            );
          }
        }
        break;
      }

      case "result":
        // Final result - use the result text if content is empty
        if (message.result && !contentRef.current) {
          contentRef.current = message.result;
        }
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, parts: [{ type: "text", text: contentRef.current }] }
              : msg,
          ),
        );
        break;

      case "error":
        setError(message.error || "Unknown error occurred");
        break;
    }
  };

  const interrupt = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Send interrupt request
    fetch("/api/agent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatId: id,
        message: "",
        selectedProject,
        action: "interrupt",
      }),
    }).catch(console.error);

    setStatus("idle");
  }, [id, selectedProject]);

  const regenerate = useCallback(() => {
    // For now, just clear the last assistant message
    setMessages((prev) => {
      const lastMessage = prev[prev.length - 1];
      if (lastMessage?.role === "assistant") {
        return prev.slice(0, -1);
      }
      return prev;
    });
  }, []);

  return {
    messages,
    setMessages,
    sendMessage,
    status,
    error,
    interrupt,
    regenerate,
    isLoading: status === "streaming",
  };
}
