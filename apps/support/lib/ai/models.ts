export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "Claude 3.5 Sonnet",
    description: "Advanced AI assistant specialized in customer support and ticket creation",
  },
  {
    id: "chat-model-reasoning",
    name: "Claude 3.5 Sonnet (Reasoning)",
    description: "Uses advanced chain-of-thought reasoning for complex support issues",
  },
];
