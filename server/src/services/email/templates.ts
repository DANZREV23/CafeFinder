import { EmailTemplate, EmailPayloads } from './types.js';

interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export function renderTemplate<T extends EmailTemplate>(
  template: T,
  payload: EmailPayloads[T]
): RenderedEmail {
  const p = (payload || {}) as any;

  switch (template) {
    case EmailTemplate.WELCOME:
      return {
        subject: `Welcome to CafeFinder, ${p.name || 'Friend'}!`,
        html: `<h2>Welcome to CafeFinder!</h2><p>Hi ${p.name || 'there'},</p><p>We are thrilled to have you join our community of coffee lovers. Start discovering amazing local cafes now.</p><p><a href="${p.exploreUrl || '#'}">Explore Cafes</a></p>`,
        text: `Welcome to CafeFinder, ${p.name || 'there'}! Explore cafes: ${p.exploreUrl || ''}`,
      };

    case EmailTemplate.CAFE_SUBMISSION_APPROVED:
      return {
        subject: `Your cafe submission for "${p.cafeName}" has been approved!`,
        html: `<h2>Good news!</h2><p>Hi ${p.name || 'there'},</p><p>Your cafe submission for <strong>${p.cafeName}</strong> has been approved and published to CafeFinder!</p><p><a href="${p.cafeUrl || '#'}">View Cafe Profile</a></p>`,
        text: `Your cafe submission for "${p.cafeName}" has been approved! View it here: ${p.cafeUrl || ''}`,
      };

    case EmailTemplate.CAFE_SUBMISSION_REJECTED:
      return {
        subject: `Update on your cafe submission for "${p.cafeName}"`,
        html: `<h2>Submission Update</h2><p>Hi ${p.name || 'there'},</p><p>Unfortunately, your submission for <strong>${p.cafeName}</strong> could not be approved at this time.</p><p><strong>Reason:</strong> ${p.reason || 'Did not meet listing criteria.'}</p>`,
        text: `Update on your submission for "${p.cafeName}": Unfortunately it was not approved. Reason: ${p.reason || 'Did not meet listing criteria.'}`,
      };

    case EmailTemplate.OWNER_CLAIM_APPROVED:
      return {
        subject: `Your ownership claim for "${p.cafeName}" has been approved!`,
        html: `<h2>Congratulations!</h2><p>Hi ${p.name || 'there'},</p><p>Your claim for <strong>${p.cafeName}</strong> has been verified and approved.</p><p><a href="${p.dashboardUrl || '#'}">Access Owner Dashboard</a></p>`,
        text: `Your ownership claim for "${p.cafeName}" has been approved! Dashboard: ${p.dashboardUrl || ''}`,
      };

    case EmailTemplate.OWNER_CLAIM_REJECTED:
      return {
        subject: `Ownership claim update for "${p.cafeName}"`,
        html: `<h2>Claim Update</h2><p>Hi ${p.name || 'there'},</p><p>We could not verify your ownership claim for <strong>${p.cafeName}</strong>.</p><p><strong>Reason:</strong> ${p.reason || 'Verification requirements not met.'}</p>`,
        text: `Claim update for "${p.cafeName}": Verification not met. Reason: ${p.reason || ''}`,
      };

    case EmailTemplate.REVIEW_APPROVED:
      return {
        subject: `Your review for "${p.cafeName}" is now live!`,
        html: `<h2>Review Published</h2><p>Hi ${p.name || 'there'},</p><p>Your review for <strong>${p.cafeName}</strong> has been published.</p><p><a href="${p.cafeUrl || '#'}">View Review</a></p>`,
        text: `Your review for "${p.cafeName}" has been published: ${p.cafeUrl || ''}`,
      };

    case EmailTemplate.REVIEW_REJECTED:
      return {
        subject: `Update on your review for "${p.cafeName}"`,
        html: `<h2>Review Notice</h2><p>Hi ${p.name || 'there'},</p><p>Your review for <strong>${p.cafeName}</strong> could not be published because it violated community guidelines.</p><p>${p.reason ? `Reason: ${p.reason}` : ''}</p>`,
        text: `Your review for "${p.cafeName}" could not be published. ${p.reason ? `Reason: ${p.reason}` : ''}`,
      };

    case EmailTemplate.REVIEW_HIDDEN:
      return {
        subject: `Your review for "${p.cafeName}" has been hidden`,
        html: `<h2>Review Hidden</h2><p>Hi ${p.name || 'there'},</p><p>Your review for <strong>${p.cafeName}</strong> has been hidden pending moderation.</p>`,
        text: `Your review for "${p.cafeName}" has been hidden pending moderation.`,
      };

    case EmailTemplate.REVIEW_RESTORED:
      return {
        subject: `Your review for "${p.cafeName}" has been restored`,
        html: `<h2>Review Restored</h2><p>Hi ${p.name || 'there'},</p><p>Following review, your post for <strong>${p.cafeName}</strong> has been restored.</p><p><a href="${p.cafeUrl || '#'}">View Review</a></p>`,
        text: `Your review for "${p.cafeName}" has been restored: ${p.cafeUrl || ''}`,
      };

    case EmailTemplate.CHANGE_REQUEST_APPROVED:
      return {
        subject: `Change request for "${p.cafeName}" has been approved`,
        html: `<h2>Changes Approved</h2><p>Hi ${p.name || 'there'},</p><p>Your proposed update (${p.changeType}) for <strong>${p.cafeName}</strong> has been applied.</p>`,
        text: `Your change request for "${p.cafeName}" (${p.changeType}) has been approved.`,
      };

    case EmailTemplate.CHANGE_REQUEST_REJECTED:
      return {
        subject: `Change request for "${p.cafeName}" was not approved`,
        html: `<h2>Changes Not Approved</h2><p>Hi ${p.name || 'there'},</p><p>Your proposed change (${p.changeType}) for <strong>${p.cafeName}</strong> was rejected.</p><p>${p.reason ? `Reason: ${p.reason}` : ''}</p>`,
        text: `Your change request for "${p.cafeName}" was rejected. ${p.reason || ''}`,
      };

    case EmailTemplate.CAFE_PUBLISHED:
      return {
        subject: `"${p.cafeName}" is now published on CafeFinder`,
        html: `<h2>Cafe Published!</h2><p>Hi ${p.name || 'there'},</p><p><strong>${p.cafeName}</strong> is now live on CafeFinder.</p><p><a href="${p.cafeUrl || '#'}">View Cafe</a></p>`,
        text: `"${p.cafeName}" is now published on CafeFinder: ${p.cafeUrl || ''}`,
      };

    case EmailTemplate.CAFE_SUSPENDED:
      return {
        subject: `Important notice regarding "${p.cafeName}" listing`,
        html: `<h2>Listing Notice</h2><p>Hi ${p.name || 'there'},</p><p>Your listing for <strong>${p.cafeName}</strong> has been temporarily suspended.</p><p>${p.reason ? `Reason: ${p.reason}` : ''}</p>`,
        text: `Your listing for "${p.cafeName}" has been suspended. ${p.reason || ''}`,
      };

    case EmailTemplate.INQUIRY_RECEIVED:
      return {
        subject: `New customer inquiry for ${p.cafeName}: ${p.subject}`,
        html: `<h2>New Inquiry Received</h2><p>Hi ${p.ownerName || 'there'},</p><p>You have a new inquiry from <strong>${p.senderName}</strong> regarding <strong>${p.cafeName}</strong>.</p><p><strong>Topic:</strong> ${p.category}</p><p><em>"${p.messagePreview}"</em></p><p><a href="${p.inquiryUrl || '#'}">Respond in Dashboard</a></p>`,
        text: `New customer inquiry for ${p.cafeName} from ${p.senderName}: "${p.subject}". View: ${p.inquiryUrl || ''}`,
      };

    case EmailTemplate.INQUIRY_RESPONDED:
      return {
        subject: `Response from ${p.cafeName}: ${p.subject}`,
        html: `<h2>Response Received</h2><p>Hi ${p.customerName || 'there'},</p><p><strong>${p.cafeName}</strong> has responded to your inquiry:</p><blockquote style="border-left: 3px solid #78350f; padding-left: 10px; margin: 10px 0;">${p.responseMessage}</blockquote><p><a href="${p.cafeUrl || '#'}">Visit Cafe Page</a></p>`,
        text: `Response from ${p.cafeName} regarding "${p.subject}":\n\n${p.responseMessage}`,
      };

    case EmailTemplate.LOYALTY_POINTS_AWARDED:
      return {
        subject: `You earned ${p.pointsAwarded} points at ${p.cafeName}!`,
        html: `<h2>Points Earned!</h2><p>Hi ${p.customerName || 'there'},</p><p>You've earned <strong>${p.pointsAwarded} points</strong> with the <strong>${p.programName}</strong> at <strong>${p.cafeName}</strong>!</p><p>Your current balance is: <strong>${p.newBalance} points</strong>.</p><p><a href="${p.dashboardUrl || '#'}">View Your Rewards</a></p>`,
        text: `You earned ${p.pointsAwarded} points at ${p.cafeName}! New balance: ${p.newBalance} points.`,
      };

    case EmailTemplate.LOYALTY_REDEMPTION_REQUESTED:
      return {
        subject: `New reward redemption request: ${p.rewardName}`,
        html: `<h2>Redemption Requested</h2><p>Hi ${p.ownerName || 'there'},</p><p>Customer <strong>${p.customerName}</strong> has requested to redeem <strong>${p.rewardName}</strong> (${p.pointsSpent} points) at <strong>${p.cafeName}</strong>.</p><p><a href="${p.redemptionsUrl || '#'}">Process in Dashboard</a></p>`,
        text: `New redemption request at ${p.cafeName}: ${p.customerName} requested ${p.rewardName}.`,
      };

    case EmailTemplate.LOYALTY_REDEMPTION_UPDATED:
      return {
        subject: `Your reward redemption for "${p.rewardName}" is ${p.status}`,
        html: `<h2>Redemption Status Update</h2><p>Hi ${p.customerName || 'there'},</p><p>Your redemption for <strong>${p.rewardName}</strong> at <strong>${p.cafeName}</strong> is now: <strong>${p.status}</strong>.</p>${p.reason ? `<p>Note: ${p.reason}</p>` : ''}<p><a href="${p.dashboardUrl || '#'}">View Loyalty Dashboard</a></p>`,
        text: `Your redemption for "${p.rewardName}" at ${p.cafeName} is ${p.status}.`,
      };

    default:
      return {
        subject: 'Notification from CafeFinder',
        html: `<p>You have a new notification from CafeFinder.</p>`,
        text: 'You have a new notification from CafeFinder.',
      };
  }
}
