import React from "react";
import { render } from "@react-email/render";
import { Html, Head, Body, Container, Text, Heading, Section } from "@react-email/components";

export type NotificationEmailProps = {
  title: string;
  message: string;
  userName?: string;
  footerText?: string;
};

export const NotificationEmail = ({
  title,
  message,
  userName,
  footerText,
}: NotificationEmailProps) => (
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
    {footerText && (
      <Text style={{ fontSize: 14, lineHeight: 1.6, color: "#6a6a6a", marginTop: 24 }}>
        {footerText}
      </Text>
    )}
  </Section>
);

/**
 * Render Notification email to HTML string
 */
export async function renderNotificationEmail(props: NotificationEmailProps): Promise<string> {
  return render(
    <Html>
      <Head />
      <Body style={{ fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#f6f9fc", padding: "20px" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", backgroundColor: "#ffffff", padding: "40px", borderRadius: 8 }}>
          <NotificationEmail {...props} />
        </Container>
      </Body>
    </Html>
  );
}

// Default export for React Email dev server
export default function NotificationEmailPreview() {
  const sampleProps: NotificationEmailProps = {
    title: "Account Update",
    message: "Your account settings have been successfully updated. If you didn't make this change, please contact support immediately.",
    userName: "Alex",
    footerText: "This is an automated notification. Please do not reply to this email.",
  };

  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#f6f9fc", padding: "20px" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", backgroundColor: "#ffffff", padding: "40px", borderRadius: 8 }}>
          <NotificationEmail {...sampleProps} />
        </Container>
      </Body>
    </Html>
  );
}


