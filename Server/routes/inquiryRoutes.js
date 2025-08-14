const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Inquiry = require('../models/Inquiry');
const Package = require('../models/Package');
const Activity = require('../models/Activity');
const Resort = require('../models/Resort');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Function to generate admin email template
const generateAdminEmailTemplate = (data) => {
  const { entityType, entityTitle, resortName, roomName, name, email, phone_number, message, entity, from_date, to_date, adults, children, infants, country, buttonType, submitted_at } = data;
  
  const plainText = `
New Inquiry for ${entityType}: ${entityTitle}
${entityType === 'Accommodation' ? `Resort: ${resortName}\nRoom: ${roomName}` : ''}
Name: ${name}
Email: ${email}
Phone: ${phone_number || 'N/A'}
Message: ${message || 'N/A'}
${entityType} ID: ${entity.$oid}
From Date: ${from_date ? new Date(from_date).toLocaleDateString() : 'N/A'}
To Date: ${to_date ? new Date(to_date).toLocaleDateString() : 'N/A'}
Adults (12+): ${adults ?? 'N/A'}
Children (2-11): ${children ?? 'N/A'}
Infants (below 2): ${infants ?? 'N/A'}
Country: ${country || 'N/A'}
Inquiry Type: ${buttonType === 'bookNow' ? 'Email' : 'WhatsApp'}
Submitted At: ${submitted_at.toISOString()}
  `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Inquiry - ${entityType}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Helvetica, Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e0e0e0;">
        <!-- Header -->
        <tr>
          <td style="background-color: #074a5b; color: #ffffff; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 26px; font-weight: bold;">Traveliccted</h1>
            <p style="margin: 5px 0; font-size: 14px; color: #a1d6e2;">New Inquiry Notification</p>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding: 20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <!-- Inquiry Highlight -->
              <tr>
                <td style="background-color: #1e809b; color: #ffffff; padding: 15px; text-align: center;">
                  <h2 style="margin: 0; font-size: 18px; font-weight: bold;">${entityType}: ${entityTitle}</h2>
                  ${entityType === 'Accommodation' ? `
                    <p style="margin: 5px 0; font-size: 14px;"><strong>Resort:</strong> ${resortName}</p>
                    <p style="margin: 5px 0; font-size: 14px;"><strong>Room:</strong> ${roomName}</p>
                  ` : ''}
                </td>
              </tr>
              <!-- Spacer -->
              <tr><td style="height: 20px;"></td></tr>
              <!-- Customer Details -->
              <tr>
                <td>
                  <h3 style="color: #074a5b; font-size: 16px; margin: 0 0 10px;">Customer Details</h3>
                  <table width="100%" cellpadding="5" style="font-size: 14px; color: #333333;">
                    <tr><td><strong>Name:</strong></td><td>${name}</td></tr>
                    <tr><td><strong>Email:</strong></td><td><a href="mailto:${email}" style="color: #1e809b; text-decoration: none;">${email}</a></td></tr>
                    <tr><td><strong>Phone:</strong></td><td>${phone_number || 'N/A'}</td></tr>
                    <tr><td><strong>Country:</strong></td><td>${country || 'N/A'}</td></tr>
                  </table>
                </td>
              </tr>
              <!-- Spacer -->
              <tr><td style="height: 20px;"></td></tr>
              <!-- Travel Details -->
              <tr>
                <td>
                  <h3 style="color: #074a5b; font-size: 16px; margin: 0 0 10px;">Travel Details</h3>
                  <table width="100%" cellpadding="5" style="font-size: 14px; color: #333333;">
                    <tr><td><strong>From Date:</strong></td><td>${from_date ? new Date(from_date).toLocaleDateString() : 'N/A'}</td></tr>
                    <tr><td><strong>To Date:</strong></td><td>${to_date ? new Date(to_date).toLocaleDateString() : 'N/A'}</td></tr>
                    <tr><td><strong>Adults (12+):</strong></td><td>${adults ?? 'N/A'}</td></tr>
                    <tr><td><strong>Children (2-11):</strong></td><td>${children ?? 'N/A'}</td></tr>
                    <tr><td><strong>Infants (below 2):</strong></td><td>${infants ?? 'N/A'}</td></tr>
                  </table>
                </td>
              </tr>
              ${message ? `
                <!-- Spacer -->
                <tr><td style="height: 20px;"></td></tr>
                <!-- Message -->
                <tr>
                  <td>
                    <h3 style="color: #074a5b; font-size: 16px; margin: 0 0 10px;">Customer Message</h3>
                    <p style="font-size: 14px; color: #333333; background-color: #f9f9f9; padding: 10px; border-left: 4px solid #1e809b; margin: 0;">${message}</p>
                  </td>
                </tr>
              ` : ''}
              <!-- Spacer -->
              <tr><td style="height: 20px;"></td></tr>
              <!-- Meta Information -->
              <tr>
                <td>
                  <h3 style="color: #074a5b; font-size: 16px; margin: 0 0 10px;">Meta Information</h3>
                  <table width="100%" cellpadding="5" style="font-size: 14px; color: #333333;">
                    <tr><td><strong>Entity ID:</strong></td><td>${entity.$oid}</td></tr>
                    <tr><td><strong>Inquiry Type:</strong></td><td>${buttonType === 'bookNow' ? 'Email' : 'WhatsApp'}</td></tr>
                    <tr><td><strong>Submitted At:</strong></td><td>${submitted_at.toISOString()}</td></tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #666666;">
            <p style="margin: 0;">Automated notification from Traveliccted Admin System</p>
            <p style="margin: 5px 0;">© 2025 Traveliccted. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return { html, text: plainText };
};

// Function to generate user confirmation email template
const generateUserConfirmationTemplate = (data) => {
  const { entityType, entityTitle, resortName, roomName, name, email, phone_number, message, entity, from_date, to_date, adults, children, infants, country, submitted_at } = data;
  
  const plainText = `
Dear ${name},

We have received your booking details for ${entityType}: ${entityTitle}

${entityType === 'Accommodation' ? `Resort: ${resortName}\nRoom: ${roomName}` : ''}
Name: ${name}
Email: ${email}
Phone: ${phone_number || 'N/A'}
Message: ${message || 'N/A'}
${entityType} ID: ${entity.$oid}
From Date: ${from_date ? new Date(from_date).toLocaleDateString() : 'N/A'}
To Date: ${to_date ? new Date(to_date).toLocaleDateString() : 'N/A'}
Adults (12+): ${adults ?? 'N/A'}
Children (2-11): ${children ?? 'N/A'}
Infants (below 2): ${infants ?? 'N/A'}
Country: ${country || 'N/A'}
Submitted At: ${submitted_at.toISOString()}

We will get back to you as soon as possible.

Best regards,
Traveliccted Team
  `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmation - ${entityType}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Helvetica, Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e0e0e0;">
        <!-- Header -->
        <tr>
          <td style="background-color: #074a5b; color: #ffffff; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 26px; font-weight: bold;">Traveliccted</h1>
            <p style="margin: 5px 0; font-size: 14px; color: #a1d6e2;">Your Travel Dreams, Our Passion</p>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding: 20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <!-- Confirmation Banner -->
              <tr>
                <td style="background-color: #e6f4ea; padding: 15px; border-left: 4px solid #4caf50;">
                  <h2 style="color: #4caf50; font-size: 18px; margin: 0 0 5px; font-weight: bold;">Booking Received!</h2>
                  <p style="margin: 0; font-size: 14px; color: #333333;">We have received your booking details.</p>
                </td>
              </tr>
              <!-- Spacer -->
              <tr><td style="height: 20px;"></td></tr>
              <!-- Greeting -->
              <tr>
                <td>
                  <h2 style="color: #074a5b; font-size: 18px; margin: 0 0 10px;">Dear ${name},</h2>
                  <p style="font-size: 14px; color: #333333; margin: 0;">Thank you for choosing Traveliccted! Your booking request has been successfully received.</p>
                </td>
              </tr>
              <!-- Spacer -->
              <tr><td style="height: 20px;"></td></tr>
              <!-- Booking Details -->
              <tr>
                <td style="background-color: #1e809b; color: #ffffff; padding: 15px;">
                  <h3 style="font-size: 16px; margin: 0 0 10px; font-weight: bold;">Booking Details: ${entityTitle}</h3>
                  <table width="100%" cellpadding="5" style="font-size: 14px;">
                    <tr><td><strong>Type:</strong></td><td>${entityType}</td></tr>
                    ${entityType === 'Accommodation' ? `
                      <tr><td><strong>Resort:</strong></td><td>${resortName}</td></tr>
                      <tr><td><strong>Room:</strong></td><td>${roomName}</td></tr>
                    ` : ''}
                  </table>
                </td>
              </tr>
              <!-- Spacer -->
              <tr><td style="height: 20px;"></td></tr>
              <!-- Your Information -->
              <tr>
                <td>
                  <h3 style="color: #074a5b; font-size: 16px; margin: 0 0 10px;">Your Information</h3>
                  <table width="100%" cellpadding="5" style="font-size: 14px; color: #333333;">
                    <tr><td><strong>Name:</strong></td><td>${name}</td></tr>
                    <tr><td><strong>Email:</strong></td><td>${email}</td></tr>
                    <tr><td><strong>Phone:</strong></td><td>${phone_number || 'N/A'}</td></tr>
                    <tr><td><strong>Country:</strong></td><td>${country || 'N/A'}</td></tr>
                  </table>
                </td>
              </tr>
              <!-- Spacer -->
              <tr><td style="height: 20px;"></td></tr>
              <!-- Travel Details -->
              <tr>
                <td>
                  <h3 style="color: #074a5b; font-size: 16px; margin: 0 0 10px;">Travel Details</h3>
                  <table width="100%" cellpadding="5" style="font-size: 14px; color: #333333;">
                    <tr><td><strong>From Date:</strong></td><td>${from_date ? new Date(from_date).toLocaleDateString() : 'N/A'}</td></tr>
                    <tr><td><strong>To Date:</strong></td><td>${to_date ? new Date(to_date).toLocaleDateString() : 'N/A'}</td></tr>
                    <tr><td><strong>Adults (12+):</strong></td><td>${adults ?? 'N/A'}</td></tr>
                    <tr><td><strong>Children (2-11):</strong></td><td>${children ?? 'N/A'}</td></tr>
                    <tr><td><strong>Infants (below 2):</strong></td><td>${infants ?? 'N/A'}</td></tr>
                  </table>
                </td>
              </tr>
              ${message ? `
                <!-- Spacer -->
                <tr><td style="height: 20px;"></td></tr>
                <!-- Message -->
                <tr>
                  <td>
                    <h3 style="color: #074a5b; font-size: 16px; margin: 0 0 10px;">Your Message</h3>
                    <p style="font-size: 14px; color: #333333; background-color: #f9f9f9; padding: 10px; border-left: 4px solid #1e809b; margin: 0;">${message}</p>
                  </td>
                </tr>
              ` : ''}
              <!-- Spacer -->
              <tr><td style="height: 20px;"></td></tr>
              <!-- What's Next -->
              <tr>
                <td>
                  <h3 style="color: #074a5b; font-size: 16px; margin: 0 0 10px;">What's Next?</h3>
                  <p style="font-size: 14px; color: #333333; margin: 0;">Our travel experts will review your request within 24 hours and contact you with a personalized itinerary.</p>
                </td>
              </tr>
              <!-- Spacer -->
              <tr><td style="height: 20px;"></td></tr>
              
              <!-- Spacer -->
              <tr><td style="height: 20px;"></td></tr>
              <!-- Booking ID -->
              <tr>
                <td style="text-align: center;">
                  <p style="font-size: 12px; color: #666666; margin: 0;"><strong>Booking ID:</strong> ${entity.$oid} | <strong>Submitted:</strong> ${submitted_at.toISOString()}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #666666;">
            <p style="margin: 0; font-weight: bold;">Traveliccted</p>
            <p style="margin: 5px 0;">Follow us: <a href="#" style="color: #1e809b; text-decoration: none;">Facebook</a> | <a href="#" style="color: #1e809b; text-decoration: none;">Twitter</a> | <a href="#" style="color: #1e809b; text-decoration: none;">Instagram</a></p>
            <p style="margin: 5px 0;">© 2025 Traveliccted. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return { html, text: plainText };
};

// Function to generate contact confirmation email template
const generateContactConfirmationTemplate = (data) => {
  const { name, email, message, submitted_at } = data;
  
  const plainText = `
Dear ${name},

We have received your inquiry.

Name: ${name}
Email: ${email}
Message: ${message}
Submitted At: ${submitted_at.toISOString()}

We will get back to you as soon as possible.

Best regards,
Traveliccted Team
  `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Contact Inquiry Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Helvetica, Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e0e0e0;">
        <!-- Header -->
        <tr>
          <td style="background-color: #074a5b; color: #ffffff; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 26px; font-weight: bold;">Traveliccted</h1>
            <p style="margin: 5px 0; font-size: 14px; color: #a1d6e2;">Thank you for contacting us!</p>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding: 20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <!-- Confirmation Banner -->
              <tr>
                <td style="background-color: #e6f4ea; padding: 15px; border-left: 4px solid #4caf50;">
                  <h2 style="color: #4caf50; font-size: 18px; margin: 0 0 5px; font-weight: bold;">Message Received!</h2>
                  <p style="margin: 0; font-size: 14px; color: #333333;">We have received your inquiry.</p>
                </td>
              </tr>
              <!-- Spacer -->
              <tr><td style="height: 20px;"></td></tr>
              <!-- Greeting -->
              <tr>
                <td>
                  <h2 style="color: #074a5b; font-size: 18px; margin: 0 0 10px;">Dear ${name},</h2>
                  <p style="font-size: 14px; color: #333333; margin: 0;">Thank you for reaching out to Traveliccted! We will respond to your inquiry as soon as possible.</p>
                </td>
              </tr>
              <!-- Spacer -->
              <tr><td style="height: 20px;"></td></tr>
              <!-- Inquiry Details -->
              <tr>
                <td style="background-color: #1e809b; color: #ffffff; padding: 15px;">
                  <h3 style="font-size: 16px; margin: 0 0 10px; font-weight: bold;">Your Inquiry Details</h3>
                  <table width="100%" cellpadding="5" style="font-size: 14px;">
                    <tr><td><strong>Name:</strong></td><td>${name}</td></tr>
                    <tr><td><strong>Email:</strong></td><td>${email}</td></tr>
                    <tr><td><strong>Message:</strong></td><td style="background-color: #f9f9f9; color: #333333; padding: 10px; border-left: 4px solid #074a5b;">${message}</td></tr>
                  </table>
                </td>
              </tr>
              <!-- Spacer -->
              <tr><td style="height: 20px;"></td></tr>
              <!-- What to Expect -->
              <tr>
                <td>
                  <h3 style="color: #074a5b; font-size: 16px; margin: 0 0 10px;">What to Expect</h3>
                  <p style="font-size: 14px; color: #333333; margin: 0;">Our team typically responds within 24 hours with a personalized reply to your inquiry.</p>
                </td>
              </tr>
              <!-- Spacer -->
              <tr><td style="height: 20px;"></td></tr>
             
              <!-- Spacer -->
              <tr><td style="height: 20px;"></td></tr>
              <!-- Submission Time -->
              <tr>
                <td style="text-align: center;">
                  <p style="font-size: 12px; color: #666666; margin: 0;"><strong>Submitted:</strong> ${submitted_at.toISOString()}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #666666;">
            <p style="margin: 0; font-weight: bold;">Traveliccted</p>
            <p style="margin: 5px 0;">Follow us: <a href="#" style="color: #1e809b; text-decoration: none;">Facebook</a> | <a href="#" style="color: #1e809b; text-decoration: none;">Twitter</a> | <a href="#" style="color: #1e809b; text-decoration: none;">Instagram</a></p>
            <p style="margin: 5px 0;">© 2025 Traveliccted. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return { html, text: plainText };
};

// Function to generate admin contact email template
const generateAdminContactEmailTemplate = (data) => {
  const { name, email, message, submitted_at } = data;
  
  const plainText = `
New Contact Inquiry
Name: ${name}
Email: ${email}
Message: ${message}
Inquiry Type: Email
Submitted At: ${submitted_at.toISOString()}
  `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Contact Inquiry</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Helvetica, Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e0e0e0;">
        <!-- Header -->
        <tr>
          <td style="background-color: #074a5b; color: #ffffff; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 26px; font-weight: bold;">Traveliccted</h1>
            <p style="margin: 5px 0; font-size: 14px; color: #a1d6e2;">New Contact Inquiry Notification</p>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding: 20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <!-- Inquiry Highlight -->
              <tr>
                <td style="background-color: #e6f4ea; padding: 15px; border-left: 4px solid #4caf50;">
                  <h2 style="color: #4caf50; font-size: 18px; margin: 0 0 5px; font-weight: bold;">Contact Inquiry Received!</h2>
                  <p style="margin: 0; font-size: 14px; color: #333333;">A new contact inquiry has been submitted.</p>
                </td>
              </tr>
              <!-- Spacer -->
              <tr><td style="height: 20px;"></td></tr>
              <!-- Inquiry Details -->
              <tr>
                <td>
                  <h3 style="color: #074a5b; font-size: 16px; margin: 0 0 10px;">Inquiry Details</h3>
                  <table width="100%" cellpadding="5" style="font-size: 14px; color: #333333;">
                    <tr><td><strong>Name:</strong></td><td>${name}</td></tr>
                    <tr><td><strong>Email:</strong></td><td><a href="mailto:${email}" style="color: #1e809b; text-decoration: none;">${email}</a></td></tr>
                  </table>
                </td>
              </tr>
              <!-- Spacer -->
              <tr><td style="height: 20px;"></td></tr>
              <!-- Message -->
              <tr>
                <td>
                  <h3 style="color: #074a5b; font-size: 16px; margin: 0 0 10px;">Customer Message</h3>
                  <p style="font-size: 14px; color: #333333; background-color: #f9f9f9; padding: 10px; border-left: 4px solid #1e809b; margin: 0;">${message}</p>
                </td>
              </tr>
              <!-- Spacer -->
              <tr><td style="height: 20px;"></td></tr>
              <!-- Meta Information -->
              <tr>
                <td>
                  <h3 style="color: #074a5b; font-size: 16px; margin: 0 0 10px;">Meta Information</h3>
                  <table width="100%" cellpadding="5" style="font-size: 14px; color: #333333;">
                    <tr><td><strong>Inquiry Type:</strong></td><td>Email</td></tr>
                    <tr><td><strong>Submitted At:</strong></td><td>${submitted_at.toISOString()}</td></tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #666666;">
            <p style="margin: 0;">Automated notification from Traveliccted Admin System</p>
            <p style="margin: 5px 0;">© 2025 Traveliccted. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return { html, text: plainText };
};

// Updated function to generate reply email template with inquiry details
const generateReplyEmailTemplate = (data) => {
  const { name, email, subject, message, inquiry } = data;
  
  const plainText = `
Dear ${name},

Subject: ${subject}

${message}

---

Original Inquiry Details:
${inquiry.entityType === 'Contact' ? '' : `Type: ${inquiry.entityType}\n`}
${inquiry.entityType !== 'Contact' ? `Title: ${inquiry.title || 'N/A'}\n` : ''}
${inquiry.entityType === 'Accommodation' ? `Resort: ${inquiry.resortName || 'N/A'}\nRoom: ${inquiry.roomName || 'N/A'}\n` : ''}
Name: ${inquiry.name}
Email: ${inquiry.email}
${inquiry.entityType !== 'Contact' ? `Phone: ${inquiry.phone_number || 'N/A'}\nCountry: ${inquiry.country || 'N/A'}\n` : ''}
${inquiry.entityType !== 'Contact' ? `Travellers: ${inquiry.travellers || 'N/A'}\n` : ''}
${inquiry.entityType !== 'Contact' ? `Children Ages: ${inquiry.children?.length > 0 ? inquiry.children.join(', ') : 'None'}\n` : ''}
${inquiry.entityType !== 'Contact' ? `From Date: ${inquiry.from_date ? new Date(inquiry.from_date).toLocaleDateString() : 'N/A'}\n` : ''}
${inquiry.entityType !== 'Contact' ? `To Date: ${inquiry.to_date ? new Date(inquiry.to_date).toLocaleDateString() : 'N/A'}\n` : ''}
Message: ${inquiry.message || 'N/A'}
Submitted At: ${inquiry.submitted_at.toISOString()}

Best regards,
Traveliccted Team
  `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Helvetica, Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e0e0e0;">
        <!-- Header -->
        <tr>
          <td style="background-color: #074a5b; color: #ffffff; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 26px; font-weight: bold;">Traveliccted</h1>
            <p style="margin: 5px 0; font-size: 14px; color: #a1d6e2;">Your Travel Dreams, Our Passion</p>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding: 20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <!-- Greeting -->
              <tr>
                <td>
                  <h2 style="color: #074a5b; font-size: 18px; margin: 0 0 10px;">Dear ${name},</h2>
                  <p style="font-size: 14px; color: #333333; margin: 0;">Thank you for your inquiry. Here is our response:</p>
                </td>
              </tr>
              <!-- Spacer -->
              <tr><td style="height: 20px;"></td></tr>
              <!-- Reply Details -->
              <tr>
                <td>
                  <h3 style="color: #074a5b; font-size: 16px; margin: 0 0 10px;">Our Reply</h3>
                  <table width="100%" cellpadding="5" style="font-size: 14px; color: #333333;">
                    <tr><td><strong>Subject:</strong></td><td>${subject}</td></tr>
                    <tr><td><strong>Message:</strong></td><td style="background-color: #f9f9f9; padding: 10px; border-left: 4px solid #1e809b;">${message}</td></tr>
                  </table>
                </td>
              </tr>
              <!-- Spacer -->
              <tr><td style="height: 20px;"></td></tr>
              <!-- Original Inquiry Details -->
              <tr>
                <td>
                  <h3 style="color: #074a5b; font-size: 16px; margin: 0 0 10px;">Your Original Inquiry</h3>
                  <table width="100%" cellpadding="5" style="font-size: 14px; color: #333333;">
                    ${inquiry.entityType !== 'Contact' ? `
                      <tr><td><strong>Type:</strong></td><td>${inquiry.entityType}</td></tr>
                      <tr><td><strong>Title:</strong></td><td>${inquiry.title || 'N/A'}</td></tr>
                    ` : ''}
                    ${inquiry.entityType === 'Accommodation' ? `
                      <tr><td><strong>Resort:</strong></td><td>${inquiry.resortName || 'N/A'}</td></tr>
                      <tr><td><strong>Room:</strong></td><td>${inquiry.roomName || 'N/A'}</td></tr>
                    ` : ''}
                    <tr><td><strong>Name:</strong></td><td>${inquiry.name}</td></tr>
                    <tr><td><strong>Email:</strong></td><td>${inquiry.email}</td></tr>
                    ${inquiry.entityType !== 'Contact' ? `
                      <tr><td><strong>Phone:</strong></td><td>${inquiry.phone_number || 'N/A'}</td></tr>
                      <tr><td><strong>Country:</strong></td><td>${inquiry.country || 'N/A'}</td></tr>
                      <tr><td><strong>Travellers:</strong></td><td>${inquiry.travellers || 'N/A'}</td></tr>
                      <tr><td><strong>Children Ages:</strong></td><td>${inquiry.children?.length > 0 ? inquiry.children.join(', ') : 'None'}</td></tr>
                      <tr><td><strong>From Date:</strong></td><td>${inquiry.from_date ? new Date(inquiry.from_date).toLocaleDateString() : 'N/A'}</td></tr>
                      <tr><td><strong>To Date:</strong></td><td>${inquiry.to_date ? new Date(inquiry.to_date).toLocaleDateString() : 'N/A'}</td></tr>
                    ` : ''}
                    <tr><td><strong>Message:</strong></td><td style="background-color: #f9f9f9; padding: 10px; border-left: 4px solid #074a5b;">${inquiry.message || 'N/A'}</td></tr>
                    <tr><td><strong>Submitted At:</strong></td><td>${inquiry.submitted_at.toISOString()}</td></tr>
                  </table>
                </td>
              </tr>
              <!-- Spacer -->
              <tr><td style="height: 20px;"></td></tr>
              <!-- Footer Note -->
              <tr>
                <td>
                  <p style="font-size: 14px; color: #333333; margin: 0;">Best regards,<br>Traveliccted Team</p>
                </td>
              </tr>
              <!-- Spacer -->
              <tr><td style="height: 20px;"></td></tr>
              <!-- Submission Time -->
              <tr>
                <td style="text-align: center;">
                  <p style="font-size: 12px; color: #666666; margin: 0;"><strong>Replied At:</strong> ${new Date().toISOString()}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #666666;">
            <p style="margin: 0; font-weight: bold;">Traveliccted</p>
            <p style="margin: 5px 0;">Follow us: <a href="#" style="color: #1e809b; text-decoration: none;">Facebook</a> | <a href="#" style="color: #1e809b; text-decoration: none;">Twitter</a> | <a href="#" style="color: #1e809b; text-decoration: none;">Instagram</a></p>
            <p style="margin: 5px 0;">© 2025 Traveliccted. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return { html, text: plainText };
};

router.post('/', async (req, res) => {
  try {
    console.log('Received inquiry payload:', req.body);

    const {
      name,
      email,
      phone_number,
      message,
      entity,
      entityType,
      from_date,
      to_date,
      adults,
      children,
      infants,
      country,
      buttonType,
      title,
      resortName,
      roomName,
    } = req.body;

    if (!name || !email || !entityType || !buttonType || !title || !entity || !entity.$oid) {
      return res.status(400).json({ error: 'Missing required fields or invalid entity format' });
    }

    if (entityType !== 'Custom' && entityType !== 'Accommodation' && !mongoose.isValidObjectId(entity.$oid)) {
      return res.status(400).json({ error: 'Invalid entity ID for non-custom/non-accommodation inquiry' });
    }

    if (entityType === 'Accommodation' && (!resortName || !roomName)) {
      return res.status(400).json({ error: 'resortName and roomName are required for Accommodation inquiries' });
    }

    const inquiryData = {
      name,
      email,
      phone_number,
      message,
      entity: { $oid: entity.$oid },
      entityType,
      from_date: from_date ? new Date(from_date) : undefined,
      to_date: to_date ? new Date(to_date) : undefined,
      adults: adults ?? 1,
      children: children ?? 0,
      infants: infants ?? 0,
      country,
      buttonType,
      title,
      resortName: entityType === 'Accommodation' ? resortName : undefined,
      roomName: entityType === 'Accommodation' ? roomName : undefined,
    };

    const inquiry = new Inquiry(inquiryData);
    await inquiry.save();
    console.log('Inquiry saved to database:', inquiry._id);

    let entityTitle = title;
    if (entityType === 'Package') {
      const entityDoc = await Package.findById(entity.$oid).select('title name');
      entityTitle = entityDoc?.title || entityDoc?.name || title;
    } else if (entityType === 'Activity') {
      const entityDoc = await Activity.findById(entity.$oid).select('title name');
      entityTitle = entityDoc?.title || entityDoc?.name || title;
    } else if (entityType === 'Accommodation') {
      const entityDoc = await Resort.findById(entity.$oid).select('name');
      entityTitle = `${entityDoc?.name || resortName} - ${roomName}`;
    }

    const emailData = {
      entityType,
      entityTitle,
      resortName,
      roomName,
      name,
      email,
      phone_number,
      message,
      entity,
      from_date,
      to_date,
      adults: inquiry.adults,
      children: inquiry.children,
      infants: inquiry.infants,
      country,
      buttonType,
      submitted_at: inquiry.submitted_at
    };

    // Admin notification message (for WhatsApp)
    const adminNotificationMessage = `
      New Inquiry for ${entityType}: ${entityTitle}
      ${entityType === 'Accommodation' ? `Resort: ${resortName}\nRoom: ${roomName}` : ' '}
      Name: ${name}
      Email: ${email}
      Phone: ${phone_number || 'N/A'}
      Message: ${message || 'N/A'}
      ${entityType} ID: ${entity.$oid}
      From Date: ${from_date ? new Date(from_date).toLocaleDateString() : 'N/A'}
      To Date: ${to_date ? new Date(to_date).toLocaleDateString() : 'N/A'}
      Adults (12+): ${inquiry.adults ?? 'N/A'}
      Children (2-11): ${inquiry.children ?? 'N/A'}
      Infants (below 2): ${inquiry.infants ?? 'N/A'}
      Country: ${country || 'N/A'}
      Inquiry Type: ${buttonType === 'bookNow' ? 'Email' : 'WhatsApp'}
      Submitted At: ${inquiry.submitted_at.toISOString()}
    `;

    // Send admin notification
    if (buttonType === 'bookNow') {
      const adminEmail = generateAdminEmailTemplate(emailData);
      const adminMailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.SMTP_USER,
        subject: `New Inquiry for ${entityType}: ${entityTitle}`,
        html: adminEmail.html,
        text: adminEmail.text,
      };
      await transporter.sendMail(adminMailOptions);
      console.log('Admin email sent successfully');
    } else if (buttonType === 'whatsapp') {
      const message = await twilioClient.messages.create({
        body: adminNotificationMessage,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${process.env.ADMIN_WHATSAPP_NUMBER}`,
      });
      console.log('WhatsApp message sent:', message.sid);
    }

    // User confirmation email
    const userEmail = generateUserConfirmationTemplate(emailData);
    const userMailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: `Booking Confirmation: ${entityType} - ${entityTitle}`,
      html: userEmail.html,
      text: userEmail.text,
    };
    await transporter.sendMail(userMailOptions);
    console.log('User confirmation email sent successfully');

    res.status(201).json(inquiry);
  } catch (err) {
    console.error('Error processing inquiry:', err);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

// GET / route 
router.get('/', async (req, res) => {
  try {
    let inquiries = await Inquiry.find().sort({ submitted_at: -1 });
    inquiries = inquiries.map((inq) => {
      const obj = inq.toObject ? inq.toObject() : inq;
      obj.adults = typeof obj.adults === 'number' ? obj.adults : (obj.adults ? Number(obj.adults) : 1);
      obj.children = typeof obj.children === 'number' ? obj.children : (obj.children ? Number(obj.children) : 0);
      obj.infants = typeof obj.infants === 'number' ? obj.infants : (obj.infants ? Number(obj.infants) : 0);
      return obj;
    });
    res.json(inquiries);
  } catch (err) {
    console.error('Error fetching inquiries:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

//GET /:id route 
router.get('/:id', async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ msg: 'Inquiry not found' });
    res.json(inquiry);
  } catch (err) {
    console.error('Error fetching inquiry:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE /:id route
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string' || !/^[a-fA-F0-9]{24}$/.test(id)) {
    console.error('Delete inquiry error: Invalid inquiry id', id);
    return res.status(400).json({ msg: 'Invalid inquiry id' });
  }
  try {
    const inquiry = await Inquiry.findByIdAndDelete(id);
    if (!inquiry) return res.status(404).json({ msg: 'Inquiry not found' });
    res.json({ msg: 'Inquiry deleted' });
  } catch (err) {
    console.error('Error deleting inquiry:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Updated POST /contact route
router.post('/contact', async (req, res) => {
  try {
    console.log('Received contact inquiry payload:', req.body);

    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields: name, email, message' });
    }

    // Create inquiry data for contact type
    const inquiryData = {
      name,
      email,
      message,
      entity: { $oid: '000000000000000000000000' }, // Fixed ObjectId for contact inquiries
      entityType: 'Contact',
      buttonType: 'bookNow', 
      title: 'Contact Inquiry',
    };

    // Save to database
    const inquiry = new Inquiry(inquiryData);
    await inquiry.save();
    console.log('Contact inquiry saved to database:', inquiry._id);

    // Admin notification message
    const adminNotificationMessage = `
      New Contact Inquiry
      Name: ${name}
      Email: ${email}
      Message: ${message}
      Inquiry Type: Email
      Submitted At: ${inquiry.submitted_at.toISOString()}
    `;

    // Send admin email
    const adminEmailData = {
      name,
      email,
      message,
      submitted_at: inquiry.submitted_at
    };

    const adminEmail = generateAdminContactEmailTemplate(adminEmailData);
    const adminMailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER,
      subject: 'New Contact Inquiry',
      html: adminEmail.html,
      text: adminEmail.text,
    };
    await transporter.sendMail(adminMailOptions);
    console.log('Admin contact inquiry email sent successfully');

    // User confirmation email
    const userEmail = generateContactConfirmationTemplate(adminEmailData);
    const userMailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Inquiry Confirmation: Contact Inquiry',
      html: userEmail.html,
      text: userEmail.text,
    };
    await transporter.sendMail(userMailOptions);
    console.log('User confirmation email sent successfully');

    res.status(201).json(inquiry);
  } catch (err) {
    console.error('Error processing contact inquiry:', err);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

//  POST /reply route to include inquiry details
router.post('/reply', async (req, res) => {
  try {
    const { inquiryId, subject, message } = req.body;

    if (!inquiryId || !subject || !message) {
      return res.status(400).json({ error: 'Missing required fields: inquiryId, subject, message' });
    }

    // Find inquiry
    const inquiry = await Inquiry.findById(inquiryId);
    if (!inquiry) {
      return res.status(404).json({ msg: 'Inquiry not found' });
    }

    // Send reply email with inquiry details
    const replyEmailData = {
      name: inquiry.name,
      email: inquiry.email,
      subject,
      message,
      inquiry: {
        entityType: inquiry.entityType,
        title: inquiry.title,
        resortName: inquiry.resortName,
        roomName: inquiry.roomName,
        name: inquiry.name,
        email: inquiry.email,
        phone_number: inquiry.phone_number,
        country: inquiry.country,
        travellers: inquiry.travellers,
        children: inquiry.children,
        from_date: inquiry.from_date,
        to_date: inquiry.to_date,
        message: inquiry.message,
        submitted_at: inquiry.submitted_at
      }
    };

    const replyEmail = generateReplyEmailTemplate(replyEmailData);
    const replyMailOptions = {
      from: process.env.SMTP_USER,
      to: inquiry.email,
      subject,
      html: replyEmail.html,
      text: replyEmail.text,
    };
    await transporter.sendMail(replyMailOptions);
    console.log('Reply email sent successfully to:', inquiry.email);

    // Save reply message to inquiry
    inquiry.replyMessage = message;
    await inquiry.save();
    console.log('Reply message saved to inquiry:', inquiry._id);

    res.status(200).json({ msg: 'Reply sent and saved successfully' });
  } catch (err) {
    console.error('Error processing reply:', err);
    res.status(500).json({ msg: 'Server error', details: err.message });
  }
});

module.exports = router;
