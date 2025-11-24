import { motion } from "framer-motion";
import type { WelcomeMessage } from "@/app/(chat)/actions";

type GreetingProps = {
  welcomeMessage?: WelcomeMessage;
};

export const Greeting = ({ welcomeMessage }: GreetingProps) => {
  // Fallback to default message if not provided
  const header = welcomeMessage?.header ?? "Welcome to Support!";
  const subline =
    welcomeMessage?.subline ??
    "I'm your dedicated support agent. I'll help you create a comprehensive support ticket by gathering all the necessary details about your issue.";
  const instruction =
    welcomeMessage?.instruction ??
    "Please select a Linear project above, then describe your issue and I'll guide you through creating a detailed support ticket.";

  return (
    <div
      className="mx-auto mt-4 flex size-full max-w-3xl flex-col justify-center px-4 md:mt-16 md:px-8"
      key="overview"
    >
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="font-semibold text-xl md:text-2xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
      >
        {header}
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-xl text-zinc-500 md:text-2xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
      >
        {subline}
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 text-sm text-zinc-400"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.7 }}
      >
        {instruction}
      </motion.div>
    </div>
  );
};
