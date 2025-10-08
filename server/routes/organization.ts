import type { Express } from "express";
import type { AppDependencies } from "../types";
import { nanoid } from "nanoid";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { attachOrganizationContext, requireOrganization, requireOrgOwner } from "../organizationMiddleware";
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

  // Get invitation details (public endpoint for validation)
  app.get('/api/organization/invitation/:token', async (req, res) => {
    try {
      const { token } = req.params;

      const invitation = await storage.getInvitation(token);

      if (!invitation) {
        return res.status(404).json({ 
          success: false, 
          message: "Invitation not found" 
        });
      }

      // Check if invitation is expired
      if (invitation.expiresAt && new Date() > new Date(invitation.expiresAt)) {
        return res.status(400).json({ 
          success: false, 
          message: "This invitation has expired" 
        });
      }

      // Check if invitation is already used
      if (invitation.status !== 'pending') {
        return res.status(400).json({ 
          success: false, 
          message: "This invitation has already been used" 
        });
      }

      // Get organization details
      const organization = await storage.getOrganization(invitation.organizationId);

      if (!organization) {
        return res.status(404).json({ 
          success: false, 
          message: "Organization not found" 
        });
      }

      res.json({ 
        success: true, 
        invitation: {
          email: invitation.email,
          organizationName: organization.name,
          expiresAt: invitation.expiresAt
        }
      });

    } catch (error: any) {
      console.error("Get invitation error:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to get invitation details" 
      });
    }
  });

  // Accept invitation (requires authentication)
  app.post('/api/organization/accept-invite', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.claims.sub;
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ 
          success: false, 
          message: "Invitation token is required" 
        });
      }

      const invitation = await storage.getInvitation(token);

      if (!invitation) {
        return res.status(404).json({ 
          success: false, 
          message: "Invitation not found" 
        });
      }

      // Check if invitation is expired
      if (invitation.expiresAt && new Date() > new Date(invitation.expiresAt)) {
        return res.status(400).json({ 
          success: false, 
          message: "This invitation has expired" 
        });
      }

      // Check if invitation is already used
      if (invitation.status !== 'pending') {
        return res.status(400).json({ 
          success: false, 
          message: "This invitation has already been used" 
        });
      }

      // Get user's email to verify
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }

      // Verify email matches invitation
      if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
        return res.status(403).json({ 
          success: false, 
          message: "This invitation was sent to a different email address" 
        });
      }

      // Check if user is already a member
      const isAlreadyMember = await storage.isUserInOrganization(userId, invitation.organizationId);

      if (isAlreadyMember) {
        // Mark invitation as accepted anyway
        await storage.deleteInvitation(invitation.id);
        return res.status(400).json({ 
          success: false, 
          message: "You are already a member of this organization" 
        });
      }

      // Add user to organization
      await storage.addMember({
        organizationId: invitation.organizationId,
        userId,
        isOwner: false
      });

      // Mark invitation as accepted by deleting it
      await storage.deleteInvitation(invitation.id);

      // Get organization details for response
      const organization = await storage.getOrganization(invitation.organizationId);

      res.json({ 
        success: true, 
        message: `Successfully joined ${organization?.name || 'the organization'}`,
        organization: {
          id: invitation.organizationId,
          name: organization?.name
        }
      });

    } catch (error: any) {
      console.error("Accept invitation error:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to accept invitation" 
      });
    }
  });

  // Get organization members
  app.get('/api/organization/members', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.claims.sub;

      // Get user's organization
      const userOrg = await storage.getUserOrganization(userId);

      if (!userOrg) {
        return res.status(404).json({ 
          success: false, 
          message: "Organization not found" 
        });
      }

      // Get all members
      const members = await storage.getOrganizationMembers(userOrg.id);

      // Return members with user details
      const memberList = members.map(member => ({
        id: member.id,
        userId: member.userId,
        isOwner: member.isOwner,
        joinedAt: member.joinedAt,
        user: {
          id: member.user.id,
          email: member.user.email,
          firstName: member.user.firstName,
          lastName: member.user.lastName,
          profileImageUrl: member.user.profileImageUrl
        }
      }));

      res.json({ 
        success: true, 
        members: memberList,
        organization: {
          id: userOrg.id,
          name: userOrg.name
        }
      });

    } catch (error: any) {
      console.error("Get members error:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to get organization members" 
      });
    }
  });

  // Remove organization member (owner only)
  app.delete('/api/organization/members/:userId', isAuthenticated, async (req, res) => {
    try {
      const currentUserId = (req as any).user.claims.sub;
      const { userId: targetUserId } = req.params;

      // Get current user's organization
      const userOrg = await storage.getUserOrganization(currentUserId);

      if (!userOrg) {
        return res.status(404).json({ 
          success: false, 
          message: "Organization not found" 
        });
      }

      // Check if current user is owner
      const members = await storage.getOrganizationMembers(userOrg.id);
      const currentMember = members.find(m => m.userId === currentUserId);

      if (!currentMember?.isOwner) {
        return res.status(403).json({ 
          success: false, 
          message: "Only organization owners can remove members" 
        });
      }

      // Check if target user is a member of the organization
      const targetMember = members.find(m => m.userId === targetUserId);

      if (!targetMember) {
        return res.status(404).json({ 
          success: false, 
          message: "User is not a member of this organization" 
        });
      }

      // Prevent owner from removing themselves if they're the only member
      if (currentUserId === targetUserId) {
        if (members.length > 1) {
          return res.status(400).json({ 
            success: false, 
            message: "You cannot remove yourself while there are other members. Please transfer ownership first or have another owner remove you." 
          });
        }
        // If they're the only member, they can remove themselves (organization will be orphaned but that's handled elsewhere)
      }

      // Prevent removing another owner (only one owner allowed in this simple model)
      if (targetMember.isOwner && currentUserId !== targetUserId) {
        return res.status(403).json({ 
          success: false, 
          message: "Cannot remove the organization owner" 
        });
      }

      // Remove the member
      await storage.removeMember(targetUserId, userOrg.id);

      res.json({ 
        success: true, 
        message: "Member removed successfully" 
      });

    } catch (error: any) {
      console.error("Remove member error:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to remove member" 
      });
    }
  });

  // Get pending invitations (owner only)
  app.get('/api/organization/invitations', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.claims.sub;

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
          message: "Only organization owners can view invitations" 
        });
      }

      // Get invitations
      const invitations = await storage.getOrganizationInvitations(userOrg.id);

      res.json({ 
        success: true, 
        invitations: invitations.map(inv => ({
          id: inv.id,
          email: inv.email,
          status: inv.status,
          createdAt: inv.createdAt,
          expiresAt: inv.expiresAt
        }))
      });

    } catch (error: any) {
      console.error("Get invitations error:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to get invitations" 
      });
    }
  });
}
