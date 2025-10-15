export interface EmailTemplateVariables {
  url?: string;
  code?: string;
  user?: {
    name?: string;
    email?: string;
  };
  date?: string;
  ip?: string;
  [key: string]: any;
}

export enum EmailTemplateType {
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  MFA_CODE = 'mfa_code',
  WELCOME = 'welcome',
  PASSWORD_CHANGED = 'password_changed',
  LOAN_PAYMENT_REMINDER = 'loan_payment_reminder',
  NEW_LOAN_CONFIRMATION = 'new_loan_confirmation',
  GENERAL_REMINDER = 'general_reminder',
}

export class EmailTemplateService {
  private static replaceVariables(template: string, variables: EmailTemplateVariables): string {
    let result = template;
    
    Object.keys(variables).forEach(key => {
      const value = variables[key];
      if (typeof value === 'object') {
        Object.keys(value).forEach(subKey => {
          const regex = new RegExp(`{{${key}\\.${subKey}}}`, 'g');
          result = result.replace(regex, value[subKey] || '');
        });
      } else {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, value || '');
      }
    });
    
    // No image replacement needed - templates use text branding
    
    return result;
  }

  static getTemplate(type: EmailTemplateType, variables: EmailTemplateVariables): { subject: string; html: string; text: string } {
    const templates = {
      [EmailTemplateType.EMAIL_VERIFICATION]: {
        subject: 'Verify Your Email - Morouna Loans',
        html: EMAIL_VERIFICATION_TEMPLATE,
        text: `Welcome to Morouna Loans!

To complete your registration and secure your account, please verify your email address by clicking the link below:

${variables.url}

This link will expire in 24 hours. If you didn't create an account with Morouna Loans, please ignore this email.

Need help? Contact us at Abdullah@akm-labs.com

© 2025 Morouna Loans by AKM Labs. All rights reserved.`
      },
      [EmailTemplateType.PASSWORD_RESET]: {
        subject: 'Reset Your Password - Morouna Loans',
        html: PASSWORD_RESET_TEMPLATE,
        text: `We received a request to reset the password for your Morouna Loans account.

Click the link below to create a new password:

${variables.url}

⚠️ Security Alert: If you didn't request a password reset, please ignore this email and ensure your account is secure. This link will expire in 1 hour.

Need help? Contact us at Abdullah@akm-labs.com

© 2025 Morouna Loans by AKM Labs. All rights reserved.`
      },
      [EmailTemplateType.MFA_CODE]: {
        subject: 'Your Verification Code - Morouna Loans',
        html: MFA_CODE_TEMPLATE,
        text: `Your Morouna Loans verification code is: ${variables.code}

This code will expire in 10 minutes.

🔒 Security Tip: Never share this code with anyone, including Morouna Loans staff.

Didn't try to sign in? If you didn't attempt to access your account, please contact our support team immediately.

Need help? Contact us at Abdullah@akm-labs.com

© 2025 Morouna Loans by AKM Labs. All rights reserved.`
      },
      [EmailTemplateType.WELCOME]: {
        subject: 'Welcome to Morouna Loans! 🎉',
        html: WELCOME_TEMPLATE,
        text: `Welcome to Morouna Loans!

Hi ${variables.user?.name || 'Valued Customer'},

Thank you for choosing Morouna Loans! Your account has been successfully created and verified.

Key Features:
• Bank Management - Track all Saudi banks and facility agreements
• AI Chat Assistant - Natural language conversations about your portfolio
• Portfolio Dashboard - Real-time overview of exposure and utilization

Get Started:
1. Complete your profile and add banking relationships
2. Import your existing loan facilities
3. Explore AI-powered insights
4. Set up automated alerts and reminders

Questions? We're here to help! Abdullah@akm-labs.com

© 2025 Morouna Loans by AKM Labs. All rights reserved.`
      },
      [EmailTemplateType.PASSWORD_CHANGED]: {
        subject: 'Password Changed Successfully - Morouna Loans',
        html: PASSWORD_CHANGED_TEMPLATE,
        text: `Your Morouna Loans password has been successfully changed.

Account: ${variables.user?.email}
Changed on: ${variables.date}
IP Address: ${variables.ip}

⚠️ Didn't make this change?
If you didn't change your password, your account may be compromised. Please contact our support team immediately at Abdullah@akm-labs.com

© 2025 Morouna Loans by AKM Labs. All rights reserved.`
      },
      [EmailTemplateType.LOAN_PAYMENT_REMINDER]: {
        subject: 'Loan Payment Reminder - Morouna Loans',
        html: LOAN_PAYMENT_REMINDER_TEMPLATE,
        text: `Upcoming Payment Due

Hi ${variables.user_name || 'Valued Customer'},

This is a friendly reminder that you have a loan payment coming up soon.

Loan Facility: ${variables.loan_name}
Bank: ${variables.bank_name}
Payment Amount: ${variables.payment_amount}
Due Date: ${variables.due_date}
Days Until Due: ${variables.days_remaining} days

Please ensure timely payment to avoid penalties.

Need help? Contact us at Abdullah@akm-labs.com

© 2025 Morouna Loans by AKM Labs. All rights reserved.`
      },
      [EmailTemplateType.NEW_LOAN_CONFIRMATION]: {
        subject: 'New Loan Confirmation - {{reference_number}}',
        html: NEW_LOAN_CONFIRMATION_TEMPLATE,
        text: `New Loan Confirmation

Hi ${variables.user_name || 'Valued Customer'},

Your loan has been successfully created and is now active in the system.

Loan Details:
Reference Number: ${variables.reference_number}
Bank: ${variables.bank_name}
Facility: ${variables.facility_name}
Amount: ${variables.loan_amount}
Due Date: ${variables.due_date}
All-in Rate: ${variables.all_in_rate}%

Please mark your calendar for the payment due date. You will receive payment reminders as the due date approaches.

Need help? Contact us at Abdullah@akm-labs.com

© 2025 Morouna Loans by AKM Labs. All rights reserved.`
      },
      [EmailTemplateType.GENERAL_REMINDER]: {
        subject: '{{reminder_title}} - Morouna Loans',
        html: GENERAL_REMINDER_TEMPLATE,
        text: `{{reminder_heading}}

Hi ${variables.user_name || 'Valued Customer'},

{{reminder_message}}

{{additional_info_text}}

Need help? Contact us at Abdullah@akm-labs.com

© 2025 Morouna Loans by AKM Labs. All rights reserved.`
      },
    };

    const template = templates[type];
    return {
      subject: this.replaceVariables(template.subject, variables),
      html: this.replaceVariables(template.html, variables),
      text: this.replaceVariables(template.text, variables),
    };
  }
}

const EMAIL_VERIFICATION_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - Morouna Loans</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header with Background -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #5FD4B3 0%, #3BA88F 100%); padding: 50px 40px; text-align: center; position: relative;">
                            <h1 style="color: #ffffff; font-size: 36px; margin: 0 0 10px 0; font-weight: 700; letter-spacing: -1px;">Morouna Loans</h1>
                            <p style="color: #ffffff; font-size: 14px; margin: 0; opacity: 0.9;">by AKM Labs</p>
                            <h1 style="color: #ffffff; font-size: 28px; margin: 15px 0 0 0; font-weight: 600;">Welcome to Morouna Loans!</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="color: #2D3748; font-size: 24px; margin: 0 0 20px 0; font-weight: 600;">Verify Your Email Address</h2>
                            
                            <p style="color: #4A5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Thank you for signing up with Morouna Loans! We're excited to have you on board.
                            </p>
                            
                            <p style="color: #4A5568; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                To complete your registration and secure your account, please verify your email address by clicking the button below:
                            </p>
                            
                            <!-- Button -->
                            <table role="presentation" style="margin: 0 auto;">
                                <tr>
                                    <td style="border-radius: 8px; background: linear-gradient(135deg, #5FD4B3 0%, #3BA88F 100%);">
                                        <a href="{{url}}" target="_blank" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                                            Verify Email Address
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                                Or copy and paste this link into your browser:
                            </p>
                            <p style="color: #5FD4B3; font-size: 14px; line-height: 1.6; margin: 10px 0 0 0; word-break: break-all;">
                                {{url}}
                            </p>
                            
                            <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #E2E8F0;">
                                <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 0;">
                                    <strong>Security Note:</strong> This link will expire in 24 hours. If you didn't create an account with Morouna Loans, please ignore this email.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #F7FAFC; padding: 30px 40px; text-align: center;">
                            <p style="color: #718096; font-size: 14px; margin: 0 0 10px 0;">
                                Need help? Contact us at <a href="mailto:Abdullah@akm-labs.com" style="color: #5FD4B3; text-decoration: none;">Abdullah@akm-labs.com</a>
                            </p>
                            <p style="color: #A0AEC0; font-size: 12px; margin: 0;">
                                © 2025 Morouna Loans by AKM Labs. All rights reserved.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

const PASSWORD_RESET_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - Morouna Loans</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header with Background -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #5FD4B3 0%, #3BA88F 100%); padding: 50px 40px; text-align: center;">
                            <h1 style="color: #ffffff; font-size: 36px; margin: 0 0 10px 0; font-weight: 700; letter-spacing: -1px;">Morouna Loans</h1>
                            <p style="color: #ffffff; font-size: 14px; margin: 0; opacity: 0.9;">by AKM Labs</p>
                            <h1 style="color: #ffffff; font-size: 28px; margin: 15px 0 0 0; font-weight: 600;">Password Reset Request</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="color: #2D3748; font-size: 24px; margin: 0 0 20px 0; font-weight: 600;">Reset Your Password</h2>
                            
                            <p style="color: #4A5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                We received a request to reset the password for your Morouna Loans account.
                            </p>
                            
                            <p style="color: #4A5568; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                Click the button below to create a new password:
                            </p>
                            
                            <!-- Button -->
                            <table role="presentation" style="margin: 0 auto;">
                                <tr>
                                    <td style="border-radius: 8px; background: linear-gradient(135deg, #5FD4B3 0%, #3BA88F 100%);">
                                        <a href="{{url}}" target="_blank" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                                Or copy and paste this link into your browser:
                            </p>
                            <p style="color: #5FD4B3; font-size: 14px; line-height: 1.6; margin: 10px 0 0 0; word-break: break-all;">
                                {{url}}
                            </p>
                            
                            <div style="margin-top: 30px; padding: 20px; background-color: #FFF5F5; border-left: 4px solid #FC8181; border-radius: 4px;">
                                <p style="color: #C53030; font-size: 14px; line-height: 1.6; margin: 0;">
                                    <strong>⚠️ Security Alert:</strong> If you didn't request a password reset, please ignore this email and ensure your account is secure. This link will expire in 1 hour.
                                </p>
                            </div>
                            
                            <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #E2E8F0;">
                                <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 0;">
                                    <strong>Tips for a strong password:</strong>
                                </p>
                                <ul style="color: #718096; font-size: 14px; line-height: 1.6; margin: 10px 0 0 20px;">
                                    <li>Use at least 8 characters</li>
                                    <li>Include uppercase and lowercase letters</li>
                                    <li>Add numbers and special characters</li>
                                    <li>Avoid common words or personal information</li>
                                </ul>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #F7FAFC; padding: 30px 40px; text-align: center;">
                            <p style="color: #718096; font-size: 14px; margin: 0 0 10px 0;">
                                Need help? Contact us at <a href="mailto:Abdullah@akm-labs.com" style="color: #5FD4B3; text-decoration: none;">Abdullah@akm-labs.com</a>
                            </p>
                            <p style="color: #A0AEC0; font-size: 12px; margin: 0;">
                                © 2025 Morouna Loans by AKM Labs. All rights reserved.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

const MFA_CODE_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Two-Factor Authentication - Morouna Loans</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header with Background -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #5FD4B3 0%, #3BA88F 100%); padding: 50px 40px; text-align: center;">
                            <h1 style="color: #ffffff; font-size: 36px; margin: 0 0 10px 0; font-weight: 700; letter-spacing: -1px;">Morouna Loans</h1>
                            <p style="color: #ffffff; font-size: 14px; margin: 0; opacity: 0.9;">by AKM Labs</p>
                            <h1 style="color: #ffffff; font-size: 28px; margin: 15px 0 0 0; font-weight: 600;">Two-Factor Authentication</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="color: #2D3748; font-size: 24px; margin: 0 0 20px 0; font-weight: 600;">Your Security Code</h2>
                            
                            <p style="color: #4A5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                You're attempting to sign in to your Morouna Loans account. To complete the login process, please use the verification code below:
                            </p>
                            
                            <!-- Verification Code Box -->
                            <div style="background: linear-gradient(135deg, #E6F7F3 0%, #D1F2E8 100%); border: 2px solid #5FD4B3; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                                <p style="color: #2D3748; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                                    Verification Code
                                </p>
                                <p style="color: #2D3748; font-size: 42px; font-weight: 700; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                    {{code}}
                                </p>
                                <p style="color: #718096; font-size: 13px; margin: 10px 0 0 0;">
                                    This code expires in 10 minutes
                                </p>
                            </div>
                            
                            <p style="color: #4A5568; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
                                Enter this code in the verification screen to continue.
                            </p>
                            
                            <div style="margin-top: 30px; padding: 20px; background-color: #EBF8FF; border-left: 4px solid #4299E1; border-radius: 4px;">
                                <p style="color: #2C5282; font-size: 14px; line-height: 1.6; margin: 0;">
                                    <strong>🔒 Security Tip:</strong> Two-factor authentication adds an extra layer of security to your account. Never share this code with anyone, including Morouna Loans staff.
                                </p>
                            </div>
                            
                            <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #E2E8F0;">
                                <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 0;">
                                    <strong>Didn't try to sign in?</strong> If you didn't attempt to access your account, please contact our support team immediately and change your password.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #F7FAFC; padding: 30px 40px; text-align: center;">
                            <p style="color: #718096; font-size: 14px; margin: 0 0 10px 0;">
                                Need help? Contact us at <a href="mailto:Abdullah@akm-labs.com" style="color: #5FD4B3; text-decoration: none;">Abdullah@akm-labs.com</a>
                            </p>
                            <p style="color: #A0AEC0; font-size: 12px; margin: 0;">
                                © 2025 Morouna Loans by AKM Labs. All rights reserved.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

const WELCOME_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Morouna Loans</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header with Background -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #5FD4B3 0%, #3BA88F 100%); padding: 50px 40px; text-align: center;">
                            <h1 style="color: #ffffff; font-size: 36px; margin: 0 0 10px 0; font-weight: 700; letter-spacing: -1px;">Morouna Loans</h1>
                            <p style="color: #ffffff; font-size: 14px; margin: 0; opacity: 0.9;">by AKM Labs</p>
                            <h1 style="color: #ffffff; font-size: 32px; margin: 15px 0 0 0; font-weight: 600;">Welcome Aboard! 🎉</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="color: #2D3748; font-size: 24px; margin: 0 0 20px 0; font-weight: 600;">Your Account is Ready!</h2>
                            
                            <p style="color: #4A5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Hi <strong>{{user.name}}</strong>,
                            </p>
                            
                            <p style="color: #4A5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Thank you for choosing Morouna Loans! Your account has been successfully created and verified. We're excited to help you manage your loan portfolio with powerful tools and insights.
                            </p>
                            
                            <div style="background-color: #F0FFF4; border-left: 4px solid #48BB78; border-radius: 4px; padding: 20px; margin: 30px 0;">
                                <p style="color: #22543D; font-size: 14px; margin: 0 0 15px 0; font-weight: 600;">
                                    ✨ Key Features You'll Love:
                                </p>
                                <ul style="color: #22543D; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                                    <li><strong>Bank Management:</strong> Track all Saudi banks and facility agreements</li>
                                    <li><strong>AI Chat Assistant:</strong> Natural language conversations about your portfolio</li>
                                    <li><strong>Portfolio Dashboard:</strong> Real-time overview of exposure and utilization</li>
                                </ul>
                            </div>
                            
                            <div style="margin-top: 30px; padding: 25px; background-color: #EDF2F7; border-radius: 8px;">
                                <p style="color: #2D3748; font-size: 16px; margin: 0 0 15px 0; font-weight: 600;">
                                    🚀 Get Started in 4 Easy Steps:
                                </p>
                                <ol style="color: #4A5568; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                                    <li>Complete your profile and add banking relationships</li>
                                    <li>Import your existing loan facilities</li>
                                    <li>Explore AI-powered insights</li>
                                    <li>Set up automated alerts and reminders</li>
                                </ol>
                            </div>
                            
                            <p style="color: #4A5568; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
                                Questions? We're here to help! Our support team is just an email away.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #F7FAFC; padding: 30px 40px; text-align: center;">
                            <p style="color: #718096; font-size: 14px; margin: 0 0 10px 0;">
                                Need help? Contact us at <a href="mailto:Abdullah@akm-labs.com" style="color: #5FD4B3; text-decoration: none;">Abdullah@akm-labs.com</a>
                            </p>
                            <p style="color: #A0AEC0; font-size: 12px; margin: 0;">
                                © 2025 Morouna Loans by AKM Labs. All rights reserved.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

const PASSWORD_CHANGED_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Changed - Morouna Loans</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header with Background -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #5FD4B3 0%, #3BA88F 100%); padding: 50px 40px; text-align: center;">
                            <h1 style="color: #ffffff; font-size: 36px; margin: 0 0 10px 0; font-weight: 700; letter-spacing: -1px;">Morouna Loans</h1>
                            <p style="color: #ffffff; font-size: 14px; margin: 0; opacity: 0.9;">by AKM Labs</p>
                            <h1 style="color: #ffffff; font-size: 28px; margin: 15px 0 0 0; font-weight: 600;">Password Changed Successfully</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="color: #2D3748; font-size: 24px; margin: 0 0 20px 0; font-weight: 600;">Security Update Confirmation</h2>
                            
                            <p style="color: #4A5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Your Morouna Loans password has been successfully changed.
                            </p>
                            
                            <div style="background-color: #F0FFF4; border-left: 4px solid #48BB78; border-radius: 4px; padding: 20px; margin: 30px 0;">
                                <p style="color: #22543D; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">
                                    ✅ Change Details:
                                </p>
                                <ul style="color: #22543D; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px; list-style: none;">
                                    <li><strong>Account:</strong> {{user.email}}</li>
                                    <li><strong>Changed on:</strong> {{date}}</li>
                                    <li><strong>IP Address:</strong> {{ip}}</li>
                                </ul>
                            </div>
                            
                            <div style="margin-top: 30px; padding: 20px; background-color: #FFF5F5; border-left: 4px solid #FC8181; border-radius: 4px;">
                                <p style="color: #C53030; font-size: 14px; line-height: 1.6; margin: 0;">
                                    <strong>⚠️ Didn't make this change?</strong><br/>
                                    If you didn't change your password, your account may be compromised. Please contact our support team immediately at Abdullah@akm-labs.com
                                </p>
                            </div>
                            
                            <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #E2E8F0;">
                                <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 0;">
                                    <strong>Security Tip:</strong> We recommend changing your password regularly and never sharing it with anyone.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #F7FAFC; padding: 30px 40px; text-align: center;">
                            <p style="color: #718096; font-size: 14px; margin: 0 0 10px 0;">
                                Need help? Contact us at <a href="mailto:Abdullah@akm-labs.com" style="color: #5FD4B3; text-decoration: none;">Abdullah@akm-labs.com</a>
                            </p>
                            <p style="color: #A0AEC0; font-size: 12px; margin: 0;">
                                © 2025 Morouna Loans by AKM Labs. All rights reserved.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

const LOAN_PAYMENT_REMINDER_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Loan Payment Reminder - Morouna Loans</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header with Background -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #5FD4B3 0%, #3BA88F 100%); padding: 50px 40px; text-align: center;">
                            <h1 style="color: #ffffff; font-size: 36px; margin: 0 0 10px 0; font-weight: 700; letter-spacing: -1px;">Morouna Loans</h1>
                            <p style="color: #ffffff; font-size: 14px; margin: 0; opacity: 0.9;">by AKM Labs</p>
                            <h1 style="color: #ffffff; font-size: 28px; margin: 15px 0 0 0; font-weight: 600;">Payment Reminder</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="color: #2D3748; font-size: 24px; margin: 0 0 20px 0; font-weight: 600;">Upcoming Payment Due</h2>
                            
                            <p style="color: #4A5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Hi <strong>{{user_name}}</strong>,
                            </p>
                            
                            <p style="color: #4A5568; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                This is a friendly reminder that you have a loan payment coming up soon.
                            </p>
                            
                            <div style="background: linear-gradient(135deg, #E6F7F3 0%, #D1F2E8 100%); border: 2px solid #5FD4B3; border-radius: 12px; padding: 25px; margin: 30px 0;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 10px 0; color: #2D3748; font-size: 14px; font-weight: 600;">Loan Facility:</td>
                                        <td style="padding: 10px 0; color: #2D3748; font-size: 14px; text-align: right;">{{loan_name}}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #2D3748; font-size: 14px; font-weight: 600;">Bank:</td>
                                        <td style="padding: 10px 0; color: #2D3748; font-size: 14px; text-align: right;">{{bank_name}}</td>
                                    </tr>
                                    <tr style="border-top: 1px solid #5FD4B3;">
                                        <td style="padding: 15px 0 10px 0; color: #2D3748; font-size: 16px; font-weight: 700;">Payment Amount:</td>
                                        <td style="padding: 15px 0 10px 0; color: #2D3748; font-size: 20px; font-weight: 700; text-align: right;">{{payment_amount}}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #2D3748; font-size: 14px; font-weight: 600;">Due Date:</td>
                                        <td style="padding: 10px 0; color: #2D3748; font-size: 14px; text-align: right;">{{due_date}}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #C53030; font-size: 14px; font-weight: 600;">Days Until Due:</td>
                                        <td style="padding: 10px 0; color: #C53030; font-size: 18px; font-weight: 700; text-align: right;">{{days_remaining}} days</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <div style="margin-top: 30px; padding: 20px; background-color: #FFF5F5; border-left: 4px solid #FC8181; border-radius: 4px;">
                                <p style="color: #C53030; font-size: 14px; line-height: 1.6; margin: 0;">
                                    <strong>⏰ Important:</strong> Please ensure timely payment to avoid late fees and penalties.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #F7FAFC; padding: 30px 40px; text-align: center;">
                            <p style="color: #718096; font-size: 14px; margin: 0 0 10px 0;">
                                Need help? Contact us at <a href="mailto:Abdullah@akm-labs.com" style="color: #5FD4B3; text-decoration: none;">Abdullah@akm-labs.com</a>
                            </p>
                            <p style="color: #A0AEC0; font-size: 12px; margin: 0;">
                                © 2025 Morouna Loans by AKM Labs. All rights reserved.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

const GENERAL_REMINDER_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reminder - Morouna Loans</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header with Background -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #5FD4B3 0%, #3BA88F 100%); padding: 50px 40px; text-align: center;">
                            <h1 style="color: #ffffff; font-size: 36px; margin: 0 0 10px 0; font-weight: 700; letter-spacing: -1px;">Morouna Loans</h1>
                            <p style="color: #ffffff; font-size: 14px; margin: 0; opacity: 0.9;">by AKM Labs</p>
                            <h1 style="color: #ffffff; font-size: 28px; margin: 15px 0 0 0; font-weight: 600;">{{reminder_heading}}</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #4A5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Hi <strong>{{user_name}}</strong>,
                            </p>
                            
                            <p style="color: #4A5568; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                {{reminder_message}}
                            </p>
                            
                            <div style="background: linear-gradient(135deg, #E6F7F3 0%, #D1F2E8 100%); border: 2px solid #5FD4B3; border-radius: 12px; padding: 25px; margin: 30px 0;">
                                {{additional_info}}
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #F7FAFC; padding: 30px 40px; text-align: center;">
                            <p style="color: #718096; font-size: 14px; margin: 0 0 10px 0;">
                                Need help? Contact us at <a href="mailto:Abdullah@akm-labs.com" style="color: #5FD4B3; text-decoration: none;">Abdullah@akm-labs.com</a>
                            </p>
                            <p style="color: #A0AEC0; font-size: 12px; margin: 0;">
                                © 2025 Morouna Loans by AKM Labs. All rights reserved.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

const NEW_LOAN_CONFIRMATION_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Loan Confirmation - Morouna Loans</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header with Background -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #5FD4B3 0%, #3BA88F 100%); padding: 50px 40px; text-align: center;">
                            <h1 style="color: #ffffff; font-size: 36px; margin: 0 0 10px 0; font-weight: 700; letter-spacing: -1px;">Morouna Loans</h1>
                            <p style="color: #ffffff; font-size: 14px; margin: 0; opacity: 0.9;">by AKM Labs</p>
                            <h1 style="color: #ffffff; font-size: 28px; margin: 15px 0 0 0; font-weight: 600;">Loan Confirmation</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="color: #2D3748; font-size: 24px; margin: 0 0 20px 0; font-weight: 600;">Your Loan Has Been Created</h2>
                            
                            <p style="color: #4A5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Hi <strong>{{user_name}}</strong>,
                            </p>
                            
                            <p style="color: #4A5568; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                Your loan has been successfully created and is now active in the system.
                            </p>
                            
                            <div style="background: linear-gradient(135deg, #E6F7F3 0%, #D1F2E8 100%); border: 2px solid #5FD4B3; border-radius: 12px; padding: 25px; margin: 30px 0;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 10px 0; color: #2D3748; font-size: 14px; font-weight: 600;">Reference Number:</td>
                                        <td style="padding: 10px 0; color: #2D3748; font-size: 14px; text-align: right;">{{reference_number}}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #2D3748; font-size: 14px; font-weight: 600;">Bank:</td>
                                        <td style="padding: 10px 0; color: #2D3748; font-size: 14px; text-align: right;">{{bank_name}}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #2D3748; font-size: 14px; font-weight: 600;">Facility:</td>
                                        <td style="padding: 10px 0; color: #2D3748; font-size: 14px; text-align: right;">{{facility_name}}</td>
                                    </tr>
                                    <tr style="border-top: 1px solid #5FD4B3;">
                                        <td style="padding: 15px 0 10px 0; color: #2D3748; font-size: 16px; font-weight: 700;">Loan Amount:</td>
                                        <td style="padding: 15px 0 10px 0; color: #2D3748; font-size: 20px; font-weight: 700; text-align: right;">{{loan_amount}}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #2D3748; font-size: 14px; font-weight: 600;">Due Date:</td>
                                        <td style="padding: 10px 0; color: #2D3748; font-size: 14px; text-align: right;">{{due_date}}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #2D3748; font-size: 14px; font-weight: 600;">All-in Rate:</td>
                                        <td style="padding: 10px 0; color: #2D3748; font-size: 14px; text-align: right;">{{all_in_rate}}%</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <div style="margin-top: 30px; padding: 20px; background-color: #EBF8FF; border-left: 4px solid #4299E1; border-radius: 4px;">
                                <p style="color: #2C5282; font-size: 14px; line-height: 1.6; margin: 0;">
                                    <strong>📅 Important:</strong> Please mark your calendar for the payment due date. You will receive payment reminders as the due date approaches.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #F7FAFC; padding: 30px 40px; text-align: center;">
                            <p style="color: #718096; font-size: 14px; margin: 0 0 10px 0;">
                                Need help? Contact us at <a href="mailto:Abdullah@akm-labs.com" style="color: #5FD4B3; text-decoration: none;">Abdullah@akm-labs.com</a>
                            </p>
                            <p style="color: #A0AEC0; font-size: 12px; margin: 0;">
                                © 2025 Morouna Loans by AKM Labs. All rights reserved.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
