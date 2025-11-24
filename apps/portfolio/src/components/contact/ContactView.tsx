"use client";

import { Column, Row } from "@once-ui-system/core";
import Script from "next/script";
import ContactForm from "./ContactForm";

export default function ContactView() {
  return (
    <>
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="afterInteractive"
      />
      <Row
        gap="xl"
        s={{
          direction: "column",
          gap: "l",
        }}
      >
        <Column
          fillWidth
          s={{
            width: "100%",
          }}
        >
          <div
            className="calendly-inline-widget"
            data-url="https://calendly.com/jamie-nisbet/30min?hide_event_type_details=1&hide_gdpr_banner=1"
            style={{ minWidth: "320px", height: "700px" }}
          />
        </Column>
        <Column
          fillWidth
          s={{
            width: "100%",
          }}
        >
          <ContactForm />
        </Column>
      </Row>
    </>
  );
}
