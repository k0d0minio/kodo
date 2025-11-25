"use client";

import { Column, Icon, IconButton, Row } from "@once-ui-system/core";
import ContactForm from "./ContactForm";
import Script from "next/script";
import { useEffect } from "react";

declare global {
  interface Window {
    Calendly: {
      initPopupWidget: (options: { url: string }) => void;
    };
  }
}

export default function ContactView() {
  useEffect(() => {
    // Add Calendly CSS link
    const link = document.createElement("link");
    link.href = "https://assets.calendly.com/assets/external/widget.css";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    return () => {
      // Cleanup: remove the link when component unmounts
      const existingLink = document.querySelector(
        'link[href="https://assets.calendly.com/assets/external/widget.css"]'
      );
      if (existingLink) {
        document.head.removeChild(existingLink);
      }
    };
  }, []);

  const handleScheduleCall = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (window.Calendly) {
      window.Calendly.initPopupWidget({
        url: "https://calendly.com/jamie-nisbet/30min?hide_event_type_details=1&hide_gdpr_banner=1",
      });
    }
    return false;
  };

  return (
    <>
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="afterInteractive"
      />
      <Column gap="l">
        <Row
          fitWidth
          border="brand-alpha-medium"
          background="brand-alpha-weak"
          radius="full"
          padding="4"
          gap="8"
          vertical="center"
          onClick={handleScheduleCall}
          style={{
            backdropFilter: "blur(var(--static-space-1))",
            cursor: "pointer",
          }}
        >
          <Icon paddingLeft="12" name="calendar" onBackground="brand-weak" />
          <Row paddingX="8">Schedule a call</Row>
          <IconButton
            data-border="rounded"
            variant="secondary"
            icon="chevronRight"
          />
        </Row>
        <ContactForm />
      </Column>
    </>
  );
}

