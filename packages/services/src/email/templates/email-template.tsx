import {
  Html,
  Head,
  Body,
  Container,
  Img,
  Heading,
  Font,
} from "@react-email/components";
import { ReactNode } from "react";

export type EmailTemplateProps = {
  title: string;
  children: ReactNode;
};

export const EmailTemplate = ({ title, children }: EmailTemplateProps) => (
  <Html>
    <Head>
      <Font
        fontFamily="Inter"
        fallbackFontFamily="Arial"
        webFont={{
          url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap",
          format: "woff2",
        }}
      />
    </Head>
    <Body
      style={{
        fontFamily: "Inter, Arial, sans-serif",
        margin: 0,
        padding: "40px 20px",
        backgroundColor: "#F6F8F9",
        color: "#222222",
        fontSize: 16,
        lineHeight: 1.5,
      }}
    >
      <Container
        style={{
          maxWidth: 600,
          borderRadius: 10,
          margin: "0 auto",
          backgroundColor: "#ffffff",
          padding: 30,
        }}
      >
        <Img
          src="https://sustentus.com/email-assets/logo.png"
          alt="Sustentus logo"
          width={180}
        />
        <Heading style={{ fontSize: 24, marginBottom: 20 }}>{title}</Heading>
        {children}
      </Container>
    </Body>
  </Html>
);
