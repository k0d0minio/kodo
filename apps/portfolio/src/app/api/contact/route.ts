import { sendEmail } from "@kodo/services/email";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, service, message } = body;

    // Validate required fields
    if (!email || !service || !message) {
      return NextResponse.json(
        { error: "Email, service, and message are required." },
        { status: 400 }
      );
    }

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY environment variable is not set");
      return NextResponse.json(
        { error: "Email service is not configured." },
        { status: 500 }
      );
    }

    // Determine recipient email (use env variable or default to contact email)
    const recipientEmail =
      process.env.RESEND_EMAIL_RECIPIENT || "jamiecnisbet@gmail.com";

    // Send email using contact form template
    const result = await sendEmail({
      to: recipientEmail,
      subject: `Contact Form: ${service}`,
      template: "contact-form",
      templateProps: {
        email,
        subject: service,
        message,
        phone: phone || undefined,
        footerText: `Reply to: ${email}`,
      },
      replyTo: email
    });

    if (!result.success) {
      console.error("Resend error:", result.error);
      return NextResponse.json(
        { error: "Failed to send email. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
