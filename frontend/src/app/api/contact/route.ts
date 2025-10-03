import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const { name, hotelName, email, phone, roomCount, message } =
      await request.json();

    // Validate required fields
    if (!name || !hotelName || !email || !phone || !roomCount) {
      return NextResponse.json(
        { error: "All required fields must be filled" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // Email content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #000; font-size: 24px; margin: 0; padding: 10px; background-color: #f5f5f5; border-radius: 4px;">
            New Contact Form Submission - Innexora
          </h1>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <h2 style="color: #333; font-size: 18px; margin-top: 0;">Contact Details</h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555; width: 30%;">Name:</td>
              <td style="padding: 8px 0; color: #333;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Hotel Name:</td>
              <td style="padding: 8px 0; color: #333;">${hotelName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td>
              <td style="padding: 8px 0; color: #333;"><a href="mailto:${email}" style="color: #007bff; text-decoration: none;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Phone:</td>
              <td style="padding: 8px 0; color: #333;"><a href="tel:${phone}" style="color: #007bff; text-decoration: none;">${phone}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Room Count:</td>
              <td style="padding: 8px 0; color: #333;">${roomCount}</td>
            </tr>
          </table>
        </div>

        ${
          message
            ? `
        <div style="background-color: #f0f8ff; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <h3 style="color: #333; font-size: 16px; margin-top: 0;">Additional Message:</h3>
          <p style="color: #555; line-height: 1.5; margin: 0;">${message}</p>
        </div>
        `
            : ""
        }

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="color: #888; font-size: 12px; margin: 0;">
            This email was sent from the Innexora contact form on ${new Date().toLocaleString()}
          </p>
        </div>
      </div>
    `;

    // Email options
    const mailOptions = {
      from: `"Innexora Contact Form" <${process.env.GMAIL_USER}>`,
      to: process.env.CONTACT_EMAIL,
      subject: `New Demo Request from ${name} - ${hotelName}`,
      html: htmlContent,
      replyTo: email,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: "Email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
