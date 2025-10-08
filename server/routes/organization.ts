import type { Express } from "express";
import type { AppDependencies } from "../types";
import { nanoid } from "nanoid";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { config } from "../config";
import { mailService, FROM_EMAIL } from "../emailService";

async function sendInvitationEmail(
  email: string,
  organizationName: string,
  inviterName: string,
  inviteUrl: string
): Promise<boolean> {
  if (!config.has('SENDGRID_API_KEY')) {
    console.log('Invitation email would be sent to:', email);
    return true;
  }

  try {
    await mailService.send({
      to: email,
      from: FROM_EMAIL,
      subject: `You've been invited to join ${organizationName} on Morouna Loans`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Team Invitation</h2>
          <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on Morouna Loans.</p>
          <p>As a team member, you'll be able to:</p>
          <ul>
            <li>Access shared loan portfolios</li>
            <li>Manage facilities and collateral</li>
            <li>Collaborate on financial insights</li>
          </ul>
          <div style="margin: 30px 0;">
            <a href="${inviteUrl}" style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This invitation will expire in 7 days.</p>
          <p style="color: #6b7280; font-size: 14px;">If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      `
    });

    console.log('Invitation email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('SendGrid invitation email error:', error);
    return false;
  }
}

export function registerOrganizationRoutes(app: Express, deps: AppDependencies) {

  app.post('/api/organization/invite', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.claims.sub;
      const { email: rawEmail } = req.body;

      if (!rawEmail || !rawEmail.trim()) {
        return res.status(400).json({ 
          success: false, 
          message: "Email is required" 
        });
      }

      const email = rawEmail.trim().toLowerCase();

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid email format" 
        });
      }

      // Get user's organization
      const userOrg = await storage.getUserOrganization(userId);
      
      if (!userOrg) {
        return res.status(404).json({ 
          success: false, 
          message: "Organization not found" 
        });
      }

      // Check if user is owner
      const members = await storage.getOrganizationMembers(userOrg.id);
      const currentMember = members.find(m => m.userId === userId);

      if (!currentMember?.isOwner) {
        return res.status(403).json({ 
          success: false, 
          message: "Only organization owners can invite members" 
        });
      }

      // Check if user is already a member
      const existingMember = members.find(m => m.user.email?.toLowerCase() === email);
      if (existingMember) {
        return res.status(400).json({ 
          success: false, 
          message: "User is already a member of this organization" 
        });
      }

      // Check for existing pending invitation
      const existingInvitations = await storage.getOrganizationInvitations(userOrg.id);
      const pendingInvite = existingInvitations.find(inv => 
        inv.email.toLowerCase() === email && 
        inv.status === 'pending'
      );

      if (pendingInvite) {
        return res.status(400).json({ 
          success: false, 
          message: "An invitation has already been sent to this email" 
        });
      }

      // Generate unique token
      const token = nanoid(32);

      // Create invitation
      const invitation = await storage.createInvitation({
        organizationId: userOrg.id,
        email,
        token,
        invitedBy: userId,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });

      // Get inviter's name for email
      const inviter = await storage.getUser(userId);
      const inviterName = inviter?.firstName 
        ? `${inviter.firstName}${inviter.lastName ? ' ' + inviter.lastName : ''}`
        : 'A team member';

      // Send invitation email
      const inviteUrl = `${process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 'http://localhost:5000'}/accept-invite/${token}`;

      const emailSent = await sendInvitationEmail(email, userOrg.name, inviterName, inviteUrl);

      if (!emailSent) {
        // Delete the invitation if email fails
        await storage.deleteInvitation(invitation.id);
        return res.status(500).json({ 
          success: false, 
          message: "Failed to send invitation email. Please try again later." 
        });
      }

      res.json({ 
        success: true, 
        message: `Invitation sent to ${email}`,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          status: invitation.status,
          expiresAt: invitation.expiresAt
        }
      });

    } catch (error: any) {
      console.error("Invite member error:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to send invitation" 
      });
    }
  });
}
