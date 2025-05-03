import Contact from "../models/Contact.js";
import nodemailer from "nodemailer";


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,      
    pass: process.env.EMAIL_PASS,      
  },
});

const contactus = async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    // Save to database
    const contact = new Contact({ name, email, message });
    await contact.save();

    // Send email
    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: process.env.EMAIL_USER, 
      subject: "New Contact Form Submission",
      html: `
        <h2>New Contact Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: "Message sent successfully." });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports ={
    contactus
}