import React from "react";
import { render } from "@react-email/render";
import { Html, Head, Body, Container, Text, Button, Heading, Section } from "@react-email/components";

export type WelcomeEmailProps = {
  userName?: string;
  welcomeMessage?: string;
  actionUrl?: string;
  actionText?: string;
  footerText?: string;
};

export const WelcomeEmail = ({
  userName,
  welcomeMessage = "We're excited to have you on board!",
  actionUrl,
  actionText = "Get Started",
  footerText,
}: WelcomeEmailProps) => (
  <Section>
    <Heading style={{ fontSize: 24, marginBottom: 20, color: "#1a1a1a" }}>
      Welcome{userName ? `, ${userName}` : ""}!
    </Heading>
    <Text style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 24, color: "#4a4a4a" }}>
      {welcomeMessage}
    </Text>
    {actionUrl && (
      <Button
        href={actionUrl}
        style={{
          backgroundColor: "#007ee6",
          borderRadius: 6,
          color: "#fff",
          fontSize: 16,
          fontWeight: "600",
          textDecoration: "none",
          textAlign: "center" as const,
          display: "inline-block",
          padding: "12px 32px",
          marginBottom: 24,
        }}
      >
        {actionText}
      </Button>
    )}
    {footerText && (
      <Text style={{ fontSize: 14, lineHeight: 1.6, color: "#6a6a6a", marginTop: 24 }}>
        {footerText}
      </Text>
    )}
  </Section>
);

/**
 * Render Welcome email to HTML string
 */
export async function renderWelcomeEmail(props: WelcomeEmailProps): Promise<string> {
  return render(
    <Html>
      <Head />
      <Body style={{ fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#f6f9fc", padding: "20px" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", backgroundColor: "#ffffff", padding: "40px", borderRadius: 8 }}>
          <WelcomeEmail {...props} />
        </Container>
      </Body>
    </Html>
  );
}

// Default export for React Email dev server
export default function WelcomeEmailPreview() {
  const sampleProps: WelcomeEmailProps = {
    userName: "Alex",
    welcomeMessage: "We're excited to have you on board! Get started by exploring your dashboard.",
    actionUrl: "https://example.com/dashboard",
    actionText: "Go to Dashboard",
    footerText: "If you have any questions, feel free to reach out to our support team.",
  };

  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#f6f9fc", padding: "20px" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", backgroundColor: "#ffffff", padding: "40px", borderRadius: 8 }}>
          <WelcomeEmail {...sampleProps} />
        </Container>
      </Body>
    </Html>
  );
}


