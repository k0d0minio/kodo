import React from "react";
import { render } from "@react-email/render";
import { Html, Head, Body, Container, Text, Button, Heading, Section, Hr } from "@react-email/components";

export type InvitationEmailProps = {
  invitationUrl: string;
  inviterName?: string;
  invitationMessage?: string;
  expiresIn?: string;
};

export const InvitationEmail = ({
  invitationUrl,
  inviterName,
  invitationMessage,
  expiresIn = "7 days",
}: InvitationEmailProps) => (
  <Section>
    <Heading style={{ fontSize: 24, marginBottom: 20, color: "#1a1a1a" }}>
      You're Invited!
    </Heading>
    {inviterName && (
      <Text style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 16, color: "#4a4a4a" }}>
        {inviterName} has invited you to join.
      </Text>
    )}
    {invitationMessage ? (
      <Text style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 24, color: "#4a4a4a" }}>
        {invitationMessage}
      </Text>
    ) : (
      <Text style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 24, color: "#4a4a4a" }}>
        Click the button below to accept the invitation and get started.
      </Text>
    )}
    <Button
      href={invitationUrl}
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
      Accept Invitation
    </Button>
    <Hr style={{ borderColor: "#e0e0e0", margin: "24px 0" }} />
    <Text style={{ fontSize: 14, lineHeight: 1.6, color: "#6a6a6a" }}>
      This invitation will expire in {expiresIn}.
    </Text>
  </Section>
);

/**
 * Render Invitation email to HTML string
 */
export async function renderInvitationEmail(props: InvitationEmailProps): Promise<string> {
  return render(
    <Html>
      <Head />
      <Body style={{ fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#f6f9fc", padding: "20px" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", backgroundColor: "#ffffff", padding: "40px", borderRadius: 8 }}>
          <InvitationEmail {...props} />
        </Container>
      </Body>
    </Html>
  );
}

// Default export for React Email dev server
export default function InvitationEmailPreview() {
  const sampleProps: InvitationEmailProps = {
    invitationUrl: "https://example.com/accept-invitation?token=abc123",
    inviterName: "Sarah",
    invitationMessage: "I'd like to invite you to collaborate on our project. Join us to get started!",
    expiresIn: "7 days",
  };

  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#f6f9fc", padding: "20px" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", backgroundColor: "#ffffff", padding: "40px", borderRadius: 8 }}>
          <InvitationEmail {...sampleProps} />
        </Container>
      </Body>
    </Html>
  );
}


