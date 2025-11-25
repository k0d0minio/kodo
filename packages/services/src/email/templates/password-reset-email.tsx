import React from "react";
import { render } from "@react-email/render";
import { Html, Head, Body, Container, Text, Button, Heading, Section, Hr } from "@react-email/components";

export type PasswordResetEmailProps = {
  resetUrl: string;
  userName?: string;
  expiresIn?: string;
};

export const PasswordResetEmail = ({
  resetUrl,
  userName,
  expiresIn = "1 hour",
}: PasswordResetEmailProps) => (
  <Section>
    <Heading style={{ fontSize: 24, marginBottom: 20, color: "#1a1a1a" }}>
      Reset Your Password
    </Heading>
    <Text style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 16, color: "#4a4a4a" }}>
      {userName ? `Hi ${userName},` : "Hi,"}
    </Text>
    <Text style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 24, color: "#4a4a4a" }}>
      We received a request to reset your password. Click the button below to create a new password.
    </Text>
    <Button
      href={resetUrl}
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
      Reset Password
    </Button>
    <Hr style={{ borderColor: "#e0e0e0", margin: "24px 0" }} />
    <Text style={{ fontSize: 14, lineHeight: 1.6, color: "#6a6a6a", marginBottom: 8 }}>
      This link will expire in {expiresIn}.
    </Text>
    <Text style={{ fontSize: 14, lineHeight: 1.6, color: "#6a6a6a" }}>
      If you didn't request a password reset, you can safely ignore this email.
    </Text>
  </Section>
);

/**
 * Render Password Reset email to HTML string
 */
export async function renderPasswordResetEmail(props: PasswordResetEmailProps): Promise<string> {
  return render(
    <Html>
      <Head />
      <Body style={{ fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#f6f9fc", padding: "20px" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", backgroundColor: "#ffffff", padding: "40px", borderRadius: 8 }}>
          <PasswordResetEmail {...props} />
        </Container>
      </Body>
    </Html>
  );
}

// Default export for React Email dev server
export default function PasswordResetEmailPreview() {
  const sampleProps: PasswordResetEmailProps = {
    resetUrl: "https://example.com/reset-password?token=abc123",
    userName: "Alex",
    expiresIn: "1 hour",
  };

  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#f6f9fc", padding: "20px" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", backgroundColor: "#ffffff", padding: "40px", borderRadius: 8 }}>
          <PasswordResetEmail {...sampleProps} />
        </Container>
      </Body>
    </Html>
  );
}


