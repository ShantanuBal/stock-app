import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { name, email, message } = await req.json();
  console.log(`[contact] form submission from name="${name}" email="${email}"`);

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  try {
    await resend.emails.send({
      from: "Horizon Contact <contact@usehorizon.dev>",
      to: "shantanu.r.bal@gmail.com",
      replyTo: email,
      subject: `Horizon contact form: ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    });
    console.log(`[contact] email sent successfully from ${email}`);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.log(`[contact] email send failed: ${(e as Error).name} — ${(e as Error).message}`);
    return NextResponse.json({ error: "Failed to send message. Please try again." }, { status: 500 });
  }
}
