import { EmailTemplate } from './types.js';

interface TemplateResult {
  subject: string;
  html: string;
  text: string;
}

const COLORS = {
  primary: '#5A3825', // Coffee brown
  secondary: '#FCFAF6', // Cream background
  accent: '#2D5A27', // Green accent
  text: '#2D2926', // Neutral text
  muted: '#716B67',
  white: '#FFFFFF',
};

const getBaseLayout = (title: string, contentHtml: string, actionUrl?: string, actionText?: string) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: ${COLORS.text};
      margin: 0;
      padding: 0;
      background-color: ${COLORS.secondary};
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .header h1 {
      color: ${COLORS.primary};
      margin: 0;
      font-size: 28px;
    }
    .content {
      background-color: ${COLORS.white};
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      color: ${COLORS.muted};
      font-size: 14px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: ${COLORS.primary};
      color: ${COLORS.white} !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      margin-top: 24px;
    }
    .link-fallback {
      margin-top: 24px;
      font-size: 12px;
      color: ${COLORS.muted};
      word-break: break-all;
    }
    h2 {
      color: ${COLORS.primary};
      margin-top: 0;
    }
    p {
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CafeFinder</h1>
    </div>
    <div class="content">
      ${contentHtml}
      ${actionUrl && actionText ? `
        <div style="text-align: center;">
          <a href="${actionUrl}" class="button">${actionText}</a>
        </div>
        <div class="link-fallback">
          If the button doesn't work, copy and paste this URL into your browser: <br>
          <a href="${actionUrl}">${actionUrl}</a>
        </div>
      ` : ''}
    </div>
    <div class="footer">
      <p><strong>CafeFinder</strong></p>
      <p>Discover cafes worth visiting.</p>
      <p style="margin-top: 16px; font-size: 12px;">This is an automated account notification. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>
  `;
};

export const renderTemplate = (template: EmailTemplate, data: any): TemplateResult => {
  switch (template) {
    case EmailTemplate.WELCOME:
      return {
        subject: 'Welcome to CafeFinder',
        html: getBaseLayout(
          'Welcome to CafeFinder',
          `
          <h2>Welcome, ${data.name}!</h2>
          <p>Thanks for creating your CafeFinder account. We're excited to have you in our community of coffee lovers.</p>
          <p>With your new account, you can:</p>
          <ul>
            <li>Discover the best specialty coffee shops near you</li>
            <li>Save your favorite spots for quick access</li>
            <li>Write reviews to help others find great rituals</li>
            <li>Submit new cafes you've discovered</li>
          </ul>
          <p>Start exploring today!</p>
          `,
          data.exploreUrl,
          'Explore CafeFinder'
        ),
        text: `Welcome to CafeFinder, ${data.name}!\n\nThanks for creating your CafeFinder account. We're excited to have you in our community of coffee lovers.\n\nWith your new account, you can discover cafes, save favorites, write reviews, and submit new cafes.\n\nStart exploring today: ${data.exploreUrl}\n\nCafeFinder - Discover cafes worth visiting.`,
      };

    case EmailTemplate.CAFE_SUBMISSION_APPROVED:
      return {
        subject: 'Your cafe submission was approved',
        html: getBaseLayout(
          'Cafe Submission Approved',
          `
          <h2>Great news, ${data.name}!</h2>
          <p>Your submission for <strong>${data.cafeName}</strong> has been approved by our team.</p>
          <p>It is now live on CafeFinder and available for everyone to discover.</p>
          `,
          data.cafeUrl,
          'View Cafe Profile'
        ),
        text: `Great news, ${data.name}!\n\nYour submission for ${data.cafeName} has been approved. It is now live on CafeFinder.\n\nView it here: ${data.cafeUrl}\n\nCafeFinder - Discover cafes worth visiting.`,
      };

    case EmailTemplate.CAFE_SUBMISSION_REJECTED:
      return {
        subject: 'Update on your cafe submission',
        html: getBaseLayout(
          'Cafe Submission Update',
          `
          <h2>Hello ${data.name},</h2>
          <p>Thank you for submitting <strong>${data.cafeName}</strong> to CafeFinder.</p>
          <p>After reviewing your submission, we are unable to approve it at this time for the following reason:</p>
          <p style="padding: 16px; background-color: #f8f8f8; border-left: 4px solid #ddd;">${data.reason}</p>
          ${data.submissionUrl ? '<p>You can review your submission details and make corrections if needed.</p>' : ''}
          `,
          data.submissionUrl,
          data.submissionUrl ? 'View Submission' : undefined
        ),
        text: `Hello ${data.name},\n\nThank you for submitting ${data.cafeName} to CafeFinder. After review, we are unable to approve it for the following reason: ${data.reason}\n\nCafeFinder - Discover cafes worth visiting.`,
      };

    case EmailTemplate.OWNER_CLAIM_APPROVED:
      return {
        subject: 'Your cafe ownership claim was approved',
        html: getBaseLayout(
          'Ownership Claim Approved',
          `
          <h2>Congratulations, ${data.name}!</h2>
          <p>Your claim for ownership of <strong>${data.cafeName}</strong> has been approved.</p>
          <p>You now have access to your Owner Dashboard where you can manage your cafe profile, respond to reviews, and view analytics.</p>
          `,
          data.dashboardUrl,
          'Go to Owner Dashboard'
        ),
        text: `Congratulations, ${data.name}!\n\nYour claim for ownership of ${data.cafeName} has been approved. You now have access to your Owner Dashboard.\n\nManage your cafe here: ${data.dashboardUrl}\n\nCafeFinder - Discover cafes worth visiting.`,
      };

    case EmailTemplate.OWNER_CLAIM_REJECTED:
      return {
        subject: 'Update on your ownership claim',
        html: getBaseLayout(
          'Ownership Claim Update',
          `
          <h2>Hello ${data.name},</h2>
          <p>We have reviewed your request to claim ownership of <strong>${data.cafeName}</strong>.</p>
          <p>Unfortunately, we are unable to approve your claim at this time for the following reason:</p>
          <p style="padding: 16px; background-color: #f8f8f8; border-left: 4px solid #ddd;">${data.reason}</p>
          `,
          data.claimUrl,
          data.claimUrl ? 'View Claim Status' : undefined
        ),
        text: `Hello ${data.name},\n\nWe have reviewed your request to claim ownership of ${data.cafeName}. Unfortunately, we are unable to approve it for the following reason: ${data.reason}\n\nCafeFinder - Discover cafes worth visiting.`,
      };

    case EmailTemplate.REVIEW_APPROVED:
      return {
        subject: 'Your review is now published',
        html: getBaseLayout(
          'Review Published',
          `
          <h2>Hello ${data.name},</h2>
          <p>Your review for <strong>${data.cafeName}</strong> has been approved and is now visible to the community.</p>
          <p>Thank you for sharing your experience and helping others find great coffee!</p>
          `,
          data.cafeUrl,
          'View Cafe Reviews'
        ),
        text: `Hello ${data.name},\n\nYour review for ${data.cafeName} has been approved and is now live. Thank you for sharing your experience!\n\nView it here: ${data.cafeUrl}\n\nCafeFinder - Discover cafes worth visiting.`,
      };

    case EmailTemplate.REVIEW_REJECTED:
      return {
        subject: 'Update on your review',
        html: getBaseLayout(
          'Review Update',
          `
          <h2>Hello ${data.name},</h2>
          <p>We have reviewed your recent review for <strong>${data.cafeName}</strong>.</p>
          <p>Unfortunately, your review does not meet our community guidelines and cannot be published in its current form.</p>
          ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
          `
        ),
        text: `Hello ${data.name},\n\nWe have reviewed your recent review for ${data.cafeName}. Unfortunately, it does not meet our community guidelines and cannot be published.\n\nCafeFinder - Discover cafes worth visiting.`,
      };

    case EmailTemplate.CHANGE_REQUEST_APPROVED:
      return {
        subject: 'Your cafe update request was approved',
        html: getBaseLayout(
          'Update Request Approved',
          `
          <h2>Hello ${data.name},</h2>
          <p>Your requested changes to <strong>${data.cafeName}</strong> (${data.changeType}) have been approved and applied.</p>
          `,
          data.dashboardUrl,
          'View Dashboard'
        ),
        text: `Hello ${data.name},\n\nYour requested changes to ${data.cafeName} (${data.changeType}) have been approved and applied.\n\nView your dashboard: ${data.dashboardUrl}\n\nCafeFinder - Discover cafes worth visiting.`,
      };

    case EmailTemplate.CHANGE_REQUEST_REJECTED:
      return {
        subject: 'Update on your cafe change request',
        html: getBaseLayout(
          'Update Request Rejection',
          `
          <h2>Hello ${data.name},</h2>
          <p>We have reviewed your request to update <strong>${data.cafeName}</strong> (${data.changeType}).</p>
          <p>Unfortunately, we are unable to apply these changes at this time.</p>
          ${data.reason ? `<p style="padding: 16px; background-color: #f8f8f8; border-left: 4px solid #ddd;">${data.reason}</p>` : ''}
          `,
          data.dashboardUrl,
          'View Dashboard'
        ),
        text: `Hello ${data.name},\n\nWe have reviewed your request to update ${data.cafeName} (${data.changeType}). Unfortunately, we are unable to apply these changes at this time.\n\nReason: ${data.reason || 'Not specified'}\n\nView your dashboard: ${data.dashboardUrl}\n\nCafeFinder - Discover cafes worth visiting.`,
      };

    case EmailTemplate.CAFE_PUBLISHED:
      return {
        subject: 'Your cafe is now live!',
        html: getBaseLayout(
          'Cafe Published',
          `
          <h2>Congratulations, ${data.name}!</h2>
          <p>Your cafe, <strong>${data.cafeName}</strong>, is now published and visible to all users on CafeFinder.</p>
          <p>You can now share your profile with your customers and start collecting reviews.</p>
          `,
          data.cafeUrl,
          'View Public Profile'
        ),
        text: `Congratulations, ${data.name}!\n\nYour cafe, ${data.cafeName}, is now live on CafeFinder. Share your profile and start collecting reviews!\n\nView profile: ${data.cafeUrl}\n\nCafeFinder - Discover cafes worth visiting.`,
      };

    case EmailTemplate.CAFE_SUSPENDED:
      return {
        subject: 'Your cafe profile has been suspended',
        html: getBaseLayout(
          'Cafe Status Update',
          `
          <h2>Hello ${data.name},</h2>
          <p>We are writing to inform you that your cafe profile for <strong>${data.cafeName}</strong> has been suspended.</p>
          <p>While suspended, your profile will not be visible to public users.</p>
          ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
          <p>If you believe this is an error, please contact our support team.</p>
          `
        ),
        text: `Hello ${data.name},\n\nYour cafe profile for ${data.cafeName} has been suspended. Reason: ${data.reason || 'Not specified'}. If you believe this is an error, please contact support.\n\nCafeFinder - Discover cafes worth visiting.`,
      };

    default:
      return {
        subject: 'Notification from CafeFinder',
        html: getBaseLayout('Notification', `<p>You have a new notification from CafeFinder.</p>`),
        text: 'You have a new notification from CafeFinder.',
      };
  }
};
