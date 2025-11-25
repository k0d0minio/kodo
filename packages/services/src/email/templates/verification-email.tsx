import React from "react";
import { render } from "@react-email/render";
import { Html, Head, Body, Container, Text, Button, Heading, Section, Hr } from "@react-email/components";

export type VerificationEmailProps = {
  verificationUrl: string;
  userName?: string;
  expiresIn?: string;
};

export const VerificationEmail = ({
  verificationUrl,
  userName,
  expiresIn = "24 hours",
}: VerificationEmailProps) => (
  <Section>
    <Heading style={{ fontSize: 24, marginBottom: 20, color: "#1a1a1a" }}>
      Verify Your Email Address
    </Heading>
    <Text style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 16, color: "#4a4a4a" }}>
      {userName ? `Hi ${userName},` : "Hi,"}
    </Text>
    <Text style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 24, color: "#4a4a4a" }}>
      Please verify your email address by clicking the button below. This helps us keep your account secure.
    </Text>
    <Button
      href={verificationUrl}
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
      Verify Email
    </Button>
    <Hr style={{ borderColor: "#e0e0e0", margin: "24px 0" }} />
    <Text style={{ fontSize: 14, lineHeight: 1.6, color: "#6a6a6a", marginBottom: 8 }}>
      This link will expire in {expiresIn}.
    </Text>
    <Text style={{ fontSize: 14, lineHeight: 1.6, color: "#6a6a6a" }}>
      If you didn't create an account, you can safely ignore this email.
    </Text>
  </Section>
);

/**
 * Render Verification email to HTML string
 */
export async function renderVerificationEmail(props: VerificationEmailProps): Promise<string> {
  return render(
    <Html>
      <Head />
      <Body style={{ fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#f6f9fc", padding: "20px" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", backgroundColor: "#ffffff", padding: "40px", borderRadius: 8 }}>
          <VerificationEmail {...props} />
        </Container>
      </Body>
    </Html>
  );
}

// Default export for React Email dev server
export default function VerificationEmailPreview() {
  const sampleProps: VerificationEmailProps = {
    verificationUrl: "https://example.com/verify-email?token=abc123",
    userName: "Alex",
    expiresIn: "24 hours",
  };

  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#f6f9fc", padding: "20px" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", backgroundColor: "#ffffff", padding: "40px", borderRadius: 8 }}>
          <VerificationEmail {...sampleProps} />
        </Container>
      </Body>
    </Html>
  );
}


