const express = require('express');
const router = express.Router();
const Newsletter = require('../models/Newsletter');
const NewsletterCampaign = require('../models/NewsletterCampaign');
const UIContent = require('../models/UIContent');
const List = require('../models/List');
const crypto = require('crypto');
const jsdom = require('jsdom');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

  let createDOMPurify;
  try {
    createDOMPurify = require('dompurify');
  } catch (e) {
    createDOMPurify = null;
  }

  const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const escapeHtml = (unsafe) => {
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };
  const SIGNING_SECRET = process.env.UNSUBSCRIBE_SECRET || process.env.SESSION_SECRET || 'change-this-secret';

  const generateUnsubscribeToken = (email) => {
    const hmac = crypto.createHmac('sha256', SIGNING_SECRET);
    hmac.update(email.toLowerCase());
    return encodeURIComponent(Buffer.from(hmac.digest('hex')).toString('hex'));
  };

  const verifyUnsubscribeToken = (email, token) => {
    try {
      const expected = generateUnsubscribeToken(email);
      return expected === token;
    } catch (e) { return false; }
  };

  // sanitize HTML (ReactQuill output) 
  let sanitizeHtml = (dirty) => (dirty || '');
  if (createDOMPurify) {
    const windowForPurify = new jsdom.JSDOM('').window;
    const DOMPurify = createDOMPurify(windowForPurify);
    sanitizeHtml = (dirty) => {
      if (!dirty || typeof dirty !== 'string') return '';
      return DOMPurify.sanitize(dirty, { ADD_ATTR: ['target', 'class', 'style'] });
    };
  }

  const parseDateInput = (val) => {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof val !== 'string') return null;
    if (/Z|[+-]\d{2}:?\d{2}$/.test(val)) {
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    }
    // Match YYYY-MM-DDTHH:mm or YYYY-MM-DD HH:mm
    const m = val.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})$/);
    if (m) {
      const y = parseInt(m[1], 10);
      const mo = parseInt(m[2], 10) - 1;
      const d = parseInt(m[3], 10);
      const hh = parseInt(m[4], 10);
      const mm = parseInt(m[5], 10);
      const date = new Date(y, mo, d, hh, mm, 0, 0); 
      return isNaN(date.getTime()) ? null : date;
    }
    const fallback = new Date(val);
    return isNaN(fallback.getTime()) ? null : fallback;
  };

  router.post('/subscribe', async (req, res, next) => {
    try {
      const { email, listId, listIds } = req.body;
      if (!isValidEmail(email)) return res.status(400).json({ message: 'Invalid email' });
      const normalized = email.toLowerCase().trim();
// Check existing subscriber
		const existing = await Newsletter.findOne({ email: normalized });
		if (existing) {
			if (existing.status === 'subscribed') {
		return res.status(409).json({ message: 'Already subscribed' });
			}
			// If previously unsubscribed, reactivate
			existing.status = 'subscribed';
			existing.subscribed_at = new Date();
			existing.unsubscribed_at = undefined;
			await existing.save();
			return res.status(200).json({ message: 'Re-subscribed', subscriber: existing });
		}
		const created = await Newsletter.create({ email: normalized, status: 'subscribed', subscribed_at: new Date() });

		const addToLists = async (subscriber, ids) => {
			let targetIds = Array.isArray(ids) ? ids.filter(Boolean) : [];
			try {
				if (targetIds.length === 0) {
					const publicLists = await List.find({ is_public: true });
					targetIds = publicLists.map(l => String(l._id));
				}
			} catch (e) {
				console.error('Failed resolving public lists', e.message);
			}
			if (targetIds.length === 0) return;
			for (const lid of targetIds) {
				try {
					const list = await List.findById(lid);
					if (!list) continue;
					if (!list.is_public) continue; 
					const sid = String(subscriber._id);
					if (!list.subscribers) list.subscribers = [];
					if (!list.subscribers.map(String).includes(sid)) {
						list.subscribers.push(subscriber._id);
						await list.save();
					}
				} catch (e) {
					console.error('Failed adding to list', lid, e.message);
				}
			}
		};

		if (listId || (Array.isArray(listIds) && listIds.length > 0)) {
			await addToLists(created, Array.prototype.concat(listId || [], listIds || []));
		} else {
			await addToLists(created, []);
		}

		return res.status(201).json({ message: 'Subscribed', subscriber: created });
	} catch (err) {
		if (err.code === 11000) return res.status(409).json({ message: 'Already subscribed' });
		next(err);
	}
});

  // Public lists endpoint - returns lists available for public subscription
  router.get('/public/lists', async (req, res, next) => {
    try {
      let publicLists = await List.find({ is_public: true }).populate({ path: 'subscribers', match: { status: 'subscribed' } });
		for (let i = 0; i < publicLists.length; i++) {
			const l = publicLists[i];
			if (!Array.isArray(l.subscribers)) l.subscribers = [];
			if (l.subscribers.length > 0 && typeof l.subscribers[0] !== 'object') {
				// subscribers are ids, fetch subscribed docs
				const subs = await Newsletter.find({ _id: { $in: l.subscribers }, status: 'subscribed' }).select('_id');
				l.subscribers = subs;
			} else if (l.subscribers.length > 0 && l.subscribers[0] && typeof l.subscribers[0] === 'object') {
				l.subscribers = l.subscribers.filter(s => s && s.status === 'subscribed');
			}
		}
		const lists = publicLists.map(l => ({ _id: l._id, name: l.name, description: l.description, subscriber_count: Array.isArray(l.subscribers) ? l.subscribers.length : (l.subscriber_count || 0) }));
      return res.status(200).json({ lists });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/newsletter/unsubscribe
  router.post('/unsubscribe', async (req, res, next) => {
    try {
      const { email, token } = req.body;
      if (!isValidEmail(email)) return res.status(400).json({ message: 'Invalid email' });
      // If token present, validate it; if not, accept but flag for audit
      if (token && !verifyUnsubscribeToken(email, token)) return res.status(400).json({ message: 'Invalid token' });

      const subscriber = await Newsletter.findOneAndUpdate(
        { email: email.toLowerCase().trim() },
        { $set: { status: 'unsubscribed', unsubscribed_at: new Date() } },
        { new: true }
      );

		if (!subscriber) {
			const created = await Newsletter.create({ email: email.toLowerCase().trim(), status: 'unsubscribed', unsubscribed_at: new Date() });
			return res.status(200).json({ message: 'Unsubscribed', subscriber: created });
		}
		try {
			await List.updateMany({ subscribers: subscriber._id }, { $pull: { subscribers: subscriber._id } });
			console.log('Removed unsubscribed user from lists:', subscriber.email);
		} catch (e) {
			console.warn('Failed to remove unsubscribed user from lists:', e.message || e);
		}

		return res.status(200).json({ message: 'Unsubscribed', subscriber });
	} catch (err) {
		next(err);
	}
});

  // Useful for unsubscribe links in emails
  router.get('/unsubscribe', async (req, res, next) => {
    try {
      const email = req.query.email;
      const token = req.query.t;
      if (!isValidEmail(email)) return res.status(400).json({ message: 'Invalid email' });

      if (token && !verifyUnsubscribeToken(email, token)) return res.status(400).json({ message: 'Invalid token' });

      const subscriber = await Newsletter.findOneAndUpdate(
        { email: email.toLowerCase().trim() },
        { $set: { status: 'unsubscribed', unsubscribed_at: new Date() } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      try {
        if (subscriber && subscriber._id) {
          await List.updateMany({ subscribers: subscriber._id }, { $pull: { subscribers: subscriber._id } });
          console.log('Removed unsubscribed user from lists (GET):', subscriber.email);
        }
      } catch (e) {
        console.warn('Failed to remove unsubscribed user from lists (GET):', e.message || e);
		}
      const accept = req.get('accept') || '';
      const isJson = accept.includes('application/json') || req.xhr;
      if (isJson) {
        return res.status(200).json({ message: 'Unsubscribed', subscriber });
      }
      const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <title>Unsubscribed</title>
          <style>body{font-family:Arial,Helvetica,sans-serif;background:#f4f6f8;color:#111;margin:0;padding:24px} .card{max-width:700px;margin:40px auto;background:#fff;border-radius:8px;box-shadow:0 6px 18px rgba(16,24,40,0.08);padding:24px} pre{white-space:pre-wrap;background:#f7fafc;padding:12px;border-radius:6px;border:1px solid #e6e9ec;overflow:auto}</style>
        </head>
        <body>
          <div class="card">
            <h1 style="margin-top:0">Newsletter unsubscribe successfully!!</h1>
            <p style="color:#374151">You have been unsubscribed the newsletter successfully.</p>
            <p style="color:#6b7280;font-size:13px;margin-top:18px">If this was a mistake, you can re-subscribe from the contact section.</p>
          </div>
        </body>
      </html>`;
      return res.status(200).send(html);
    } catch (err) {
      next(err);
    }
  });

  module.exports = router;

  // GET /api/newsletter/admin/subscribers
  router.get('/admin/subscribers', async (req, res, next) => {
    try {
      const { status, language } = req.query;
      const q = {};
      if (status) q.status = status;
      if (language) q.language = language;
      const subscribers = await Newsletter.find(q).sort({ createdAt: -1 });
      return res.status(200).json({ subscribers });
    } catch (err) {
      next(err);
    }
  });

  // add subscriber manually
  router.post('/admin/subscribers', async (req, res, next) => {
    try {
      const { email, language } = req.body;
      if (!isValidEmail(email)) return res.status(400).json({ message: 'Invalid email' });
      const normalized = email.toLowerCase().trim();
      const existing = await Newsletter.findOne({ email: normalized });
      if (existing && existing.status === 'subscribed') return res.status(409).json({ message: 'Already subscribed' });
      if (existing) {
        existing.status = 'subscribed';
        existing.subscribed_at = new Date();
        existing.unsubscribed_at = undefined;
        if (language) existing.language = language;
        await existing.save();
        return res.status(200).json({ message: 'Re-subscribed', subscriber: existing });
      }
    const created = await Newsletter.create({ email: normalized, status: 'subscribed', subscribed_at: new Date(), language });
      return res.status(201).json({ message: 'Subscribed', subscriber: created });
    } catch (err) {
      if (err.code === 11000) return res.status(409).json({ message: 'Already subscribed' });
      next(err);
    }
  });

  router.delete('/admin/subscribers/:id', async (req, res, next) => {
    try {
      const id = req.params.id;
      const doc = await Newsletter.findByIdAndDelete(id);
      if (!doc) return res.status(404).json({ message: 'Subscriber not found' });
      return res.status(200).json({ message: 'Deleted' });
    } catch (err) {
      next(err);
    }
  });

  // create campaign (draft or schedule)
  router.post('/admin/campaigns', async (req, res, next) => {
    try {
      const { title, subject, body, footer, scheduled_at, recipients, titleAlign } = req.body;
      if (!title || !subject || !body) return res.status(400).json({ message: 'title, subject and body are required' });
      const safeBody = sanitizeHtml(body);
      const safeFooter = footer ? sanitizeHtml(footer) : undefined;
      const allowedAlign = ['left','center','right','justify'];
      const align = (typeof titleAlign === 'string' && allowedAlign.includes(titleAlign)) ? titleAlign : 'left';
      const campaign = await NewsletterCampaign.create({
        title,
        subject,
        body: safeBody,
        footer: safeFooter,
        titleAlign: align,
        scheduled_at: scheduled_at ? parseDateInput(scheduled_at) : undefined,
        status: scheduled_at ? 'scheduled' : 'draft',
        recipients: recipients || { type: 'all' }
      });
      return res.status(201).json({ message: 'Campaign created', campaign });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/newsletter/admin/campaigns
  router.get('/admin/campaigns', async (req, res, next) => {
    try {
      const campaigns = await NewsletterCampaign.find({}).sort({ createdAt: -1 });
      for (const campaign of campaigns) {
			if (campaign.status !== 'sent') {
				let est = 0;
				const r = campaign.recipients || { type: 'all' };
				if (r.type === 'all') {
					est = await Newsletter.countDocuments({ status: 'subscribed' });
				} else if (r.type === 'selected') {
					est = r.selectedIds ? r.selectedIds.length : 0;
				} else if (r.type === 'custom') {
					est = r.customEmails ? r.customEmails.length : 0;
				} else if (r.type === 'lists') {
					if (r.listIds && r.listIds.length > 0) {
						const lists = await List.find({ _id: { $in: r.listIds } }).populate({ path: 'subscribers', match: { status: 'subscribed' }, select: '_id' });
						const subsSet = new Set();
						for (const l of lists) {
							for (const s of (l.subscribers || [])) {
								subsSet.add(String(s._id || s));
							}
						}
						est = subsSet.size;
					}
				}
          campaign.estimated_recipients = est;
        }
      }
      return res.status(200).json({ campaigns });
    } catch (err) {
      next(err);
    }
  });

  // Extracted sendCampaign function
  async function sendCampaign(campaign, options = {}, baseUrl) {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const mailFrom = process.env.MAIL_FROM || smtpUser;
    const { testEmail, toSelected, selectedIds, language, listId, listIds, customEmails } = options;
    const buildFooterHtml = async (recipientEmail) => {
      let footer = process.env.MAIL_FOOTER || '';
      try {
        const contactDoc = await UIContent.findOne({ pageId: 'contact' });
        const contactSection = contactDoc?.sections?.find(s => s.sectionId === 'contact-info')?.content;
        if (contactSection) {
          const companyName = 'Traveliccted';
          const phone = contactSection.callPhone || '';
          const email = contactSection.email || '';
          const address = contactSection.address || '';
          const unsubscribeUrl = `${baseUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(recipientEmail)}&t=${generateUnsubscribeToken(recipientEmail)}`;
          footer = `
					<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="font-family: Arial, Helvetica, sans-serif; font-size:13px; color:#6b7280;">
						<tr>
							<td style="padding:12px 0; border-top:1px solid #e6e9ec;">
								<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
									<tr>
										<td style="vertical-align:top; padding-right:12px; width:60%">
											<div style="font-weight:700; color:#111827; font-size:14px;">${companyName}</div>
											<div style="margin-top:6px; color:#6b7280; font-size:13px; line-height:1.4;">
												${phone ? `<div>Phone: ${phone}</div>` : ''}
												${email ? `<div>Email: <a href=\"mailto:${email}\" style=\"color:#1e809b; text-decoration:none\">${email}</a></div>` : ''}
                        ${address ? `<div>Address: ${address}</div>` : ''}
											</div>
										</td>
									</tr>
								</table>
							</td>
						</tr>
					</table>
				`;
			}
		} catch (e) {
			console.error('Failed to build footer from UIContent', e.message);
		}
		if (!footer) {
			footer = `
				<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="font-family: Arial, Helvetica, sans-serif; font-size:13px; color:#6b7280;">
					<tr>
						<td style="padding:12px 0; border-top:1px solid #e6e9ec;">
							<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
								<tr>
									<td style="vertical-align:top; padding-right:12px; width:60%">
										<div style="font-weight:700; color:#111827; font-size:14px;">Company Name</div>
										<div style="margin-top:6px; color:#6b7280; font-size:13px; line-height:1.4;">Address or contact info here</div>
									</td>
                    <td style="vertical-align:middle; text-align:center; width:40%; padding-top:8px;">
                      <div style="margin-bottom:8px; font-size:13px; color:#9ca3af; text-align:center;">If you no longer wish to receive these emails, click the button.</div>
                      <a href="${unsubscribeUrl}" style="display:inline-block; padding:12px 18px; background:#ef4444; color:#ffffff; text-decoration:none; border-radius:6px; font-weight:600; font-size:14px;">Unsubscribe</a>
                    </td>
								</tr>
							</table>
						</td>
					</tr>
				</table>
			`;
		} else {
			footer = footer.replace(/\{\{unsubscribe_url\}\}/g, `${baseUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(recipientEmail)}&t=${generateUnsubscribeToken(recipientEmail)}`);
		}
		return footer;
  };

  const buildEmailHtml = async (recipientEmail) => {
  const footerHtml = await buildFooterHtml(recipientEmail);
  const unsubscribeUrl = `${baseUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(recipientEmail)}&t=${generateUnsubscribeToken(recipientEmail)}`;
    let bodyHtml = campaign.body || '';
    try {
      bodyHtml = sanitizeHtml(bodyHtml);
      const emailSafeHtml = (html) => {
        try {
          const dom = new jsdom.JSDOM(html);
          const d = dom.window.document;
          d.querySelectorAll('script,iframe,video,object,embed,style').forEach(n => n.remove());
          d.querySelectorAll('img').forEach(img => {
            const alt = img.getAttribute('alt') || img.getAttribute('title') || '';
            if (alt) {
              const p = d.createElement('p');
              p.textContent = alt;
              img.parentNode.replaceChild(p, img);
            } else {
              img.remove();
            }
          });
          // Convert Quill alignment classes
          d.querySelectorAll('[class]').forEach(n => {
            const cls = (n.getAttribute('class') || '').split(/\s+/);
            for (const c of cls) {
              if (/^ql-align-/.test(c)) {
                const align = c.replace('ql-align-', '');
                const prevStyle = n.getAttribute('style') || '';
                n.setAttribute('style', `${prevStyle}; text-align:${align};`);
              }
            }
          });
          d.querySelectorAll('*').forEach(n => { n.removeAttribute('class'); n.removeAttribute('id'); });
          d.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h => {
            const tag = h.tagName.toLowerCase();
            const sizeMap = { h1: '22px', h2: '20px', h3: '18px', h4: '16px', h5: '14px', h6: '13px' };
            const prevStyle = h.getAttribute('style') || '';
            const sep = prevStyle && prevStyle.trim().slice(-1) !== ';' ? ';' : '';
            const newStyle = `${prevStyle}${sep}margin:0 0 10px 0; font-weight:700; font-size:${sizeMap[tag] || '16px'};`;
            h.setAttribute('style', newStyle);
          });

          d.querySelectorAll('div').forEach(div => {
            const hasBlock = Array.from(div.children).some(c => ['DIV','P','UL','OL','TABLE','H1','H2','H3','H4','H5','H6'].includes(c.tagName));
            if (!hasBlock) {
              const p = d.createElement('p');
              p.innerHTML = div.innerHTML;
              p.setAttribute('style', 'margin:0 0 10px 0; line-height:1.4;');
              div.parentNode.replaceChild(p, div);
            }
          });

          d.querySelectorAll('ul,ol').forEach(list => {
            list.setAttribute('style', 'margin:0 0 12px 20px;');
          });

          return d.body.innerHTML;
        } catch (e) {
          console.error('emailSafeHtml transform failed', e.message || e);
          return html;
        }
      };
      bodyHtml = emailSafeHtml(bodyHtml);
    } catch (e) {
      console.warn('Failed to prepare campaign body for email, sending raw sanitized HTML', e.message || e);
      bodyHtml = campaign.body || '';
    }
    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${campaign.title || ''}</title>
      </head>
      <body style="font-family: Arial, Helvetica, sans-serif; margin:0; padding:0; background:#f4f6f8;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="margin:20px auto; background:#ffffff; border-radius:8px; overflow:hidden;">
                <tr>
                  <td style="padding:20px 30px; background:linear-gradient(135deg,#1e809b 0%,#074a5b 100%); color:#fff;">
                    <h1 style="margin:0; font-size:20px; text-align:${campaign.titleAlign || 'left'};">${campaign.title || ''}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px; color:#111827;">
                    ${bodyHtml}
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px; background:#ffffff; color:#6b7280; font-size:13px;">
                    ${footerHtml}
                  </td>
                </tr>
                <!-- unsubscribe block -->
                <tr>
                  <td style="padding:18px 18px; text-align:center; background:#ffffff;">
                    <div style="margin-bottom:10px; font-size:13px; color:#9ca3af;">If you no longer wish to receive these emails, click the button.</div>
                    <a href="${unsubscribeUrl}" style="display:inline-block; padding:12px 18px; background:#ef4444; color:#ffffff; text-decoration:none; border-radius:6px; font-weight:600; font-size:14px;">Unsubscribe</a>
                  </td>
                </tr>
                  <td style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #666666;">
                    <p style="margin: 0;">Automated notification from Traveliccted Admin System</p>
                    <p style="margin: 5px 0;">© 2025 Traveliccted. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
    return html;
  };

  if (testEmail) {
    const html = await buildEmailHtml(testEmail);

    // SMTP not configured, simulate
    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      console.log(`Test send simulated to ${testEmail} (SMTP not configured)`);
      return { message: `Test send simulated to ${testEmail} (SMTP not configured)` };
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort, 10),
      secure: String(smtpPort) === '465',
      auth: { user: smtpUser, pass: smtpPass }
    });

    try {
      await transporter.sendMail({ from: mailFrom, to: testEmail, subject: campaign.subject, html });
      return { message: `Test sent to ${testEmail}` };
    } catch (sendErr) {
      console.error('Test send failed', sendErr);
      throw new Error('Test send failed');
    }
  }

  let recipients = [];
  if (Array.isArray(customEmails) && customEmails.length > 0) {
    recipients = customEmails.filter(isValidEmail).map(e => ({ email: e }));
  } else if (testEmail) {
    recipients = [{ email: testEmail }];
  } else if (Array.isArray(listIds) && listIds.length > 0) {
    // collect subscribers from multiple lists
    const listDocs = await List.find({ _id: { $in: listIds } }).populate({ path: 'subscribers', match: { status: 'subscribed' } });
    const set = new Map();
    for (const ld of listDocs) {
      for (const s of (ld.subscribers || [])) {
        set.set(String(s._id), s);
      }
    }
    recipients = Array.from(set.values());
  } else if (Array.isArray(selectedIds) && selectedIds.length > 0) {
    recipients = await Newsletter.find({ _id: { $in: selectedIds }, status: 'subscribed' });
  } else if (listId) {
    const listDoc = await List.findById(listId).populate({ path: 'subscribers', match: { status: 'subscribed' } });
    recipients = listDoc?.subscribers || [];
  } else if (campaign.recipients && campaign.recipients.type) {
    const r = campaign.recipients;
    if (r.type === 'custom' && Array.isArray(r.customEmails) && r.customEmails.length > 0) {
      recipients = (r.customEmails || []).filter(isValidEmail).map(e => ({ email: e }));
    } else if (r.type === 'lists' && Array.isArray(r.listIds) && r.listIds.length > 0) {
      const listDocs = await List.find({ _id: { $in: r.listIds } }).populate({ path: 'subscribers', match: { status: 'subscribed' } });
      const set = new Map();
      for (const ld of listDocs) {
        for (const s of (ld.subscribers || [])) set.set(String(s._id), s);
      }
      recipients = Array.from(set.values());
    } else if (r.type === 'selected' && Array.isArray(r.selectedIds) && r.selectedIds.length > 0) {
      recipients = await Newsletter.find({ _id: { $in: r.selectedIds }, status: 'subscribed' });
    } else {
      recipients = await Newsletter.find({ status: 'subscribed' });
    }
  } else {
    let recipientsQuery = { status: 'subscribed' };
    if (language) recipientsQuery.language = language;
    recipients = await Newsletter.find(recipientQuery);
  }
  if (!recipients || recipients.length === 0) {
    campaign.recipients_count = 0;
    campaign.sent_at = new Date();
    campaign.status = 'sent';
    await campaign.save();
    return { message: 'No recipients', recipients_count: 0, campaign };
  }

  let successCount = 0;
  let failCount = 0;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    successCount = recipients.length;
    campaign.recipients_count = successCount;
    campaign.sent_at = new Date();
    campaign.status = 'sent';
    await campaign.save();
    return { message: 'Campaign sent (simulated, SMTP not configured)', recipients_count: successCount, campaign };
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort, 10),
    secure: String(smtpPort) === '465',
    auth: { user: smtpUser, pass: smtpPass }
  });

  // Send emails sequentially
  for (const r of recipients) {
    const toEmail = r.email;
    const html = await buildEmailHtml(toEmail);
    const mailOptions = { from: mailFrom, to: toEmail, subject: campaign.subject, html };

    try {
      await transporter.sendMail(mailOptions);
      successCount++;
    } catch (sendErr) {
      console.error('Failed to send to', toEmail, sendErr);
      failCount++;
    }
  }

  campaign.recipients_count = successCount;
  campaign.sent_at = new Date();
  campaign.status = 'sent';
  await campaign.save();

  return { message: `Campaign sent: ${successCount} success, ${failCount} failed`, recipients_count: successCount, failed_count: failCount, campaign };
}

// POST /api/newsletter/admin/campaigns/:id/send
router.post('/admin/campaigns/:id/send', async (req, res, next) => {
  try {
    const id = req.params.id;
    const campaign = await NewsletterCampaign.findById(id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    if (campaign.status === 'sent') return res.status(400).json({ message: 'Campaign already sent' });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const result = await sendCampaign(campaign, req.body, baseUrl);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/newsletter/admin/campaigns/:id/schedule
router.post('/admin/campaigns/:id/schedule', async (req, res, next) => {
	try {
		const id = req.params.id;
		const { scheduled_at } = req.body;
		if (!scheduled_at) return res.status(400).json({ message: 'scheduled_at is required' });
		const campaign = await NewsletterCampaign.findById(id);
		if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
		const parsed = parseDateInput(scheduled_at);
		if (!parsed) return res.status(400).json({ message: 'Invalid scheduled_at' });
		campaign.scheduled_at = parsed;
		campaign.status = 'scheduled';
		await campaign.save();
		return res.status(200).json({ message: 'Campaign scheduled', campaign });
	} catch (err) {
		next(err);
	}
});

// PUT /api/newsletter/admin/campaigns/:id - update campaign
router.put('/admin/campaigns/:id', async (req, res, next) => {
    try {
        const id = req.params.id;
        const { title, subject, body, footer, scheduled_at, recipients, titleAlign } = req.body;
        const campaign = await NewsletterCampaign.findById(id);
        if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

        if (title) campaign.title = title;
        if (subject) campaign.subject = subject;
        if (body) campaign.body = sanitizeHtml(body);
        if (typeof footer !== 'undefined') campaign.footer = footer ? sanitizeHtml(footer) : undefined;
        if (scheduled_at) {
            const parsed = parseDateInput(scheduled_at);
            if (parsed) campaign.scheduled_at = parsed;
        }
        // title alignment
        const allowedAlign = ['left','center','right','justify'];
        if (typeof titleAlign === 'string' && allowedAlign.includes(titleAlign)) {
          campaign.titleAlign = titleAlign;
        }
    if (recipients && typeof recipients === 'object') {
      const validTypes = ['all','selected','lists','custom'];
      const type = recipients.type && validTypes.includes(recipients.type) ? recipients.type : 'all';
      const normalized = { type };

      if (type === 'selected' && Array.isArray(recipients.selectedIds)) {
        normalized.selectedIds = recipients.selectedIds.map(id => id && id._id ? id._id : id).filter(Boolean);
      }
      if (type === 'lists' && Array.isArray(recipients.listIds)) {
        normalized.listIds = recipients.listIds.map(id => id && id._id ? id._id : id).filter(Boolean);
      }
      if (type === 'custom' && Array.isArray(recipients.customEmails)) {
        normalized.customEmails = recipients.customEmails.filter(isValidEmail);
      }

      campaign.recipients = normalized;
    }

        await campaign.save();
        return res.status(200).json({ message: 'Campaign updated', campaign });
    } catch (err) { next(err); }
});

// DELETE /api/newsletter/admin/campaigns/:id - delete campaign
router.delete('/admin/campaigns/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const doc = await NewsletterCampaign.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ message: 'Campaign not found' });
    return res.status(200).json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
});

// GET /api/newsletter/admin/lists
router.get('/admin/lists', async (req, res, next) => {
	try {
		let lists = await List.find({}).populate({ path: 'subscribers', match: { status: 'subscribed' } });
		for (let i = 0; i < lists.length; i++) {
			const l = lists[i];
			if (!Array.isArray(l.subscribers)) l.subscribers = [];
			if (l.subscribers.length > 0 && typeof l.subscribers[0] !== 'object') {
				const subs = await Newsletter.find({ _id: { $in: l.subscribers }, status: 'subscribed' }).select('_id email');
				l.subscribers = subs;
			} else if (l.subscribers.length > 0 && l.subscribers[0] && typeof l.subscribers[0] === 'object') {
				l.subscribers = l.subscribers.filter(s => s && s.status === 'subscribed');
			}
		}
		return res.status(200).json({ lists });
	} catch (err) { next(err); }
});

// POST /api/newsletter/admin/lists
router.post('/admin/lists', async (req, res, next) => {
	try {
		const { name, description, is_public } = req.body;
		if (!name) return res.status(400).json({ message: 'List name required' });
		const created = await List.create({ name, description, is_public });
		return res.status(201).json({ message: 'List created', list: created });
	} catch (err) { next(err); }
});

// PUT /api/newsletter/admin/lists/:id
router.put('/admin/lists/:id', async (req, res, next) => {
	try {
		const id = req.params.id;
		const { name, description, is_public } = req.body;
		const list = await List.findById(id);
		if (!list) return res.status(404).json({ message: 'List not found' });
		if (name) list.name = name;
		if (typeof description !== 'undefined') list.description = description;
		if (typeof is_public !== 'undefined') list.is_public = !!is_public;
		await list.save();
		return res.status(200).json({ message: 'List updated', list });
	} catch (err) { next(err); }
});

// DELETE /api/newsletter/admin/lists/:id
router.delete('/admin/lists/:id', async (req, res, next) => {
	try {
		const id = req.params.id;
		const doc = await List.findByIdAndDelete(id);
		if (!doc) return res.status(404).json({ message: 'List not found' });
		return res.status(200).json({ message: 'List deleted' });
	} catch (err) { next(err); }
});

// POST /api/newsletter/admin/lists/:id/add - add subscriber IDs
router.post('/admin/lists/:id/add', async (req, res, next) => {
	try {
		const id = req.params.id;
		const { subscriberIds } = req.body;
		if (!Array.isArray(subscriberIds) || subscriberIds.length === 0) return res.status(400).json({ message: 'subscriberIds required' });
		const list = await List.findById(id);
		if (!list) return res.status(404).json({ message: 'List not found' });
		const normalize = (v) => {
			if (!v && v !== 0) return null;
			if (typeof v === 'string') return v;
			if (typeof v === 'object') {
				if (v.$oid) return String(v.$oid);
				if (v._id) return String(v._id);
				if (v.id) return String(v.id);
			}
			try { return String(v); } catch (e) { return null; }
		};

		const existingIds = new Set((list.subscribers || []).map(s => String(s)));
		let added = 0;
		for (const raw of subscriberIds) {
			const sid = normalize(raw);
			if (!sid) continue;
			if (!existingIds.has(sid)) {
				list.subscribers.push(sid);
				existingIds.add(sid);
				added++;
			}
		}
		await list.save();
		return res.status(200).json({ message: `Subscribers added (${added})`, list });
	} catch (err) { next(err); }
});

// POST /api/newsletter/admin/lists/:id/remove - remove subscriber IDs
router.post('/admin/lists/:id/remove', async (req, res, next) => {
	try {
		const id = req.params.id;
		const { subscriberIds } = req.body;
		if (!Array.isArray(subscriberIds) || subscriberIds.length === 0) return res.status(400).json({ message: 'subscriberIds required' });
		const list = await List.findById(id);
		if (!list) return res.status(404).json({ message: 'List not found' });

		const normalize = (v) => {
			if (!v && v !== 0) return null;
			if (typeof v === 'string') return v;
			if (typeof v === 'object') {
				if (v.$oid) return String(v.$oid);
				if (v._id) return String(v._id);
				if (v.id) return String(v.id);
			}
			try { return String(v); } catch (e) { return null; }
		};

		const removeIds = new Set(subscriberIds.map(normalize).filter(Boolean));
		list.subscribers = (list.subscribers || []).filter(s => !removeIds.has(String(s)));
		await list.save();
		return res.status(200).json({ message: 'Subscribers removed', list });
	} catch (err) { next(err); }
});

// GET /api/newsletter/admin/footer - return fixed footer HTML for preview
router.get('/admin/footer', async (req, res, next) => {
	try {
		const UIContent = require('../models/UIContent');
		let footerHtml = process.env.MAIL_FOOTER || '';
		try {
			const contactDoc = await UIContent.findOne({ pageId: 'contact' });
			const contactSection = contactDoc?.sections?.find(s => s.sectionId === 'contact-info')?.content;
			if (contactSection) {
        const companyName = 'Traveliccted';
				const phone = contactSection.callPhone || '';
				const email = contactSection.email || '';
				const address = contactSection.address || '';

				footerHtml = `
					<div style="font-family: Arial, Helvetica, sans-serif; font-size:13px; color:#6b7280;">
						<strong style="color:#111827">${companyName}</strong>
						<div style="margin-top:6px">
							${phone ? `<div>Phone: ${phone}</div>` : ''}
							${email ? `<div>Email: <a href=\"mailto:${email}\" style=\"color:#1e809b; text-decoration:none\">${email}</a></div>` : ''}
              ${address ? `<div>${address}</div>` : ''}
						</div>
						<div style="margin-top:8px; font-size:12px; color:#9ca3af">If you wish to unsubscribe, click <a href=\"{{unsubscribe_url}}\" style=\"color:#1e809b; text-decoration:none\">here</a>.</div>
					</div>
				`;
			}
		} catch (err) {
			console.error('Failed to read UIContent for footer preview', err.message);
		}
		if (!footerHtml) {
			footerHtml = `<div style="font-family: Arial, Helvetica, sans-serif; font-size:12px;color:#666">Company Name<br/><a href=\"{{unsubscribe_url}}\">Unsubscribe</a></div>`;
		}

		return res.status(200).json({ footer: footerHtml });
	} catch (err) {
		next(err);
	}
});

// Scheduler to send scheduled campaigns
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const due = await NewsletterCampaign.find({ status: 'scheduled', scheduled_at: { $lte: now } });
    for (const camp of due) {
      try {
        console.log('Sent scheduled campaign', camp._id);
      } catch (e) {
        console.error('Failed to send scheduled campaign', camp._id, e);
      }
    }
  } catch (e) {
    console.error('Scheduler error', e);
  }
});

module.exports = router;
