import React from "react";
import { render } from "@react-email/render";
import { Html, Head, Body, Container, Text, Heading, Section, Hr } from "@react-email/components";

export type ContactFormEmailProps = {
  name?: string;
  email: string;
  subject: string;
  message: string;
  phone?: string;
  footerText?: string;
};

export const ContactFormEmail = ({
  name,
  email,
  subject,
  message,
  phone,
  footerText,
}: ContactFormEmailProps) => (
  <Section>
    <Heading style={{ fontSize: 24, marginBottom: 20, color: "#1a1a1a" }}>
      New Contact Form Submission
    </Heading>
    <Text style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 24, color: "#4a4a4a" }}>
      You have received a new message from your portfolio contact form.
    </Text>
    
    {name && (
      <Section style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: "#1a1a1a", marginBottom: 4, marginTop: 0 }}>
          Name:
        </Text>
        <Text style={{ fontSize: 16, lineHeight: 1.6, color: "#4a4a4a", marginTop: 0 }}>
          {name}
        </Text>
      </Section>
    )}

    <Section style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 14, fontWeight: "600", color: "#1a1a1a", marginBottom: 4, marginTop: 0 }}>
        Email:
      </Text>
      <Text style={{ fontSize: 16, lineHeight: 1.6, color: "#4a4a4a", marginTop: 0 }}>
        {email}
      </Text>
    </Section>

    {phone && (
      <Section style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: "#1a1a1a", marginBottom: 4, marginTop: 0 }}>
          Phone:
        </Text>
        <Text style={{ fontSize: 16, lineHeight: 1.6, color: "#4a4a4a", marginTop: 0 }}>
          {phone}
        </Text>
      </Section>
    )}

    <Section style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 14, fontWeight: "600", color: "#1a1a1a", marginBottom: 4, marginTop: 0 }}>
        Service:
      </Text>
      <Text style={{ fontSize: 16, lineHeight: 1.6, color: "#4a4a4a", marginTop: 0 }}>
        {subject}
      </Text>
    </Section>

    <Section style={{ marginBottom: 24 }}>
      <Text style={{ fontSize: 14, fontWeight: "600", color: "#1a1a1a", marginBottom: 4, marginTop: 0 }}>
        Message:
      </Text>
      <Text style={{ fontSize: 16, lineHeight: 1.6, color: "#4a4a4a", marginTop: 0, whiteSpace: "pre-wrap" }}>
        {message}
      </Text>
    </Section>

    {footerText && (
      <>
        <Hr style={{ borderColor: "#e0e0e0", margin: "24px 0" }} />
        <Text style={{ fontSize: 14, lineHeight: 1.6, color: "#6a6a6a" }}>
          {footerText}
        </Text>
      </>
    )}
  </Section>
);

/**
 * Render Contact Form email to HTML string
 */
export async function renderContactFormEmail(props: ContactFormEmailProps): Promise<string> {
  return render(
    <Html>
      <Head />
      <Body style={{ fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#f6f9fc", padding: "20px" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", backgroundColor: "#ffffff", padding: "40px", borderRadius: 8 }}>
          <ContactFormEmail {...props} />
        </Container>
      </Body>
    </Html>
  );
}

// Default export for React Email dev server
export default function ContactFormEmailPreview() {
  const sampleProps: ContactFormEmailProps = {
    name: "John Doe",
    email: "john.doe@example.com",
    subject: "Project Inquiry",
    message: "I'm interested in discussing a potential project. Please get in touch when you have a moment.",
    footerText: "Reply to: john.doe@example.com",
  };

  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#f6f9fc", padding: "20px" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", backgroundColor: "#ffffff", padding: "40px", borderRadius: 8 }}>
          <ContactFormEmail {...sampleProps} />
        </Container>
      </Body>
    </Html>
  );
}

