import { RequestHandler } from "express";
import { z } from "zod";
import nodemailer from "nodemailer";
import { ContactEnquiry, ContactEnquiryDoc } from "../models/ContactEnquiry"; // Import new model
import { isDbConnected } from "../db"; // Import DB connection check
import { Model } from "mongoose";

// Schema for contact form submission
const contactFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().trim().optional(),
  subject: z.string().trim().min(1, "Subject is required"),
  message: z.string().trim().min(1, "Message is required"),
});

export const sendContactEmail: RequestHandler = async (req, res) => {
  const parsed = contactFormSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid form data", errors: parsed.error.errors });
  }

  const { name, email, phone, subject, message } = parsed.data;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const recipientEmail = "support@vyomkeshindustries.com"; // Your client's email

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    console.error("Email sending configuration missing. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env");
    // Proceed without sending email if config is missing, but log to DB
  }

  try {
    // Save to MongoDB
    if (isDbConnected()) {
      await (ContactEnquiry as Model<ContactEnquiryDoc>).create({
        name,
        email,
        phone,
        subject,
        message,
        status: "new",
      });
    } else {
      console.warn("Database not connected. Contact enquiry not saved to DB.");
    }

    // Send email if SMTP is configured
    if (smtpHost && smtpPort && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort),
        secure: Number(smtpPort) === 465, // Use `true` for port 465, `false` for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"${name}" <${email}>`, // Sender's name and email
        to: recipientEmail, // Recipient's email
        subject: `New Contact Enquiry: ${subject}`,
        html: `
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || "N/A"}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <br>
          <p>This email was sent from the contact form on your website.</p>
        `,
        text: `
          Name: ${name}
          Email: ${email}
          Phone: ${phone || "N/A"}
          Subject: ${subject}
          Message:
          ${message}
          
          This email was sent from the contact form on your website.
        `,
      });
    } else {
      console.warn("SMTP configuration missing. Contact enquiry email not sent.");
    }

    res.status(200).json({ message: "Enquiry submitted successfully!" });
  } catch (error: any) {
    console.error("Error processing contact enquiry:", error);
    res.status(500).json({ message: "Failed to submit enquiry. Please try again later." });
  }
};