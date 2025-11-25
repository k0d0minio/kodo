import React from "react";
import { render } from "@react-email/render";
import { Html, Head, Body, Container, Text, Heading, Section } from "@react-email/components";

export type TableEmailProps = {
  title: string;
  data: Array<{ key: string; value: string }>;
  headerText?: string;
  footerText?: string;
};

export const TableEmail = ({
  title,
  data,
  headerText,
  footerText,
}: TableEmailProps) => (
  <Section>
    <Heading style={{ fontSize: 24, marginBottom: 20, color: "#1a1a1a" }}>
      {title}
    </Heading>
    {headerText && (
      <Text style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 24, color: "#4a4a4a" }}>
        {headerText}
      </Text>
    )}
    <table
      cellPadding="0"
      cellSpacing="0"
      role="presentation"
      style={{
        width: "100%",
        borderCollapse: "collapse",
        marginBottom: 24,
        border: "1px solid #e0e0e0",
      }}
    >
      <tbody>
        {data.map((item, index) => (
          <tr key={index}>
            <td
              style={{
                padding: "12px 16px",
                backgroundColor: "#f6f9fc",
                borderBottom: index < data.length - 1 ? "1px solid #e0e0e0" : "none",
                fontWeight: "600",
                color: "#1a1a1a",
                fontSize: 14,
                width: "30%",
                verticalAlign: "top",
              }}
            >
              {item.key}
            </td>
            <td
              style={{
                padding: "12px 16px",
                borderBottom: index < data.length - 1 ? "1px solid #e0e0e0" : "none",
                color: "#4a4a4a",
                fontSize: 14,
                lineHeight: 1.6,
                verticalAlign: "top",
              }}
            >
              {item.value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    {footerText && (
      <Text style={{ fontSize: 14, lineHeight: 1.6, color: "#6a6a6a", marginTop: 24 }}>
        {footerText}
      </Text>
    )}
  </Section>
);

/**
 * Render Table email to HTML string
 */
export async function renderTableEmail(props: TableEmailProps): Promise<string> {
  return render(
    <Html>
      <Head />
      <Body style={{ fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#f6f9fc", padding: "20px" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", backgroundColor: "#ffffff", padding: "40px", borderRadius: 8 }}>
          <TableEmail {...props} />
        </Container>
      </Body>
    </Html>
  );
}

// Default export for React Email dev server
export default function TableEmailPreview() {
  const sampleProps: TableEmailProps = {
    title: "Contact Form Submission",
    headerText: "You have received a new message from your portfolio contact form.",
    data: [
      { key: "Name", value: "John Doe" },
      { key: "Email", value: "john.doe@example.com" },
      { key: "Subject", value: "Project Inquiry" },
      { key: "Message", value: "I'm interested in discussing a potential project. Please get in touch when you have a moment." },
    ],
    footerText: "This message was sent from your portfolio contact form.",
  };

  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#f6f9fc", padding: "20px" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", backgroundColor: "#ffffff", padding: "40px", borderRadius: 8 }}>
          <TableEmail {...sampleProps} />
        </Container>
      </Body>
    </Html>
  );
}
