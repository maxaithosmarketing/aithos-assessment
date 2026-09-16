// Welcome email sent after a Stripe customer is created. {{NAME}} is replaced with the client's name.
// Exported verbatim from the former n8n "Onboarding Automation" workflow.
export const WELCOME_SUBJECT = "{{NAME}}, you're in. Here's your first step.";
export const WELCOME_HTML = String.raw`<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="x-apple-disable-message-reformatting" />
<title>Welcome to Aithos</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<style>
  body { margin:0; padding:0; width:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; background-color:#F2F6FF; }
  table { border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; }
  img { border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; display:block; }
  a { text-decoration:none; }
  .btn:hover { background-color:#d4530f !important; }
  @media only screen and (max-width:600px) {
    .container { width:100% !important; }
    .px { padding-left:24px !important; padding-right:24px !important; }
    .h1 { font-size:28px !important; line-height:34px !important; }
    .stack { display:block !important; width:100% !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#F2F6FF;">

<!-- preheader -->
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#F2F6FF;">
  Book your onboarding call and complete your questionnaire so we can hit the ground running.
  &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F6FF;">
  <tr>
    <td align="center" style="padding:32px 16px;">

      <!-- container -->
      <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 4px 24px rgba(26,26,46,0.06);">

        <!-- accent top bar -->
        <tr><td style="height:5px; background-color:#f26417; font-size:0; line-height:0;">&nbsp;</td></tr>

        <!-- logo header -->
        <tr>
          <td align="center" class="px" style="padding:36px 40px 8px 40px;">
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAV4AAAC0CAYAAADcg0RKAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAEvGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSfvu78nIGlkPSdXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQnPz4KPHg6eG1wbWV0YSB4bWxuczp4PSdhZG9iZTpuczptZXRhLyc+CjxyZGY6UkRGIHhtbG5zOnJkZj0naHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyc+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpBdHRyaWI9J2h0dHA6Ly9ucy5hdHRyaWJ1dGlvbi5jb20vYWRzLzEuMC8nPgogIDxBdHRyaWI6QWRzPgogICA8cmRmOlNlcT4KICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0nUmVzb3VyY2UnPgogICAgIDxBdHRyaWI6Q3JlYXRlZD4yMDI1LTA5LTA3PC9BdHRyaWI6Q3JlYXRlZD4KICAgICA8QXR0cmliOkV4dElkPmE5YzI2NTdkLWU2ZDItNDMxMi05ZDdiLTYzMTE5Zjc0MjkwMzwvQXR0cmliOkV4dElkPgogICAgIDxBdHRyaWI6RmJJZD41MjUyNjU5MTQxNzk1ODA8L0F0dHJpYjpGYklkPgogICAgIDxBdHRyaWI6VG91Y2hUeXBlPjI8L0F0dHJpYjpUb3VjaFR5cGU+CiAgICA8L3JkZjpsaT4KICAgPC9yZGY6U2VxPgogIDwvQXR0cmliOkFkcz4KIDwvcmRmOkRlc2NyaXB0aW9uPgoKIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PScnCiAgeG1sbnM6ZGM9J2h0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvJz4KICA8ZGM6dGl0bGU+CiAgIDxyZGY6QWx0PgogICAgPHJkZjpsaSB4bWw6bGFuZz0neC1kZWZhdWx0Jz5BaXRob3MgLSA1PC9yZGY6bGk+CiAgIDwvcmRmOkFsdD4KICA8L2RjOnRpdGxlPgogPC9yZGY6RGVzY3JpcHRpb24+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJv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" width="150" alt="Aithos" style="width:150px; height:auto; margin:0 auto;" />
          </td>
        </tr>

        <!-- welcome -->
        <tr>
          <td class="px" style="padding:24px 40px 0 40px;">
            <h1 class="h1" style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:32px; line-height:38px; font-weight:800; color:#1A1A2E;">
              Welcome to Aithos, {{NAME}}
            </h1>
            <p style="margin:18px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:16px; line-height:26px; color:#33333a;">
              You're officially in, and we're ready to get to work. Your contract is in a separate email for your information.
            </p>
            <p style="margin:16px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:16px; line-height:26px; color:#33333a;">
              Before we get into logistics, here's the frame for everything we're about to do together. You're not hiring me to make content. You're installing a client acquisition machine, and content is one component inside it. Every script, every video, every DM and every call from here is engineered to attract and convert one specific buyer. That's the whole point, and it's what your next 90 days are built around.
            </p>
          </td>
        </tr>

        <!-- step 1: book call -->
        <tr>
          <td class="px" style="padding:32px 40px 0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="border-top:1px solid #e6e9f2; font-size:0; line-height:0; padding-top:28px;">&nbsp;</td></tr>
            </table>
            <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:13px; line-height:18px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#f26417;">
              Your first step
            </p>
            <h2 style="margin:8px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:22px; line-height:28px; font-weight:800; color:#1A1A2E;">
              Book your onboarding call
            </h2>
            <p style="margin:12px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:16px; line-height:26px; color:#33333a;">
              This is the 90-minute call where we lock in your ICP direction, your offer, your content history and the outcomes we're targeting for your first 90 days. It's the most important hour of the whole engagement, so book it now while it's in front of you.
            </p>
            <!-- bulletproof button -->
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 0 0;">
              <tr>
                <td align="center" bgcolor="#f26417" style="border-radius:8px;">
                  <a class="btn" href="https://link.nrlautomations.com/widget/bookings/onboarding-call-aithos" target="_blank"
                     style="display:inline-block; font-family:Arial,Helvetica,sans-serif; font-size:16px; font-weight:800; color:#ffffff; background-color:#f26417; padding:16px 34px; border-radius:8px;">
                    Book your onboarding call
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- step 2: questionnaire -->
        <tr>
          <td class="px" style="padding:32px 40px 0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="border-top:1px solid #e6e9f2; font-size:0; line-height:0; padding-top:28px;">&nbsp;</td></tr>
            </table>
            <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:13px; line-height:18px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#f26417;">
              Before we talk
            </p>
            <h2 style="margin:8px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:22px; line-height:28px; font-weight:800; color:#1A1A2E;">
              Complete your intake questionnaire
            </h2>
            <p style="margin:12px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:16px; line-height:26px; color:#33333a;">
              This needs to be done 24 to 48 hours before your call. It covers your business background, current numbers, goals, existing assets, brand preferences and the access I'll need. The more detail you give me here, the sharper the call is and the faster we move.
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 0 0;">
              <tr>
                <td align="center" bgcolor="#f26417" style="border-radius:8px;">
                  <a class="btn" href="https://form.typeform.com/to/VEBSgA5y" target="_blank"
                     style="display:inline-block; font-family:Arial,Helvetica,sans-serif; font-size:16px; font-weight:800; color:#ffffff; background-color:#f26417; padding:16px 34px; border-radius:8px;">
                    Complete your questionnaire
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- roadmap -->
        <tr>
          <td class="px" style="padding:36px 40px 0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="border-top:1px solid #e6e9f2; font-size:0; line-height:0; padding-top:28px;">&nbsp;</td></tr>
            </table>
            <h2 style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:22px; line-height:28px; font-weight:800; color:#1A1A2E;">
              Your first 90 days
            </h2>
            <p style="margin:10px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:16px; line-height:26px; color:#33333a;">
              Here's the path so you can see exactly where this is going.
            </p>
          </td>
        </tr>

        <tr>
          <td class="px" style="padding:16px 40px 0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F6FF; border-radius:10px;">
              <tr>
                <td width="5" style="background-color:#f26417; border-radius:10px 0 0 10px; font-size:0; line-height:0;">&nbsp;</td>
                <td style="padding:16px 20px;">
                  <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:12px; line-height:16px; font-weight:700; letter-spacing:0.8px; text-transform:uppercase; color:#f26417;">Days 1 to 7</p>
                  <p style="margin:4px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:17px; line-height:23px; font-weight:800; color:#1A1A2E;">Foundation</p>
                  <p style="margin:6px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:23px; color:#33333a;">Your first scripts go out and you film your first videos. No drawn-out setup phase, we get you in motion fast.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="px" style="padding:16px 40px 0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F6FF; border-radius:10px;">
              <tr>
                <td width="5" style="background-color:#f26417; border-radius:10px 0 0 10px; font-size:0; line-height:0;">&nbsp;</td>
                <td style="padding:16px 20px;">
                  <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:12px; line-height:16px; font-weight:700; letter-spacing:0.8px; text-transform:uppercase; color:#f26417;">Days 7 to 30</p>
                  <p style="margin:4px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:17px; line-height:23px; font-weight:800; color:#1A1A2E;">Content live</p>
                  <p style="margin:6px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:23px; color:#33333a;">Your first month of content goes live and your calendar starts running.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="px" style="padding:16px 40px 0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F6FF; border-radius:10px;">
              <tr>
                <td width="5" style="background-color:#f26417; border-radius:10px 0 0 10px; font-size:0; line-height:0;">&nbsp;</td>
                <td style="padding:16px 20px;">
                  <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:12px; line-height:16px; font-weight:700; letter-spacing:0.8px; text-transform:uppercase; color:#f26417;">Days 31 to 45</p>
                  <p style="margin:4px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:17px; line-height:23px; font-weight:800; color:#1A1A2E;">Conversion system</p>
                  <p style="margin:6px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:23px; color:#33333a;">The full machine is operational, and we optimize it based on the data from month one.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="px" style="padding:16px 40px 0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F6FF; border-radius:10px;">
              <tr>
                <td width="5" style="background-color:#f26417; border-radius:10px 0 0 10px; font-size:0; line-height:0;">&nbsp;</td>
                <td style="padding:16px 20px;">
                  <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:12px; line-height:16px; font-weight:700; letter-spacing:0.8px; text-transform:uppercase; color:#f26417;">Day 45 onward</p>
                  <p style="margin:4px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:17px; line-height:23px; font-weight:800; color:#1A1A2E;">Ongoing execution</p>
                  <p style="margin:6px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:23px; color:#33333a;">Monthly rhythm, compounding results.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- workspace -->
        <tr>
          <td class="px" style="padding:36px 40px 0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="border-top:1px solid #e6e9f2; font-size:0; line-height:0; padding-top:28px;">&nbsp;</td></tr>
            </table>
            <h2 style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:22px; line-height:28px; font-weight:800; color:#1A1A2E;">
              Your workspace and access
            </h2>
            
            <p style="margin:18px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:16px; line-height:25px; color:#33333a;">
              <span style="font-weight:800; color:#f26417;">WhatsApp.</span> This is our direct line, Monday to Friday, 9am to 6pm CET, with same business day responses. I'll message you on WhatsApp myself to open the channel, so keep an eye out for me there.
            </p>
            <p style="margin:18px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:16px; line-height:25px; color:#33333a;">
              <span style="font-weight:800; color:#f26417;">Google Drive.</span> Every deliverable, script, edit, raw file, brand asset and SOP lives in one folder you'll have permanent access to. You'll get a separate email from Google confirming access to a folder named after you.
            </p>
            </p>
          </td>

        <!-- code of conduct -->
        <tr>
          <td class="px" style="padding:36px 40px 0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="border-top:1px solid #e6e9f2; font-size:0; line-height:0; padding-top:28px;">&nbsp;</td></tr>
            </table>
            <h2 style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:22px; line-height:28px; font-weight:800; color:#1A1A2E;">
              How we work together
            </h2>
            <p style="margin:12px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:16px; line-height:26px; color:#33333a;">
              This one's quick but important. The Code of Conduct lays out how we communicate, what you can expect from me, and what I need from you to keep delivery fast. Give it a read before our call.
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 0 0;">
              <tr>
                <td align="center" style="border-radius:8px; border:2px solid #f26417;">
                  <a href="https://conscious-gondola-07e.notion.site/CODE-OF-CONDUCT-382048f07d93805689c3ded68e437e8a" target="_blank"
                     style="display:inline-block; font-family:Arial,Helvetica,sans-serif; font-size:16px; font-weight:800; color:#f26417; padding:14px 30px; border-radius:8px;">
                    Read the Code of Conduct
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- action items -->
        <tr>
          <td class="px" style="padding:36px 40px 0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="border-top:1px solid #e6e9f2; font-size:0; line-height:0; padding-top:28px;">&nbsp;</td></tr>
            </table>
            <h2 style="margin:0 0 8px 0; font-family:Arial,Helvetica,sans-serif; font-size:22px; line-height:28px; font-weight:800; color:#1A1A2E;">
              Your action items
            </h2>
          </td>
        </tr>

        <tr>
          <td class="px" style="padding:4px 40px 0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              
              <tr>
                <td width="34" valign="top" style="padding:6px 0;">
                  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                    <td width="26" height="26" align="center" valign="middle" bgcolor="#f26417" style="width:26px; height:26px; border-radius:13px; font-family:Arial,Helvetica,sans-serif; font-size:14px; font-weight:800; color:#ffffff;">1</td>
                  </tr></table>
                </td>
                <td valign="top" style="padding:6px 0 6px 12px; font-family:Arial,Helvetica,sans-serif; font-size:16px; line-height:26px; color:#33333a;">Book your onboarding call</td>
              </tr>
              <tr>
                <td width="34" valign="top" style="padding:6px 0;">
                  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                    <td width="26" height="26" align="center" valign="middle" bgcolor="#f26417" style="width:26px; height:26px; border-radius:13px; font-family:Arial,Helvetica,sans-serif; font-size:14px; font-weight:800; color:#ffffff;">2</td>
                  </tr></table>
                </td>
                <td valign="top" style="padding:6px 0 6px 12px; font-family:Arial,Helvetica,sans-serif; font-size:16px; line-height:26px; color:#33333a;">Complete your intake questionnaire, at least 24 to 48 hours before the call</td>
              </tr>
              <tr>
                <td width="34" valign="top" style="padding:6px 0;">
                  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                    <td width="26" height="26" align="center" valign="middle" bgcolor="#f26417" style="width:26px; height:26px; border-radius:13px; font-family:Arial,Helvetica,sans-serif; font-size:14px; font-weight:800; color:#ffffff;">3</td>
                  </tr></table>
                </td>
                <td valign="top" style="padding:6px 0 6px 12px; font-family:Arial,Helvetica,sans-serif; font-size:16px; line-height:26px; color:#33333a;">Read the Code of Conduct</td>
              </tr>
              <tr>
                <td width="34" valign="top" style="padding:6px 0;">
                  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                    <td width="26" height="26" align="center" valign="middle" bgcolor="#f26417" style="width:26px; height:26px; border-radius:13px; font-family:Arial,Helvetica,sans-serif; font-size:14px; font-weight:800; color:#ffffff;">4</td>
                  </tr></table>
                </td>
                <td valign="top" style="padding:6px 0 6px 12px; font-family:Arial,Helvetica,sans-serif; font-size:16px; line-height:26px; color:#33333a;">Watch for two separate emails giving you access to your Google Drive folder and your Monday board</td>
              </tr>
              <tr>
                <td width="34" valign="top" style="padding:6px 0;">
                  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                    <td width="26" height="26" align="center" valign="middle" bgcolor="#f26417" style="width:26px; height:26px; border-radius:13px; font-family:Arial,Helvetica,sans-serif; font-size:14px; font-weight:800; color:#ffffff;">5</td>
                  </tr></table>
                </td>
                <td valign="top" style="padding:6px 0 6px 12px; font-family:Arial,Helvetica,sans-serif; font-size:16px; line-height:26px; color:#33333a;">Keep an eye on WhatsApp for my message</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- questions box -->
        <tr>
          <td class="px" style="padding:32px 40px 0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F6FF; border-radius:12px;">
              <tr>
                <td style="padding:24px 26px;">
                  <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:17px; line-height:24px; font-weight:800; color:#1A1A2E;">Questions?</p>
                  <p style="margin:10px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:16px; line-height:25px; color:#33333a;">
                    If anything comes up, just send me a message on WhatsApp once we're connected. And if something isn't 100% clear yet, don't worry about it, we'll talk everything through on the onboarding call.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- sign off -->
        <tr>
          <td class="px" style="padding:30px 40px 8px 40px;">
            <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:16px; line-height:26px; color:#33333a;">
              That's everything you need to get started. Do these in order and we'll have you in motion within the week. I'm looking forward to building this with you.
            </p>
            <p style="margin:20px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:16px; line-height:24px; color:#1A1A2E; font-weight:800;">Max</p>
            <p style="margin:2px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:14px; line-height:20px; color:#6b7280;">Founder, Aithos</p>
          </td>
        </tr>

        <!-- footer -->
        <tr>
          <td style="padding:32px 40px 0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="border-top:1px solid #e6e9f2; font-size:0; line-height:0;">&nbsp;</td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="background-color:#1A1A2E; padding:28px 40px; border-radius:0 0 14px 14px;">
            <p style="margin:0 0 16px 0; font-family:Arial,Helvetica,sans-serif; font-size:16px; line-height:22px; color:#f26417; font-weight:800;">
              Profile to Profit&trade;
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" align="center">
              <tr>
                <td style="padding:0 10px;">
                  <a href="https://www.instagram.com/vonk.max/" target="_blank" style="font-family:Arial,Helvetica,sans-serif; font-size:14px; font-weight:700; color:#ffffff;">Instagram</a>
                </td>
                <td style="color:#4a4a5e; font-family:Arial,Helvetica,sans-serif; font-size:14px;">|</td>
                <td style="padding:0 10px;">
                  <a href="https://www.youtube.com/@max_vonk" target="_blank" style="font-family:Arial,Helvetica,sans-serif; font-size:14px; font-weight:700; color:#ffffff;">YouTube</a>
                </td>
              </tr>
            </table>
            <p style="margin:16px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:12px; line-height:18px; color:#8a8a9c;">
              &copy; Aithos. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
      <!-- /container -->

    </td>
  </tr>
</table>
</body>
</html>`;
