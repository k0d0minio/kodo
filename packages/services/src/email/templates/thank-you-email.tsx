import React from "react";
import { render } from "@react-email/render";
import { Html, Head, Body, Container, Text, Button, Heading, Section } from "@react-email/components";

export type ThankYouEmailProps = {
  title?: string;
  message: string;
  userName?: string;
  actionUrl?: string;
  actionText?: string;
  footerText?: string;
};

export const ThankYouEmail = ({
  title = "Thank You!",
  message,
  userName,
  actionUrl,
  actionText,
  footerText,
}: ThankYouEmailProps) => (
  <Section>
    <Heading style={{ fontSize: 24, marginBottom: 20, color: "#1a1a1a" }}>
      {title}
    </Heading>
    {userName && (
      <Text style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 16, color: "#4a4a4a" }}>
        Hi {userName},
      </Text>
    )}
    <Text style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 24, color: "#4a4a4a" }}>
      {message}
    </Text>
    {actionUrl && actionText && (
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
 * Render Thank You email to HTML string
 */
export async function renderThankYouEmail(props: ThankYouEmailProps): Promise<string> {
  return render(
    <Html>
      <Head />
      <Body style={{ fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#f6f9fc", padding: "20px" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", backgroundColor: "#ffffff", padding: "40px", borderRadius: 8 }}>
          <ThankYouEmail {...props} />
        </Container>
      </Body>
    </Html>
  );
}

// Default export for React Email dev server
export default function ThankYouEmailPreview() {
  const sampleProps: ThankYouEmailProps = {
    title: "Thank You!",
    message: "We've received your request and will get back to you within 24 hours. We appreciate your patience.",
    userName: "Alex",
    actionUrl: "https://example.com/dashboard",
    actionText: "View Dashboard",
    footerText: "If you have any questions, feel free to reach out to our support team.",
  };

  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#f6f9fc", padding: "20px" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", backgroundColor: "#ffffff", padding: "40px", borderRadius: 8 }}>
          <ThankYouEmail {...sampleProps} />
        </Container>
      </Body>
    </Html>
  );
}


