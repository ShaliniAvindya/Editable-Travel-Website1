const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Inquiry = require('../models/Inquiry');
const Package = require('../models/Package');
const Activity = require('../models/Activity');
const Resort = require('../models/Resort');
const Newsletter = require('../models/Newsletter');
const List = require('../models/List');
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

async function sendMailSafe(mailOptions) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('SMTP not configured - skipping email send to', mailOptions && mailOptions.to);
    return null;
  }
  try {
    return await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Failed to send email:', err);
    return null;
  }
}

async function sendWhatsAppSafe(body) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_WHATSAPP_NUMBER || !process.env.ADMIN_WHATSAPP_NUMBER) {
    console.warn('Twilio/WhatsApp not configured - skipping WhatsApp message');
    return null;
  }
  try {
    return await twilioClient.messages.create({
      body,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${process.env.ADMIN_WHATSAPP_NUMBER}`,
    });
  } catch (err) {
    console.error('Failed to send WhatsApp message:', err);
    return null;
  }
}

// Helpers to conditionally include fields only when they have meaningful values
function isFilled(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  return true; 
}

function plainIf(label, value) {
  if (!isFilled(value)) return '';
  if (Array.isArray(value)) return `${label}: ${value.join(', ')}\n`;
  return `${label}: ${value}\n`;
}

function htmlRowIf(label, value) {
  if (!isFilled(value)) return '';
  const display = Array.isArray(value) ? value.join(', ') : value;
  return `<tr><td><strong>${label}:</strong></td><td>${display}</td></tr>`;
}

// Function to generate admin email template
const generateAdminEmailTemplate = (data) => {
  const { entityType, entityTitle, resortName, roomName, name, email, phone_number, message, entity, from_date, to_date, adults, children, infants, country, buttonType, submitted_at, travellers, number_of_rooms, selectedActivities, preferredMonth, preferredYear, adventureOption, adventureOptions, participants, participantsByOption, bookWholeBoat, divers_adults, divers_children, nondivers_adults, nondivers_children, nondivers_infants } = data;
  
  const plainText = `
    New Inquiry: ${entityTitle}
    ${entityType === 'Accommodation' ? `Resort: ${resortName}\n${isFilled(roomName) ? `Room: ${roomName}` : ''}` : ''}
    Name: ${name}
    Email: ${email}
    Phone: ${phone_number}
    Message: ${message}
    Entity ID: ${entity.$oid}
    From Date: ${from_date}
    To Date: ${to_date }
    Adults (12+): ${adults}
    Children (2-11): ${children }
    Infants (below 2): ${infants}
    Country: ${country}
    Inquiry Type: ${buttonType === 'bookNow' ? 'Email' : 'WhatsApp'}
    Submitted At: ${submitted_at.toISOString()}
      `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Inquiry</title>
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
                  <h2 style="margin: 0; font-size: 18px; font-weight: bold;">${entityTitle}</h2>
                  ${entityType === 'Accommodation' ? `
                    <p style="margin: 5px 0; font-size: 14px;"><strong>Resort:</strong> ${resortName}</p>
                    ${isFilled(roomName) ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Room:</strong> ${roomName}</p>` : ''}
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
                    ${htmlRowIf('Name', name)}
                    ${isFilled(email) ? `<tr><td><strong>Email:</strong></td><td><a href="mailto:${email}" style="color: #1e809b; text-decoration: none;">${email}</a></td></tr>` : ''}
                    ${htmlRowIf('Phone', phone_number)}
                    ${htmlRowIf('Country', country)}
                    ${htmlRowIf('Travellers', travellers)}
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
                      ${isFilled(from_date) ? `<tr><td><strong>From Date:</strong></td><td>${new Date(from_date).toLocaleDateString()}</td></tr>` : ''}
                    ${isFilled(to_date) ? `<tr><td><strong>To Date:</strong></td><td>${new Date(to_date).toLocaleDateString()}</td></tr>` : ''}
                    ${htmlRowIf('Adults (12+)', adults)}
                    ${htmlRowIf('Children (2-11)', children)}
                    ${htmlRowIf('Infants (below 2)', infants)}
                    ${htmlRowIf('Travellers', travellers)}
                    ${htmlRowIf('Number of rooms', number_of_rooms)}
                    ${isFilled(selectedActivities) ? htmlRowIf('Selected Activities', Array.isArray(selectedActivities) ? selectedActivities : [selectedActivities]) : ''}
                    ${(isFilled(preferredMonth) || isFilled(preferredYear)) ? htmlRowIf('Preferred Month/Year', `${preferredMonth || ''} ${preferredYear || ''}`) : ''}
                                    ${isFilled(adventureOptions) ? htmlRowIf('Adventure Options', Array.isArray(adventureOptions) ? adventureOptions : [adventureOptions]) : ''}
                                    ${bookWholeBoat ? htmlRowIf('Book Whole Boat', 'Yes') : ''}
                                    ${isFilled(participantsByOption) ? htmlRowIf('Participants by Option', participantsByOption.map(o => `${o.option}: ${ (o.participants || []).map(p=>p.name||'').join(', ') }`)) : (isFilled(participants) ? htmlRowIf('Participants', participants.map(p => p.name || '')) : '')}
                    ${htmlRowIf('Divers Adults', divers_adults)}
                    ${htmlRowIf('Divers Children', divers_children)}
                    ${htmlRowIf('Non-Divers Adults', nondivers_adults)}
                    ${htmlRowIf('Non-Divers Children', nondivers_children)}
                    ${htmlRowIf('Non-Divers Infants', nondivers_infants)}
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
  const { entityType, entityTitle, resortName, roomName, name, email, phone_number, message, entity, from_date, to_date, adults, children, infants, country, submitted_at, travellers, number_of_rooms, selectedActivities, preferredMonth, preferredYear, adventureOption, adventureOptions, participants, participantsByOption, bookWholeBoat, divers_adults, divers_children, nondivers_adults, nondivers_children, nondivers_infants } = data;
  let plainText = `Dear ${name},\n\nWe have received your booking details for ${entityTitle}\n\n`;
  if (entityType === 'Accommodation') plainText += `Resort: ${resortName}\n${isFilled(roomName) ? `Room: ${roomName}\n` : ''}`;
    plainText += plainIf('Name', name);
    plainText += plainIf('Email', email);
    plainText += plainIf('Phone', phone_number);
    plainText += plainIf('Message', message);
  plainText += plainIf('Entity ID', entity.$oid);
    plainText += isFilled(from_date) ? plainIf('From Date', new Date(from_date).toLocaleDateString()) : '';
    plainText += isFilled(to_date) ? plainIf('To Date', new Date(to_date).toLocaleDateString()) : '';
    plainText += plainIf('Adults (12+)', adults);
    plainText += plainIf('Children (2-11)', children);
    plainText += plainIf('Infants (below 2)', infants);
    plainText += plainIf('Travellers', travellers);
    plainText += plainIf('Number of rooms', number_of_rooms);
    plainText += isFilled(selectedActivities) ? plainIf('Selected Activities', Array.isArray(selectedActivities) ? selectedActivities.join(', ') : selectedActivities) : '';
    if (isFilled(preferredMonth) || isFilled(preferredYear)) plainText += plainIf('Preferred Month/Year', `${preferredMonth || ''} ${preferredYear || ''}`);
    if (isFilled(adventureOptions)) plainText += plainIf('Adventure Options', Array.isArray(adventureOptions) ? adventureOptions.join(', ') : adventureOptions);
    if (bookWholeBoat) plainText += plainIf('Book whole boat', 'Yes');
    if (isFilled(participantsByOption)) {
      const lines = participantsByOption.map(o => `${o.option}: ${(o.participants||[]).map(p=>p.name||'').join(', ')}`);
      plainText += plainIf('Participants by Option', lines.join(' | '));
    } else {
      plainText += isFilled(participants) ? plainIf('Participants', participants.map(p=>p.name||'').join(', ')) : '';
    }
    plainText += plainIf('Divers Adults', divers_adults);
    plainText += plainIf('Divers Children', divers_children);
    plainText += plainIf('Non-Divers Adults', nondivers_adults);
    plainText += plainIf('Non-Divers Children', nondivers_children);
    plainText += plainIf('Non-Divers Infants', nondivers_infants);
    plainText += plainIf('Country', country);
    plainText += plainIf('Submitted At', submitted_at ? submitted_at.toISOString() : '');

    plainText += `\nWe will get back to you as soon as possible.\n\nBest regards,\nTraveliccted Team\n`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
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
                    ${entityType === 'Accommodation' ? `
                      <tr><td><strong>Resort:</strong></td><td>${resortName}</td></tr>
                      ${isFilled(roomName) ? `<tr><td><strong>Room:</strong></td><td>${roomName}</td></tr>` : ''}
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
                    ${htmlRowIf('Name', name)}
                    ${isFilled(email) ? `<tr><td><strong>Email:</strong></td><td>${email}</td></tr>` : ''}
                    ${htmlRowIf('Phone', phone_number)}
                    ${htmlRowIf('Country', country)}
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
                    ${isFilled(from_date) ? `<tr><td><strong>From Date:</strong></td><td>${new Date(from_date).toLocaleDateString()}</td></tr>` : ''}
                    ${isFilled(to_date) ? `<tr><td><strong>To Date:</strong></td><td>${new Date(to_date).toLocaleDateString()}</td></tr>` : ''}
                    ${htmlRowIf('Adults (12+)', adults)}
                    ${htmlRowIf('Children (2-11)', children)}
                    ${htmlRowIf('Infants (below 2)', infants)}
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
                    ${htmlRowIf('Name', name)}
                    ${isFilled(email) ? `<tr><td><strong>Email:</strong></td><td><a href="mailto:${email}" style="color: #1e809b; text-decoration: none;">${email}</a></td></tr>` : ''}
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

  let plainText = `Dear ${name},\n\nSubject: ${subject}\n\n${message}\n\n---\n\nOriginal Inquiry Details:\n`;
  // Type intentionally not displayed per request
  if (isFilled(inquiry.title)) plainText += plainIf('Title', inquiry.title);
  if (inquiry.entityType === 'Accommodation') {
    if (isFilled(inquiry.resortName)) plainText += plainIf('Resort', inquiry.resortName);
    if (isFilled(inquiry.roomName)) plainText += plainIf('Room', inquiry.roomName);
  }
  plainText += plainIf('Name', inquiry.name);
  plainText += plainIf('Email', inquiry.email);
  if (inquiry.entityType !== 'Contact') {
    plainText += plainIf('Phone', inquiry.phone_number);
    plainText += plainIf('Country', inquiry.country);
    plainText += plainIf('Travellers', inquiry.travellers);
    plainText += plainIf('Number of rooms', inquiry.number_of_rooms);
    plainText += isFilled(inquiry.selectedActivities) ? plainIf('Selected Activities', Array.isArray(inquiry.selectedActivities) ? inquiry.selectedActivities.join(', ') : inquiry.selectedActivities) : '';
    if (isFilled(inquiry.preferredMonth) || isFilled(inquiry.preferredYear)) plainText += plainIf('Preferred Month/Year', `${inquiry.preferredMonth || ''} ${inquiry.preferredYear || ''}`);
    plainText += plainIf('Adventure Option', inquiry.adventureOption);
    if (inquiry.bookWholeBoat) plainText += plainIf('Book whole boat', 'Yes');
    plainText += isFilled(inquiry.participants) ? plainIf('Participants', inquiry.participants.map(p => p.name || '').join(', ')) : '';
    plainText += plainIf('Divers Adults', inquiry.divers_adults);
    plainText += plainIf('Divers Children', inquiry.divers_children);
    plainText += plainIf('Non-Divers Adults', inquiry.nondivers_adults);
    plainText += plainIf('Non-Divers Children', inquiry.nondivers_children);
    plainText += isFilled(inquiry.children) ? plainIf('Children Ages', inquiry.children.join(', ')) : '';
    plainText += isFilled(inquiry.from_date) ? plainIf('From Date', new Date(inquiry.from_date).toLocaleDateString()) : '';
    plainText += isFilled(inquiry.to_date) ? plainIf('To Date', new Date(inquiry.to_date).toLocaleDateString()) : '';
  }
  plainText += plainIf('Message', inquiry.message);
  plainText += plainIf('Submitted At', inquiry.submitted_at ? inquiry.submitted_at.toISOString() : '');
  plainText += `\nBest regards,\nTraveliccted Team\n`;

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
        <tr>
          <td style="background-color: #074a5b; color: #ffffff; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 26px; font-weight: bold;">Traveliccted</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px;">
            <h2 style="color: #074a5b; font-size: 18px; margin: 0 0 10px;">Dear ${name},</h2>
            <p style="font-size: 14px; color: #333333; margin: 0 0 10px;">Subject: ${subject}</p>
            <div style="margin: 10px 0 20px; padding: 10px; background-color: #f9f9f9; border-left: 4px solid #1e809b;">${message}</div>

            <h3 style="color: #074a5b; font-size: 16px; margin: 0 0 10px;">Original Inquiry Details</h3>
            <table width="100%" cellpadding="5" style="font-size: 14px; color: #333333;">
              <!-- Type intentionally not displayed -->
              ${htmlRowIf('Title', inquiry.title)}
              ${inquiry.entityType === 'Accommodation' ? (isFilled(inquiry.resortName) ? htmlRowIf('Resort', inquiry.resortName) : '') : ''}
              ${inquiry.entityType === 'Accommodation' ? (isFilled(inquiry.roomName) ? htmlRowIf('Room', inquiry.roomName) : '') : ''}
              ${htmlRowIf('Name', inquiry.name)}
              ${htmlRowIf('Email', inquiry.email)}
              ${inquiry.entityType !== 'Contact' ? htmlRowIf('Phone', inquiry.phone_number) : ''}
              ${inquiry.entityType !== 'Contact' ? htmlRowIf('Country', inquiry.country) : ''}
              ${inquiry.entityType !== 'Contact' ? htmlRowIf('Travellers', inquiry.travellers) : ''}
              ${inquiry.entityType !== 'Contact' ? htmlRowIf('Number of rooms', inquiry.number_of_rooms) : ''}
              ${isFilled(inquiry.selectedActivities) ? htmlRowIf('Selected Activities', Array.isArray(inquiry.selectedActivities) ? inquiry.selectedActivities : [inquiry.selectedActivities]) : ''}
              ${(isFilled(inquiry.preferredMonth) || isFilled(inquiry.preferredYear)) ? htmlRowIf('Preferred Month/Year', `${inquiry.preferredMonth || ''} ${inquiry.preferredYear || ''}`) : ''}
              ${htmlRowIf('Adventure Option', inquiry.adventureOption)}
              ${inquiry.bookWholeBoat ? htmlRowIf('Book whole boat', 'Yes') : ''}
              ${isFilled(inquiry.participants) ? htmlRowIf('Participants', inquiry.participants.map(p => p.name || '')) : ''}
              ${htmlRowIf('Divers Adults', inquiry.divers_adults)}
              ${htmlRowIf('Divers Children', inquiry.divers_children)}
              ${htmlRowIf('Non-Divers Adults', inquiry.nondivers_adults)}
              ${htmlRowIf('Non-Divers Children', inquiry.nondivers_children)}
              ${isFilled(inquiry.children) ? htmlRowIf('Children Ages', inquiry.children.join(', ')) : ''}
              ${isFilled(inquiry.from_date) ? htmlRowIf('From Date', new Date(inquiry.from_date).toLocaleDateString()) : ''}
              ${isFilled(inquiry.to_date) ? htmlRowIf('To Date', new Date(inquiry.to_date).toLocaleDateString()) : ''}
              ${htmlRowIf('Message', inquiry.message)}
              ${isFilled(inquiry.submitted_at) ? htmlRowIf('Submitted At', inquiry.submitted_at.toISOString()) : ''}
            </table>
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
    // Sanitize incoming body: trim strings and convert empty strings to undefined
    const cleanBody = { ...(req.body || {}) };
    Object.keys(cleanBody).forEach((k) => {
      const v = cleanBody[k];
      if (typeof v === 'string') {
        const trimmed = v.trim();
        cleanBody[k] = trimmed === '' ? undefined : trimmed;
      }
    });

    console.log('Received inquiry payload:', cleanBody);

    const {
      name,
      email,
      phone_number,
      message,
      entity,
      entityType,
      inquiry_form_type,
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
      travellers,
      number_of_rooms,
      selectedActivities,
      preferredMonth,
      preferredYear,
  adventureOption,
  adventureOptions,
  participants,
  participantsByOption,
      bookWholeBoat,
      divers_adults,
      divers_children,
      non_divers_adults,
      non_divers_children,
      non_divers_infants,
    } = cleanBody;
    if (entityType !== 'Custom' && entityType !== 'Accommodation' && !mongoose.isValidObjectId(entity.$oid)) {
      return res.status(400).json({ error: 'Invalid entity ID for non-custom/non-accommodation inquiry' });
    }

    // For accommodations require resortName, roomName to be optional
    let effectiveInquiryFormType = inquiry_form_type;
    if (entityType === 'Package' && !effectiveInquiryFormType) {
      try {
        const pkg = await Package.findById(entity?.$oid).select('inquiry_form_type resort resortName');
        if (pkg) {
          effectiveInquiryFormType = pkg.inquiry_form_type || effectiveInquiryFormType;
          if (!resortName) {
            resortName = pkg.resort || pkg.resortName || resortName;
          }
        }
      } catch (e) {
        console.warn('Could not lookup package for inquiry_form_type fallback', e?.message);
      }
    }

    if ((entityType === 'Accommodation' || effectiveInquiryFormType === 'Accommodation') && !resortName) {
      return res.status(400).json({ error: 'resortName is required for Accommodation inquiries' });
    }

    const inquiryData = {
      name,
      email,
      phone_number,
      message,
      entity: { $oid: entity.$oid },
      entityType,
      from_date: from_date,
      to_date: to_date,
      adults: adults,
      children: children,
      infants: infants,
      travellers,
      number_of_rooms: number_of_rooms,
      selectedActivities: Array.isArray(selectedActivities) ? selectedActivities : (selectedActivities ? [selectedActivities] : []),
      preferredMonth,
      preferredYear: preferredYear ? Number(preferredYear) : undefined,
      adventureOptions: Array.isArray(adventureOptions) ? adventureOptions : (adventureOptions ? [adventureOptions] : (adventureOption ? [adventureOption] : [])),
      adventureOption,
      participants: Array.isArray(participants) ? participants : (participants ? [participants] : []),
      participantsByOption: Array.isArray(participantsByOption) ? participantsByOption : (participantsByOption ? [participantsByOption] : []),
      bookWholeBoat: !!bookWholeBoat,
      divers_adults: divers_adults,
      divers_children: divers_children,
      non_divers_adults: non_divers_adults,
      non_divers_children: non_divers_children,
      non_divers_infants: non_divers_infants,
      country,
      buttonType,
      title,
      resortName: (entityType === 'Accommodation' || effectiveInquiryFormType === 'Accommodation') ? resortName : undefined,
      roomName: (entityType === 'Accommodation' || effectiveInquiryFormType === 'Accommodation') ? roomName : undefined,
      inquiry_form_type: effectiveInquiryFormType,
    };

    if (entityType === 'Package' || effectiveInquiryFormType) {
      const form = effectiveInquiryFormType;
      // Accommodation fields
      if (form === 'Accommodation') {
        if (typeof cleanBody.resortName !== 'undefined') inquiryData.resortName = cleanBody.resortName;
        if (typeof cleanBody.roomName !== 'undefined') inquiryData.roomName = cleanBody.roomName;
        if (Array.isArray(cleanBody.selectedActivities)) inquiryData.selectedActivities = cleanBody.selectedActivities;
        else if (typeof cleanBody.selectedActivities !== 'undefined') inquiryData.selectedActivities = [cleanBody.selectedActivities];
        if (typeof cleanBody.divers_adults !== 'undefined') inquiryData.divers_adults = cleanBody.divers_adults;
        if (typeof cleanBody.divers_children !== 'undefined') inquiryData.divers_children = cleanBody.divers_children;
        if (typeof cleanBody.non_divers_adults !== 'undefined') inquiryData.non_divers_adults = cleanBody.non_divers_adults;
        if (typeof cleanBody.non_divers_children !== 'undefined') inquiryData.non_divers_children = cleanBody.non_divers_children;
        if (typeof cleanBody.non_divers_infants !== 'undefined') inquiryData.non_divers_infants = cleanBody.non_divers_infants;
        if (typeof cleanBody.number_of_rooms !== 'undefined') inquiryData.number_of_rooms = cleanBody.number_of_rooms;
        if (typeof cleanBody.travellers !== 'undefined') inquiryData.travellers = cleanBody.travellers;
        if (typeof cleanBody.from_date !== 'undefined') inquiryData.from_date = cleanBody.from_date;
        if (typeof cleanBody.to_date !== 'undefined') inquiryData.to_date = cleanBody.to_date;
      }
      // Adventure fields
      if (form === 'Adventure') {
        if (typeof cleanBody.preferredMonth !== 'undefined') inquiryData.preferredMonth = cleanBody.preferredMonth;
        if (typeof cleanBody.preferredYear !== 'undefined') inquiryData.preferredYear = Number(cleanBody.preferredYear);
        if (typeof cleanBody.adventureOption !== 'undefined') inquiryData.adventureOption = cleanBody.adventureOption;
        if (Array.isArray(cleanBody.participantsByOption)) {
          inquiryData.participantsByOption = cleanBody.participantsByOption;
        } else if (Array.isArray(cleanBody.participants) && Array.isArray(cleanBody.adventureOptions) && cleanBody.adventureOptions.length > 0) {
          inquiryData.participantsByOption = [{ option: cleanBody.adventureOptions[0], participants: cleanBody.participants }];
        } else if (Array.isArray(cleanBody.participants)) {
          inquiryData.participants = cleanBody.participants;
        } else if (cleanBody.participants) {
          inquiryData.participants = [cleanBody.participants];
        }
        inquiryData.bookWholeBoat = !!cleanBody.bookWholeBoat;
      }
    }

    const inquiry = new Inquiry(inquiryData);
    await inquiry.save();
    console.log('Inquiry saved to database:', inquiry._id);
    try {
      if (cleanBody.subscribe_newsletter) {
        const emailLower = (email || '').toLowerCase().trim();
        if (emailLower) {
          const subscriber = await Newsletter.findOneAndUpdate(
            { email: emailLower },
            { email: emailLower, status: 'subscribed', language: cleanBody.language || 'en', subscribed_at: new Date(), unsubscribed_at: undefined },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
          console.log('Newsletter subscription applied for', emailLower);
          // Add subscriber to all public lists (admin-controlled)
          try {
            if (subscriber && subscriber._id) {
              const lang = cleanBody.language || subscriber.language || undefined;
              let targetLists = [];
              try {
                const noLangQuery = [{ language: { $exists: false } }, { language: '' }];
                if (lang) {
                  // include lists that match the language plus global lists with no language
                  targetLists = await List.find({ is_public: true, $or: [{ language: lang }, ...noLangQuery] });
                  if (!targetLists || targetLists.length === 0) {
                    targetLists = await List.find({ is_public: true });
                  }
                } else {
                  // no language: only include public lists that have no language set
                  targetLists = await List.find({ is_public: true, $or: noLangQuery });
                }
              } catch (e) {
                console.warn('Failed resolving lists by language', e.message || e);
                targetLists = await List.find({ is_public: true });
              }

              for (const listDoc of targetLists) {
                try {
                  const list = await List.findById(listDoc._id);
                  if (!list) continue;
                  const sid = String(subscriber._id);
                  if (!list.subscribers) list.subscribers = [];
                  if (!list.subscribers.map(String).includes(sid)) {
                    list.subscribers.push(subscriber._id);
                    await list.save();
                  }
                } catch (e) {
                  console.warn('Failed to add subscriber to public list', listDoc._id, e.message || e);
                }
              }
            }
          } catch (e) {
            console.warn('Failed to resolve public lists for newsletter subscriber', e.message || e);
          }
        }
      }
    } catch (nlErr) {
      console.warn('Newsletter subscribe failed:', nlErr?.message || nlErr);
    }

    let entityTitle = title;
    if (entityType === 'Package') {
      const entityDoc = await Package.findById(entity.$oid).select('title name');
      entityTitle = entityDoc?.title || entityDoc?.name || title;
    } else if (entityType === 'Activity') {
      const entityDoc = await Activity.findById(entity.$oid).select('title name');
      entityTitle = entityDoc?.title || entityDoc?.name || title;
    } else if (entityType === 'Accommodation') {
      const entityDoc = await Resort.findById(entity.$oid).select('name');
      const resortLabel = entityDoc?.name || resortName || '';
      entityTitle = resortLabel + (isFilled(roomName) ? ` - ${roomName}` : '');
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
      travellers: inquiry.travellers,
      number_of_rooms: inquiry.number_of_rooms,
      selectedActivities: Array.isArray(inquiry.selectedActivities)
        ? inquiry.selectedActivities.map(sa => (typeof sa === 'string' ? sa : (sa.title || sa.name || String(sa))))
        : (inquiry.selectedActivities ? [String(inquiry.selectedActivities)] : []),
      preferredMonth: inquiry.preferredMonth,
      preferredYear: inquiry.preferredYear,
      adventureOption: inquiry.adventureOption,
      participants: inquiry.participants,
      bookWholeBoat: inquiry.bookWholeBoat,
      divers_adults: inquiry.divers_adults,
      divers_children: inquiry.divers_children,
      non_divers_adults: inquiry.non_divers_adults,
      non_divers_children: inquiry.non_divers_children,
      non_divers_infants: inquiry.non_divers_infants,
      country,
      buttonType,
      submitted_at: inquiry.submitted_at
    };

    // Admin notification message (for WhatsApp)
      const adminNotificationMessage = `
      New Inquiry: ${entityTitle}
      ${entityType === 'Accommodation' ? `Resort: ${resortName}\n${isFilled(roomName) ? `Room: ${roomName}` : ''}` : ''}
      Name: ${name}
      Email: ${email}
      Phone: ${phone_number}
      Message: ${message}
      Entity ID: ${entity.$oid}
      From Date: ${from_date ? new Date(from_date).toLocaleDateString() : 'N/A'}
      To Date: ${to_date ? new Date(to_date).toLocaleDateString() : 'N/A'}
      Adults (12+): ${inquiry.adults}
      Children (2-11): ${inquiry.children}
      Infants (below 2): ${inquiry.infants}
      Travellers: ${inquiry.travellers}
      Number of rooms: ${inquiry.number_of_rooms}
  Selected Activities: ${Array.isArray(inquiry.selectedActivities) ? inquiry.selectedActivities.join(', ') : (inquiry.selectedActivities)}
      Preferred Month/Year: ${inquiry.preferredMonth} / ${inquiry.preferredYear}
      Adventure Option: ${inquiry.adventureOption}
      Book whole boat: ${inquiry.bookWholeBoat ? 'Yes' : 'No'}
      Participants: ${Array.isArray(inquiry.participants) ? inquiry.participants.map(p=>p.name||'').join(', ') : 'N/A'}
      Divers Adults: ${inquiry.divers_adults}
      Divers Children: ${inquiry.divers_children}
      Non-divers Adults: ${inquiry.nondivers_adults}
      Non-divers Children: ${inquiry.nondivers_children}
      Non-divers Infants: ${inquiry.nondivers_infants}
      Country: ${country}
      Inquiry Type: ${buttonType === 'bookNow' ? 'Email' : 'WhatsApp'}
      Submitted At: ${inquiry.submitted_at.toISOString()}
    `;

    // Send admin notification
    if (buttonType === 'bookNow') {
      const adminEmail = generateAdminEmailTemplate(emailData);
      const adminMailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.SMTP_USER,
  subject: `New Inquiry: ${entityTitle}`,
        html: adminEmail.html,
        text: adminEmail.text,
      };
      await sendMailSafe(adminMailOptions);
      console.log('Admin email send attempted');
    } else if (buttonType === 'whatsapp') {
      await sendWhatsAppSafe(adminNotificationMessage);
      console.log('WhatsApp send attempted');
    }

    // User confirmation email
  const userEmail = generateUserConfirmationTemplate(emailData);
    const userMailOptions = {
      from: process.env.SMTP_USER,
      to: email,
  subject: `Booking Confirmation: ${entityTitle}`,
      html: userEmail.html,
      text: userEmail.text,
    };
  await sendMailSafe(userMailOptions);
  console.log('User confirmation email send attempted');

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
  await sendMailSafe(adminMailOptions);
  console.log('Admin contact inquiry email send attempted');

    // User confirmation email
    const userEmail = generateContactConfirmationTemplate(adminEmailData);
    const userMailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Inquiry Confirmation: Contact Inquiry',
      html: userEmail.html,
      text: userEmail.text,
    };
  await sendMailSafe(userMailOptions);
  console.log('User contact confirmation send attempted');
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
        number_of_rooms: inquiry.number_of_rooms,
        selectedActivities: inquiry.selectedActivities,
        preferredMonth: inquiry.preferredMonth,
        preferredYear: inquiry.preferredYear,
        adventureOption: inquiry.adventureOption,
        participants: inquiry.participants,
        bookWholeBoat: inquiry.bookWholeBoat,
        divers_adults: inquiry.divers_adults,
        divers_children: inquiry.divers_children,
        non_divers_adults: inquiry.non_divers_adults,
        non_divers_children: inquiry.non_divers_children,
        non_divers_infants: inquiry.non_divers_infants,
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
  await sendMailSafe(replyMailOptions);
  console.log('Reply email send attempted to:', inquiry.email);

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
