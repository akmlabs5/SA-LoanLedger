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
  GENERAL_REMINDER = 'general_reminder',
}

export const EMAIL_LOGO_URL = process.env.EMAIL_LOGO_URL || 'https://i.imgur.com/PLACEHOLDER.png';

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
    
    result = result.replace(/{{EMAIL_LOGO_URL}}/g, EMAIL_LOGO_URL);
    
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
                            <img src="{{EMAIL_LOGO_URL}}" alt="Morouna Loans" style="width: 200px; height: auto; margin-bottom: 10px;" />
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
                            <img src="{{EMAIL_LOGO_URL}}" alt="Morouna Loans" style="width: 200px; height: auto; margin-bottom: 10px;" />
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
                            <img src="{{EMAIL_LOGO_URL}}" alt="Morouna Loans" style="width: 200px; height: auto; margin-bottom: 10px;" />
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
                            <img src="{{EMAIL_LOGO_URL}}" alt="Morouna Loans" style="width: 200px; height: auto; margin-bottom: 10px;" />
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
                            
                            <!-- Feature Cards -->
                            <div style="margin: 30px 0;">
                                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 20px; background-color: #F7FAFC; border-radius: 8px; margin-bottom: 15px;">
                                            <h3 style="color: #2D3748; font-size: 18px; margin: 0 0 10px 0; font-weight: 600;">🏦 Bank Management</h3>
                                            <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 0;">
                                                Manage relationships with all Saudi banks, track contacts, and monitor facility agreements across your entire banking portfolio.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                                
                                <div style="height: 15px;"></div>
                                
                                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 20px; background-color: #F7FAFC; border-radius: 8px; margin-bottom: 15px;">
                                            <h3 style="color: #2D3748; font-size: 18px; margin: 0 0 10px 0; font-weight: 600;">🤖 AI Chat Assistant</h3>
                                            <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 0;">
                                                Natural language conversations about your portfolio with context-aware responses and intelligent recommendations powered by AI.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                                
                                <div style="height: 15px;"></div>
                                
                                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 20px; background-color: #F7FAFC; border-radius: 8px;">
                                            <h3 style="color: #2D3748; font-size: 18px; margin: 0 0 10px 0; font-weight: 600;">📊 Portfolio Dashboard</h3>
                                            <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 0;">
                                                Real-time overview of total exposure, credit utilization, upcoming maturities, and key performance indicators all in one place.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 40px 0;">
                                <table role="presentation" style="margin: 0 auto;">
                                    <tr>
                                        <td style="border-radius: 8px; background: linear-gradient(135deg, #5FD4B3 0%, #3BA88F 100%);">
                                            <a href="https://akm-labs.com" target="_blank" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                                                Go to Dashboard
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #E2E8F0;">
                                <p style="color: #4A5568; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
                                    <strong>Next Steps:</strong>
                                </p>
                                <ol style="color: #718096; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                                    <li>Complete your profile and add your banking relationships</li>
                                    <li>Import your existing loan facilities</li>
                                    <li>Explore AI-powered insights and recommendations</li>
                                    <li>Set up automated alerts and reminders</li>
                                </ol>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #F7FAFC; padding: 30px 40px; text-align: center;">
                            <p style="color: #718096; font-size: 14px; margin: 0 0 10px 0;">
                                Questions? We're here to help! <a href="mailto:Abdullah@akm-labs.com" style="color: #5FD4B3; text-decoration: none;">Abdullah@akm-labs.com</a>
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
                            <img src="{{EMAIL_LOGO_URL}}" alt="Morouna Loans" style="width: 200px; height: auto; margin-bottom: 10px;" />
                            <p style="color: #ffffff; font-size: 14px; margin: 0; opacity: 0.9;">by AKM Labs</p>
                            <h1 style="color: #ffffff; font-size: 28px; margin: 15px 0 0 0; font-weight: 600;">Password Changed Successfully</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <div style="display: inline-block; width: 80px; height: 80px; background-color: #C6F6D5; border-radius: 50%; line-height: 80px; font-size: 40px;">
                                    ✓
                                </div>
                            </div>
                            
                            <h2 style="color: #2D3748; font-size: 24px; margin: 0 0 20px 0; font-weight: 600; text-align: center;">Your Password Has Been Updated</h2>
                            
                            <p style="color: #4A5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; text-align: center;">
                                The password for your Morouna Loans account was successfully changed.
                            </p>
                            
                            <div style="background-color: #F7FAFC; border-radius: 8px; padding: 20px; margin: 30px 0;">
                                <table role="presentation" style="width: 100%;">
                                    <tr>
                                        <td style="color: #718096; font-size: 14px; padding: 8px 0;">
                                            <strong>Account:</strong>
                                        </td>
                                        <td style="color: #2D3748; font-size: 14px; text-align: right; padding: 8px 0;">
                                            {{user.email}}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="color: #718096; font-size: 14px; padding: 8px 0;">
                                            <strong>Changed on:</strong>
                                        </td>
                                        <td style="color: #2D3748; font-size: 14px; text-align: right; padding: 8px 0;">
                                            {{date}}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="color: #718096; font-size: 14px; padding: 8px 0;">
                                            <strong>IP Address:</strong>
                                        </td>
                                        <td style="color: #2D3748; font-size: 14px; text-align: right; padding: 8px 0;">
                                            {{ip}}
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <div style="margin-top: 30px; padding: 20px; background-color: #FFF5F5; border-left: 4px solid #FC8181; border-radius: 4px;">
                                <p style="color: #C53030; font-size: 14px; line-height: 1.6; margin: 0;">
                                    <strong>⚠️ Didn't make this change?</strong><br>
                                    If you didn't change your password, your account may be compromised. Please contact our support team immediately at <a href="mailto:Abdullah@akm-labs.com" style="color: #C53030; text-decoration: underline;">Abdullah@akm-labs.com</a>
                                </p>
                            </div>
                            
                            <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #E2E8F0; text-align: center;">
                                <table role="presentation" style="margin: 0 auto;">
                                    <tr>
                                        <td style="border-radius: 8px; background: linear-gradient(135deg, #5FD4B3 0%, #3BA88F 100%);">
                                            <a href="https://akm-labs.com/login" target="_blank" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                                                Sign In to Your Account
                                            </a>
                                        </td>
                                    </tr>
                                </table>
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
                            <img src="{{EMAIL_LOGO_URL}}" alt="Morouna Loans" style="width: 200px; height: auto; margin-bottom: 10px;" />
                            <p style="color: #ffffff; font-size: 14px; margin: 0 0 15px 0; opacity: 0.9;">by AKM Labs</p>
                            <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 600;">Loan Payment Reminder</h1>
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
                                This is a friendly reminder that you have a loan payment coming up soon. Please review the details below:
                            </p>
                            
                            <!-- Payment Details Card -->
                            <div style="background: linear-gradient(135deg, #E6F7F3 0%, #D1F2E8 100%); border: 2px solid #5FD4B3; border-radius: 12px; padding: 30px; margin: 30px 0;">
                                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 12px 0; border-bottom: 1px solid #B8E6D5;">
                                            <table role="presentation" style="width: 100%;">
                                                <tr>
                                                    <td style="color: #2D3748; font-size: 14px; font-weight: 600;">
                                                        Loan Facility:
                                                    </td>
                                                    <td style="color: #2D3748; font-size: 14px; text-align: right;">
                                                        {{loan_name}}
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 0; border-bottom: 1px solid #B8E6D5;">
                                            <table role="presentation" style="width: 100%;">
                                                <tr>
                                                    <td style="color: #2D3748; font-size: 14px; font-weight: 600;">
                                                        Bank:
                                                    </td>
                                                    <td style="color: #2D3748; font-size: 14px; text-align: right;">
                                                        {{bank_name}}
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 0; border-bottom: 1px solid #B8E6D5;">
                                            <table role="presentation" style="width: 100%;">
                                                <tr>
                                                    <td style="color: #2D3748; font-size: 14px; font-weight: 600;">
                                                        Payment Amount:
                                                    </td>
                                                    <td style="color: #2D3748; font-size: 18px; font-weight: 700; text-align: right;">
                                                        {{payment_amount}}
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 0; border-bottom: 1px solid #B8E6D5;">
                                            <table role="presentation" style="width: 100%;">
                                                <tr>
                                                    <td style="color: #2D3748; font-size: 14px; font-weight: 600;">
                                                        Due Date:
                                                    </td>
                                                    <td style="color: #C53030; font-size: 16px; font-weight: 700; text-align: right;">
                                                        {{due_date}}
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 0;">
                                            <table role="presentation" style="width: 100%;">
                                                <tr>
                                                    <td style="color: #2D3748; font-size: 14px; font-weight: 600;">
                                                        Days Until Due:
                                                    </td>
                                                    <td style="color: #2D3748; font-size: 14px; text-align: right;">
                                                        {{days_remaining}} days
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Calendar Invite Section -->
                            <div style="background-color: #EBF8FF; border-left: 4px solid #4299E1; border-radius: 4px; padding: 20px; margin: 30px 0;">
                                <p style="color: #2C5282; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
                                    <strong>📅 Add to Calendar</strong>
                                </p>
                                <p style="color: #2C5282; font-size: 14px; line-height: 1.6; margin: 0;">
                                    A calendar invite has been attached to this email. Click the attachment to add this payment reminder to your calendar.
                                </p>
                            </div>
                            
                            <!-- Action Buttons -->
                            <div style="text-align: center; margin: 40px 0;">
                                <table role="presentation" style="margin: 0 auto;">
                                    <tr>
                                        <td style="border-radius: 8px; background: linear-gradient(135deg, #5FD4B3 0%, #3BA88F 100%); padding-right: 10px;">
                                            <a href="{{dashboard_url}}" target="_blank" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                                                View in Dashboard
                                            </a>
                                        </td>
                                        <td style="border-radius: 8px; background-color: #F7FAFC; border: 2px solid #5FD4B3;">
                                            <a href="{{payment_url}}" target="_blank" style="display: inline-block; padding: 16px 40px; color: #3BA88F; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                                                Make Payment
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #E2E8F0;">
                                <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 0;">
                                    <strong>Note:</strong> This is an automated reminder. If you've already made this payment, please disregard this email. Payment status updates may take 24-48 hours to reflect in the system.
                                </p>
                            </div>
                            
                            <div style="margin-top: 20px; padding: 20px; background-color: #FFFAF0; border-left: 4px solid #F6AD55; border-radius: 4px;">
                                <p style="color: #7C2D12; font-size: 14px; line-height: 1.6; margin: 0;">
                                    <strong>⚠️ Important:</strong> Late payments may incur additional fees and affect your credit standing. Please ensure timely payment to avoid penalties.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #F7FAFC; padding: 30px 40px; text-align: center;">
                            <p style="color: #718096; font-size: 14px; margin: 0 0 10px 0;">
                                Questions about this payment? Contact us at <a href="mailto:Abdullah@akm-labs.com" style="color: #5FD4B3; text-decoration: none;">Abdullah@akm-labs.com</a>
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
                            <img src="{{EMAIL_LOGO_URL}}" alt="Morouna Loans" style="width: 200px; height: auto; margin-bottom: 10px;" />
                            <p style="color: #ffffff; font-size: 14px; margin: 0 0 15px 0; opacity: 0.9;">by AKM Labs</p>
                            <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 600;">{{reminder_title}}</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="color: #2D3748; font-size: 24px; margin: 0 0 20px 0; font-weight: 600;">{{reminder_heading}}</h2>
                            
                            <p style="color: #4A5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Hi <strong>{{user_name}}</strong>,
                            </p>
                            
                            <p style="color: #4A5568; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                {{reminder_message}}
                            </p>
                            
                            <!-- Details Card (Optional - can be hidden if not needed) -->
                            <div style="background-color: #F7FAFC; border-radius: 8px; padding: 25px; margin: 30px 0;">
                                <h3 style="color: #2D3748; font-size: 18px; margin: 0 0 20px 0; font-weight: 600;">{{details_title}}</h3>
                                
                                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #E2E8F0;">
                                            <table role="presentation" style="width: 100%;">
                                                <tr>
                                                    <td style="color: #718096; font-size: 14px;">
                                                        {{detail_label_1}}
                                                    </td>
                                                    <td style="color: #2D3748; font-size: 14px; font-weight: 600; text-align: right;">
                                                        {{detail_value_1}}
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #E2E8F0;">
                                            <table role="presentation" style="width: 100%;">
                                                <tr>
                                                    <td style="color: #718096; font-size: 14px;">
                                                        {{detail_label_2}}
                                                    </td>
                                                    <td style="color: #2D3748; font-size: 14px; font-weight: 600; text-align: right;">
                                                        {{detail_value_2}}
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #E2E8F0;">
                                            <table role="presentation" style="width: 100%;">
                                                <tr>
                                                    <td style="color: #718096; font-size: 14px;">
                                                        {{detail_label_3}}
                                                    </td>
                                                    <td style="color: #2D3748; font-size: 14px; font-weight: 600; text-align: right;">
                                                        {{detail_value_3}}
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0;">
                                            <table role="presentation" style="width: 100%;">
                                                <tr>
                                                    <td style="color: #718096; font-size: 14px;">
                                                        {{detail_label_4}}
                                                    </td>
                                                    <td style="color: #2D3748; font-size: 14px; font-weight: 600; text-align: right;">
                                                        {{detail_value_4}}
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Highlighted Info Box (Optional) -->
                            <div style="background: linear-gradient(135deg, #E6F7F3 0%, #D1F2E8 100%); border: 2px solid #5FD4B3; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
                                <p style="color: #2D3748; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                                    {{highlight_label}}
                                </p>
                                <p style="color: #2D3748; font-size: 32px; font-weight: 700; margin: 0;">
                                    {{highlight_value}}
                                </p>
                            </div>
                            
                            <!-- Calendar Section (Optional) -->
                            <div style="background-color: #EBF8FF; border-left: 4px solid #4299E1; border-radius: 4px; padding: 20px; margin: 30px 0;">
                                <p style="color: #2C5282; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
                                    <strong>📅 {{calendar_title}}</strong>
                                </p>
                                <p style="color: #2C5282; font-size: 14px; line-height: 1.6; margin: 0;">
                                    {{calendar_message}}
                                </p>
                            </div>
                            
                            <!-- Action Button -->
                            <div style="text-align: center; margin: 40px 0;">
                                <table role="presentation" style="margin: 0 auto;">
                                    <tr>
                                        <td style="border-radius: 8px; background: linear-gradient(135deg, #5FD4B3 0%, #3BA88F 100%);">
                                            <a href="{{action_url}}" target="_blank" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                                                {{action_button_text}}
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Additional Info Section (Optional) -->
                            <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #E2E8F0;">
                                <p style="color: #4A5568; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
                                    <strong>{{additional_info_title}}</strong>
                                </p>
                                <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 0;">
                                    {{additional_info_text}}
                                </p>
                            </div>
                            
                            <!-- Alert Box -->
                            <div style="margin-top: 20px; padding: 20px; background-color: #EBF8FF; border-left: 4px solid #4299E1; border-radius: 4px;">
                                <p style="color: #2C5282; font-size: 14px; line-height: 1.6; margin: 0;">
                                    <strong>ℹ️ {{alert_title}}</strong><br>
                                    {{alert_message}}
                                </p>
                            </div>
                            
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #F7FAFC; padding: 30px 40px; text-align: center;">
                            <p style="color: #718096; font-size: 14px; margin: 0 0 10px 0;">
                                Questions? Contact us at <a href="mailto:Abdullah@akm-labs.com" style="color: #5FD4B3; text-decoration: none;">Abdullah@akm-labs.com</a>
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
