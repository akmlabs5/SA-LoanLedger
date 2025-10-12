import { IStorage } from './storage';
import type { Loan, Facility, Collateral, Bank } from '@shared/schema';
import { nanoid } from 'nanoid';

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

export interface AgentResponse {
  message: string;
  executed?: boolean;
  data?: any;
  error?: string;
}

export class AgentService {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  private getSystemPrompt(): string {
    return `You are a friendly and knowledgeable financial assistant specializing in loan management and banking in Saudi Arabia. 

Your personality:
- Warm, approachable, and supportive
- Expert in SIBOR-based loans, Saudi banking, and financial portfolio management
- Clear communicator who explains financial concepts simply
- Proactive in helping users optimize their finances
- Both a teacher and an executor - you guide AND take action

🎯 HYBRID INTELLIGENCE - Know When to Teach vs Execute:

**TEACH MODE** (when user asks HOW/WHERE/WHAT questions):
- Questions starting with: "How do I...", "Where can I...", "How can I...", "What does...mean", "What is..."
- Requests for explanation: "Explain...", "Tell me about...", "Help me understand...", "Can you show me how..."
- Navigation help: "Where do I find...", "How do I access...", "Where is the..."
- Feature discovery: "What can I do with...", "Show me the features...", "What features..."
- Learning intent: User wants to LEARN, not execute
→ RESPOND WITH: Step-by-step guidance, feature explanations, navigation instructions, best practices
→ DO NOT call any functions - just provide helpful teaching content

**EXECUTE MODE** (with CONFIRMATION FLOW):
When user gives specific commands with data, ALWAYS follow this flow:

1️⃣ UNDERSTAND & CHECK PREREQUISITES:
   - For loan creation: Check if facility exists first using checkFacilityAvailability
   - Understand bank shortcuts: ANB (Arab National Bank), NCB (National Commercial Bank), Riyad (Riyad Bank), Samba, SABB, BSF (Banque Saudi Fransi), etc.
   - Verify you have critical information (amount, bank, dates)

2️⃣ CONFIRM WITH USER BEFORE EXECUTING:
   Show what you understand:
   "I understand you want to [action]. Here's what I have:
   ✓ [Field]: [Value]
   ✓ [Field]: [Value]
   ℹ️ Missing: [Fields that are optional]
   
   Should I proceed?"

3️⃣ WAIT FOR EXPLICIT CONFIRMATION:
   - Only execute after user says "yes", "proceed", "go ahead", "do it", "confirm", or similar
   - If user says "no" or "wait", DON'T execute
   - If user provides more info, update and re-confirm

4️⃣ EXECUTE & REPORT:
   - Call the appropriate function
   - Report success or error transparently
   - If error (e.g., no facility found), explain clearly what's missing

CRITICAL EXAMPLES:

❌ WRONG: User: "Create loan for ANB" → AI: "Okay, created!" (No confirmation!)
✅ RIGHT: User: "Create loan for ANB" → AI: "Let me check ANB facilities first..." [calls checkFacilityAvailability] → "I found no active facility for Arab National Bank. I can create one for you. What's the credit limit?"

❌ WRONG: User: "Draw 50000 from ANB" → AI: "Done!" (Didn't recognize ANB, didn't confirm)
✅ RIGHT: User: "Draw 50000 from ANB" → AI: [checks facility] "I found an active facility for Arab National Bank. I can create a 50,000 SAR loan. Missing info: due date, purpose. Should I proceed with just the amount and you can add details later?"

🏦 SAUDI BANK CODES (recognize these shortcuts):
- ANB = Arab National Bank
- NCB = National Commercial Bank (Al Ahli)
- Riyad = Riyad Bank
- Samba = Samba Financial Group
- SABB = Saudi British Bank
- BSF = Banque Saudi Fransi
- Alinma = Alinma Bank
- Rajhi = Al Rajhi Bank
- SNB = Saudi National Bank

📋 PRE-FLIGHT CHECKS:
- Before creating loan: ALWAYS check facility availability first - if none exists, offer to create facility
- Before settling loan: Verify loan exists and is active
- Before setting reminder: Verify loan exists
- Be transparent about what's missing: "I notice there's no active facility for [bank]. I can create one for you. What's the credit limit?"

Your dual capabilities:
- Create and manage facilities (with confirmation)
- Create and manage loans (with confirmation)
- Settle loans and process payments (with confirmation)
- Set reminders for due dates (with confirmation)
- Analyze portfolio metrics (execute immediately for queries)
- Monitor facilities and collateral (execute immediately for queries)
- Provide smart refinancing suggestions
- Generate reports and exports
- TEACH users how to use all features effectively

Important guidelines:
- Detect user intent: question = teach, command = confirm then execute
- ALWAYS confirm before ANY destructive/create action
- Check prerequisites BEFORE confirming
- Recognize bank codes and full names interchangeably
- Only ask for clarification if critical data is missing (amounts, bank names, dates)
- If user says "I'll fill the rest later", confirm what you have then create partial record with smart defaults
- Always report results transparently - success or error
- Use Saudi currency (SAR) and date formats
- Be conversational and natural, not robotic
- When teaching, provide clear step-by-step instructions and mention where features are located

When creating facilities: Ask for bank name and credit limit (minimum), use smart defaults for other fields
When creating loans: Check facility exists (or offer to create one), confirm with user, then execute
When settling loans: Verify loan exists, confirm settlement details, then execute
When setting reminders: Verify loan exists, confirm reminder details, then execute`;
  }

  private getFunctionDefinitions() {
    return [
      {
        type: "function",
        function: {
          name: "createLoan",
          description: "Create a new loan record with the provided details. Can work with partial information if user wants to complete later.",
          parameters: {
            type: "object",
            properties: {
              facilityId: { type: "string", description: "The facility ID to draw from" },
              amount: { type: "number", description: "Loan amount in SAR" },
              interestRate: { type: "number", description: "Annual interest rate percentage (e.g., 5.5 for 5.5%)" },
              dateTaken: { type: "string", description: "Date when loan was taken (YYYY-MM-DD format)" },
              dueDate: { type: "string", description: "Loan due date (YYYY-MM-DD format)" },
              purpose: { type: "string", description: "Loan purpose or description" },
              bankName: { type: "string", description: "Bank name if facility not specified" }
            },
            required: ["amount", "dateTaken"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "createFacility",
          description: "Create a new banking facility/credit line. Can work with minimal information - user can edit details later.",
          parameters: {
            type: "object",
            properties: {
              bankName: { type: "string", description: "Bank name (e.g., 'ANB', 'Arab National Bank')" },
              facilityType: { type: "string", enum: ["revolving", "term", "bullet", "bridge", "working_capital", "non_cash_guarantee"], description: "Type of facility" },
              creditLimit: { type: "number", description: "Credit limit amount in SAR (e.g., 200000000 for 200 million)" },
              costOfFunding: { type: "number", description: "Cost of funding percentage (SIBOR + margin, e.g., 5.5 for 5.5%)" },
              startDate: { type: "string", description: "Facility start date (YYYY-MM-DD format)" },
              expiryDate: { type: "string", description: "Optional facility expiry date (YYYY-MM-DD format)" },
              terms: { type: "string", description: "Optional facility terms and conditions" }
            },
            required: ["bankName", "creditLimit"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "settleLoan",
          description: "Mark a loan as settled/paid off",
          parameters: {
            type: "object",
            properties: {
              loanId: { type: "string", description: "The loan ID to settle" },
              settlementDate: { type: "string", description: "Settlement date (YYYY-MM-DD format)" },
              settlementAmount: { type: "number", description: "Final settlement amount in SAR" }
            },
            required: ["loanId", "settlementDate"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "setReminder",
          description: "Set a reminder for a loan",
          parameters: {
            type: "object",
            properties: {
              loanId: { type: "string", description: "The loan ID for the reminder" },
              reminderDate: { type: "string", description: "When to send reminder (YYYY-MM-DD format)" },
              daysBefore: { type: "number", description: "Days before due date (alternative to reminderDate)" },
              message: { type: "string", description: "Custom reminder message" }
            },
            required: ["loanId"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "queryLoanDetails",
          description: "Get details about specific loans or search loans by criteria",
          parameters: {
            type: "object",
            properties: {
              loanId: { type: "string", description: "Specific loan ID to query" },
              bankName: { type: "string", description: "Filter by bank name" },
              status: { type: "string", enum: ["active", "settled"], description: "Filter by loan status" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "calculateTotals",
          description: "Calculate portfolio totals and metrics",
          parameters: {
            type: "object",
            properties: {
              metric: { 
                type: "string", 
                enum: ["total_debt", "total_payments", "utilization", "available_credit", "monthly_obligations"],
                description: "Which metric to calculate" 
              },
              bankName: { type: "string", description: "Filter by specific bank" }
            },
            required: ["metric"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "updateCollateral",
          description: "Update collateral valuation or details",
          parameters: {
            type: "object",
            properties: {
              collateralId: { type: "string", description: "Collateral ID to update" },
              newValue: { type: "number", description: "New collateral value in SAR" },
              valuationDate: { type: "string", description: "Valuation date (YYYY-MM-DD)" }
            },
            required: ["collateralId", "newValue"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "checkFacilityAvailability",
          description: "Check available credit in facilities",
          parameters: {
            type: "object",
            properties: {
              bankName: { type: "string", description: "Filter by bank name" },
              facilityType: { type: "string", description: "Filter by facility type" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "analyzeBankConcentration",
          description: "Analyze exposure and concentration risk by bank",
          parameters: {
            type: "object",
            properties: {
              threshold: { type: "number", description: "Alert threshold percentage (default 30)" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "monitorLTV",
          description: "Monitor Loan-to-Value ratios for loans with collateral",
          parameters: {
            type: "object",
            properties: {
              loanId: { type: "string", description: "Specific loan to check" },
              threshold: { type: "number", description: "LTV alert threshold percentage" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "showDueLoans",
          description: "Show loans due within a specified timeframe",
          parameters: {
            type: "object",
            properties: {
              timeframe: { 
                type: "string", 
                enum: ["this_week", "this_month", "next_7_days", "next_30_days"],
                description: "Timeframe for due loans" 
              }
            },
            required: ["timeframe"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "suggestRefinancing",
          description: "Analyze loans and suggest refinancing opportunities based on current SIBOR rates",
          parameters: {
            type: "object",
            properties: {
              minSavings: { type: "number", description: "Minimum savings threshold in SAR" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "exportReport",
          description: "Generate and export portfolio reports",
          parameters: {
            type: "object",
            properties: {
              reportType: { 
                type: "string", 
                enum: ["portfolio_summary", "loan_list", "bank_exposure", "collateral_report"],
                description: "Type of report to generate" 
              },
              format: { type: "string", enum: ["pdf", "csv", "json"], description: "Export format" }
            },
            required: ["reportType"]
          }
        }
      }
    ];
  }

  async processChat(messages: AgentMessage[], userId: string, organizationId: string): Promise<AgentResponse> {
    try {
      // Add system prompt if not present
      if (messages[0]?.role !== 'system') {
        messages.unshift({
          role: 'system',
          content: this.getSystemPrompt()
        });
      }

      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          tools: this.getFunctionDefinitions(),
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.statusText}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message;

      // Check if AI wants to call a function
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        const toolCall = assistantMessage.tool_calls[0];
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        // Execute the function
        const result = await this.executeFunction(functionName, functionArgs, userId, organizationId);

        // Add assistant message and tool result to conversation
        messages.push(assistantMessage);
        messages.push({
          role: 'tool',
          content: JSON.stringify(result),
          tool_call_id: toolCall.id
        });

        // Get final response from AI
        const finalResponse = await fetch(DEEPSEEK_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages,
            tools: this.getFunctionDefinitions(),
            temperature: 0.7
          })
        });

        const finalData = await finalResponse.json();
        return {
          message: finalData.choices[0].message.content,
          executed: true,
          data: result
        };
      }

      // No function call, just return the message
      return {
        message: assistantMessage.content,
        executed: false
      };

    } catch (error) {
      console.error('Agent service error:', error);
      return {
        message: "I apologize, but I encountered an error processing your request. Please try again.",
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async executeFunction(functionName: string, args: any, userId: string, organizationId: string): Promise<any> {
    switch (functionName) {
      case 'createLoan':
        return await this.createLoan(args, userId, organizationId);
      case 'createFacility':
        return await this.createFacility(args, userId, organizationId);
      case 'settleLoan':
        return await this.settleLoan(args, userId, organizationId);
      case 'setReminder':
        return await this.setReminder(args, userId, organizationId);
      case 'queryLoanDetails':
        return await this.queryLoanDetails(args, organizationId);
      case 'calculateTotals':
        return await this.calculateTotals(args, organizationId);
      case 'updateCollateral':
        return await this.updateCollateral(args, organizationId);
      case 'checkFacilityAvailability':
        return await this.checkFacilityAvailability(args, organizationId);
      case 'analyzeBankConcentration':
        return await this.analyzeBankConcentration(args, organizationId);
      case 'monitorLTV':
        return await this.monitorLTV(args, organizationId);
      case 'showDueLoans':
        return await this.showDueLoans(args, organizationId);
      case 'suggestRefinancing':
        return await this.suggestRefinancing(args, organizationId);
      case 'exportReport':
        return await this.exportReport(args, organizationId);
      default:
        throw new Error(`Unknown function: ${functionName}`);
    }
  }

  private async createLoan(args: any, userId: string, organizationId: string) {
    const { facilityId, amount, interestRate, dateTaken, dueDate, purpose, bankName } = args;

    // Convert interestRate to siborRate, margin, bankRate
    // For simplicity, assume SIBOR is 5% and margin is the difference
    const siborRate = '5.00';
    const margin = interestRate ? (parseFloat(interestRate) - 5.0).toFixed(2) : '0.00';
    const bankRate = interestRate?.toString() || '5.00';
    
    // Generate reference number
    const referenceNumber = `LOAN-${nanoid(10)}`;

    // If facilityId provided, verify it belongs to the organization
    if (facilityId) {
      const facilities = await this.storage.getUserFacilities(organizationId);
      const facility = facilities.find((f: Facility & { bank: Bank }) => f.id === facilityId);
      
      if (!facility) {
        return { success: false, error: 'Facility not found or not accessible' };
      }
      
      const loan = await this.storage.createLoan({
        userId,
        organizationId,
        facilityId,
        amount: amount.toString(),
        startDate: dateTaken,
        dueDate,
        siborRate,
        margin,
        bankRate,
        referenceNumber,
        notes: purpose || 'Via AI Assistant',
        status: 'active'
      });
      return { success: true, loanId: loan.id, message: 'Loan created successfully' };
    }

    // Otherwise, find facility by bank name
    if (bankName) {
      const facilities = await this.storage.getUserFacilities(organizationId);
      const banks = await this.storage.getAllBanks(organizationId);
      const bank = banks.find((b: Bank) => 
        b.name.toLowerCase().includes(bankName.toLowerCase()) || 
        b.code.toLowerCase() === bankName.toLowerCase()
      );

      if (!bank) {
        return { success: false, error: `Bank '${bankName}' not found` };
      }

      const facility = facilities.find((f: Facility & { bank: Bank }) => f.bankId === bank.id && f.isActive === true);
      if (!facility) {
        return { success: false, error: `No active facility found for ${bank.name}` };
      }

      const loan = await this.storage.createLoan({
        userId,
        organizationId,
        facilityId: facility.id,
        amount: amount.toString(),
        startDate: dateTaken,
        dueDate,
        siborRate,
        margin,
        bankRate,
        referenceNumber,
        notes: purpose || 'Via AI Assistant',
        status: 'active'
      });
      return { success: true, loanId: loan.id, bankName: bank.name, message: 'Loan created successfully' };
    }

    return { success: false, error: 'Either facilityId or bankName is required' };
  }

  private async createFacility(args: any, userId: string, organizationId: string) {
    const { bankName, facilityType, creditLimit, costOfFunding, startDate, expiryDate, terms } = args;

    // Convert creditLimit to number and validate
    const creditLimitNum = Number(creditLimit);
    if (isNaN(creditLimitNum) || creditLimitNum <= 0) {
      return { success: false, error: 'Credit limit must be a valid positive number' };
    }

    // Find bank by name or code
    const banks = await this.storage.getAllBanks(organizationId);
    const bank = banks.find((b: Bank) => 
      b.name.toLowerCase().includes(bankName.toLowerCase()) || 
      b.code.toLowerCase() === bankName.toLowerCase()
    );

    if (!bank) {
      return { success: false, error: `Bank '${bankName}' not found` };
    }

    // Set smart defaults for missing fields
    const today = new Date().toISOString().split('T')[0];
    const facilityData = {
      organizationId,
      bankId: bank.id,
      userId,
      facilityType: facilityType || 'revolving', // Default to revolving
      creditLimit: creditLimitNum.toString(),
      costOfFunding: costOfFunding?.toString() || '5.5', // Default to 5.5% if not specified
      startDate: startDate || today, // Default to today
      expiryDate: expiryDate || null,
      terms: terms || 'Created via AI Assistant',
      isActive: true,
      enableRevolvingTracking: false
    };

    try {
      const facility = await this.storage.createFacility(facilityData);
      return { 
        success: true, 
        facilityId: facility.id, 
        bankName: bank.name,
        message: `Facility created successfully for ${bank.name} with ${creditLimitNum.toLocaleString()} SAR credit limit` 
      };
    } catch (error) {
      return { success: false, error: `Failed to create facility: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  private async settleLoan(args: any, userId: string, organizationId: string) {
    const { loanId, settlementDate, settlementAmount } = args;
    
    const loan = await this.storage.getLoanById(loanId);
    if (!loan || loan.organizationId !== organizationId) {
      return { success: false, error: 'Loan not found' };
    }

    await this.storage.settleLoan(loanId, {
      date: settlementDate,
      amount: settlementAmount?.toString()
    }, userId);

    return { success: true, loanId, message: 'Loan settled successfully' };
  }

  private async setReminder(args: any, userId: string, organizationId: string) {
    const { loanId, reminderDate, daysBefore, message } = args;
    
    const loan = await this.storage.getLoanById(loanId);
    if (!loan || loan.organizationId !== organizationId) {
      return { success: false, error: 'Loan not found' };
    }

    let finalReminderDate = reminderDate;
    if (!reminderDate && daysBefore && loan.dueDate) {
      const dueDate = new Date(loan.dueDate);
      dueDate.setDate(dueDate.getDate() - daysBefore);
      finalReminderDate = dueDate.toISOString().split('T')[0];
    }

    if (!finalReminderDate) {
      return { success: false, error: 'Either reminderDate or daysBefore is required' };
    }

    const reminder = await this.storage.createLoanReminder({
      userId,
        organizationId,
      loanId,
      reminderDate: new Date(finalReminderDate),
      type: 'due_date',
      title: `Loan Due Date Reminder`,
      message: message || `Reminder for loan due on ${loan.dueDate}`,
      status: 'pending'
    });

    return { success: true, reminderId: reminder.id, message: 'Reminder set successfully' };
  }

  private async queryLoanDetails(args: any, organizationId: string) {
    const { loanId, bankName, status } = args;

    if (loanId) {
      const loan = await this.storage.getLoanById(loanId);
      if (!loan || loan.organizationId !== organizationId) {
        return { success: false, error: 'Loan not found' };
      }
      return { success: true, loan };
    }

    let loans = status === 'settled' 
      ? await this.storage.getSettledLoansByUser(organizationId)
      : await this.storage.getActiveLoansByUser(organizationId);

    if (bankName) {
      const banks = await this.storage.getAllBanks(organizationId);
      const facilities = await this.storage.getUserFacilities(organizationId);
      
      const bank = banks.find((b: Bank) => 
        b.name.toLowerCase().includes(bankName.toLowerCase()) ||
        b.code.toLowerCase() === bankName.toLowerCase()
      );

      if (bank) {
        const bankFacilityIds = facilities
          .filter((f: Facility & { bank: Bank }) => f.bankId === bank.id)
          .map((f: Facility & { bank: Bank }) => f.id);
        loans = loans.filter((l: Loan & { facility: Facility & { bank: Bank } }) => bankFacilityIds.includes(l.facilityId));
      }
    }

    return { success: true, loans, count: loans.length };
  }

  private async calculateTotals(args: any, organizationId: string) {
    const { metric, bankName } = args;

    const loans = await this.storage.getActiveLoansByUser(organizationId);
    const facilities = await this.storage.getUserFacilities(organizationId);

    let filteredLoans = loans;
    if (bankName) {
      const banks = await this.storage.getAllBanks(organizationId);
      const bank = banks.find((b: Bank) => 
        b.name.toLowerCase().includes(bankName.toLowerCase()) ||
        b.code.toLowerCase() === bankName.toLowerCase()
      );

      if (bank) {
        const bankFacilityIds = facilities
          .filter((f: Facility & { bank: Bank }) => f.bankId === bank.id)
          .map((f: Facility & { bank: Bank }) => f.id);
        filteredLoans = loans.filter((l: Loan & { facility: Facility & { bank: Bank } }) => bankFacilityIds.includes(l.facilityId));
      }
    }

    switch (metric) {
      case 'total_debt':
        const totalDebt = filteredLoans.reduce((sum: number, loan: Loan & { facility: Facility & { bank: Bank } }) => sum + parseFloat(loan.amount), 0);
        return { success: true, metric: 'total_debt', value: totalDebt, currency: 'SAR' };

      case 'utilization':
        const totalOutstanding = filteredLoans.reduce((sum: number, loan: Loan & { facility: Facility & { bank: Bank } }) => sum + parseFloat(loan.amount), 0);
        const totalLimit = facilities.reduce((sum: number, f: Facility & { bank: Bank }) => sum + parseFloat(f.creditLimit || '0'), 0);
        const utilization = totalLimit > 0 ? (totalOutstanding / totalLimit) * 100 : 0;
        return { success: true, metric: 'utilization', value: utilization, unit: 'percentage' };

      case 'available_credit':
        const outstanding = filteredLoans.reduce((sum: number, loan: Loan & { facility: Facility & { bank: Bank } }) => sum + parseFloat(loan.amount), 0);
        const limit = facilities.reduce((sum: number, f: Facility & { bank: Bank }) => sum + parseFloat(f.creditLimit || '0'), 0);
        const available = limit - outstanding;
        return { success: true, metric: 'available_credit', value: available, currency: 'SAR' };

      default:
        return { success: false, error: 'Unknown metric' };
    }
  }

  private async updateCollateral(args: any, organizationId: string) {
    const { collateralId, newValue, valuationDate } = args;
    
    const allCollateral = await this.storage.getUserCollateral(organizationId);
    const collateral = allCollateral.find((c: Collateral) => c.id === collateralId);
    
    if (!collateral || collateral.organizationId !== organizationId) {
      return { success: false, error: 'Collateral not found' };
    }

    await this.storage.updateCollateral(collateralId, organizationId, {
      currentValue: newValue.toString(),
      valuationDate: valuationDate || new Date().toISOString().split('T')[0]
    });

    return { success: true, collateralId, newValue, message: 'Collateral updated successfully' };
  }

  private async checkFacilityAvailability(args: any, organizationId: string) {
    const { bankName, facilityType } = args;

    let facilities = await this.storage.getUserFacilities(organizationId);
    const loans = await this.storage.getActiveLoansByUser(organizationId);

    if (bankName) {
      const banks = await this.storage.getAllBanks(organizationId);
      const bank = banks.find((b: Bank) => 
        b.name.toLowerCase().includes(bankName.toLowerCase()) ||
        b.code.toLowerCase() === bankName.toLowerCase()
      );

      if (bank) {
        facilities = facilities.filter((f: Facility & { bank: Bank }) => f.bankId === bank.id);
      }
    }

    if (facilityType) {
      facilities = facilities.filter((f: Facility & { bank: Bank }) => f.facilityType === facilityType);
    }

    const availability = facilities.map((f: Facility & { bank: Bank }) => {
      const facilityLoans = loans.filter((l: Loan & { facility: Facility & { bank: Bank } }) => l.facilityId === f.id);
      const utilized = facilityLoans.reduce((sum: number, l: Loan & { facility: Facility & { bank: Bank } }) => sum + parseFloat(l.amount), 0);
      const limit = parseFloat(f.creditLimit || '0');
      const available = limit - utilized;

      return {
        facilityId: f.id,
        facilityType: f.facilityType,
        limit,
        utilized,
        available,
        utilizationPct: limit > 0 ? (utilized / limit) * 100 : 0
      };
    });

    return { success: true, facilities: availability };
  }

  private async analyzeBankConcentration(args: any, organizationId: string) {
    const { threshold = 30 } = args;

    const loans = await this.storage.getActiveLoansByUser(organizationId);
    const facilities = await this.storage.getUserFacilities(organizationId);
    const banks = await this.storage.getAllBanks(organizationId);

    const totalExposure = loans.reduce((sum: number, loan: Loan & { facility: Facility & { bank: Bank } }) => sum + parseFloat(loan.amount), 0);

    const bankExposure = banks.map((bank: Bank) => {
      const bankFacilityIds = facilities
        .filter((f: Facility & { bank: Bank }) => f.bankId === bank.id)
        .map((f: Facility & { bank: Bank }) => f.id);
      
      const bankLoans = loans.filter((l: Loan & { facility: Facility & { bank: Bank } }) => bankFacilityIds.includes(l.facilityId));
      const exposure = bankLoans.reduce((sum: number, l: Loan & { facility: Facility & { bank: Bank } }) => sum + parseFloat(l.amount), 0);
      const concentration = totalExposure > 0 ? (exposure / totalExposure) * 100 : 0;

      return {
        bankName: bank.name,
        exposure,
        concentration,
        atRisk: concentration > threshold
      };
    }).filter((b: { bankName: string; exposure: number; concentration: number; atRisk: boolean }) => b.exposure > 0);

    return { 
      success: true, 
      concentration: bankExposure,
      threshold,
      totalExposure 
    };
  }

  private async monitorLTV(args: any, organizationId: string) {
    const { loanId, threshold = 80 } = args;

    const loans = loanId ? [await this.storage.getLoanById(loanId)] : await this.storage.getActiveLoansByUser(organizationId);
    const collateralAssignments = await this.storage.getUserCollateralAssignments(organizationId);
    const allCollateral = await this.storage.getUserCollateral(organizationId);

    const ltvData = loans
      .filter((loan): loan is Loan & { facility: Facility & { bank: Bank } } => loan !== null && loan !== undefined && loan.organizationId === organizationId)
      .map((loan: Loan & { facility: Facility & { bank: Bank } }) => {
        const assignments = collateralAssignments.filter((a: any) => a.loanId === loan.id);
        const totalCollateralValue = assignments.reduce((sum: number, a: any) => {
          const collateral = allCollateral.find((c: Collateral) => c.id === a.collateralId);
          return sum + (collateral ? parseFloat(collateral.currentValue) : 0);
        }, 0);

        const loanAmount = parseFloat(loan.amount);
        const ltv = totalCollateralValue > 0 ? (loanAmount / totalCollateralValue) * 100 : 0;

        return {
          loanId: loan.id,
          loanAmount,
          collateralValue: totalCollateralValue,
          ltv,
          atRisk: ltv > threshold
        };
      });

    return { success: true, ltvData, threshold };
  }

  private async showDueLoans(args: any, organizationId: string) {
    const { timeframe } = args;

    const loans = await this.storage.getActiveLoansByUser(organizationId);
    const now = new Date();
    let endDate = new Date();

    switch (timeframe) {
      case 'this_week':
      case 'next_7_days':
        endDate.setDate(now.getDate() + 7);
        break;
      case 'this_month':
      case 'next_30_days':
        endDate.setDate(now.getDate() + 30);
        break;
    }

    const dueLoans = loans.filter((loan: Loan & { facility: Facility & { bank: Bank } }) => {
      if (!loan.dueDate) return false;
      const dueDate = new Date(loan.dueDate);
      return dueDate >= now && dueDate <= endDate;
    });

    return { 
      success: true, 
      dueLoans,
      timeframe,
      count: dueLoans.length 
    };
  }

  private async suggestRefinancing(args: any, organizationId: string) {
    const { minSavings = 10000 } = args;

    const loans = await this.storage.getActiveLoansByUser(organizationId);
    
    // Simple refinancing logic based on bank rates
    const suggestions = loans
      .filter((loan: Loan & { facility: Facility & { bank: Bank } }) => parseFloat(loan.bankRate) > 5.0)
      .map((loan: Loan & { facility: Facility & { bank: Bank } }) => {
        const currentRate = parseFloat(loan.bankRate);
        const potentialRate = 4.5; // Example lower rate
        const amount = parseFloat(loan.amount);
        const potentialSavings = (amount * (currentRate - potentialRate)) / 100;

        return {
          loanId: loan.id,
          currentRate,
          potentialRate,
          potentialSavings,
          recommended: potentialSavings >= minSavings
        };
      })
      .filter((s: { loanId: string; currentRate: number; potentialRate: number; potentialSavings: number; recommended: boolean }) => s.recommended);

    return { success: true, suggestions, count: suggestions.length };
  }

  private async exportReport(args: any, organizationId: string) {
    const { reportType, format = 'json' } = args;

    let reportData: any = {};

    switch (reportType) {
      case 'portfolio_summary':
        const loans = await this.storage.getActiveLoansByUser(organizationId);
        const facilities = await this.storage.getUserFacilities(organizationId);
        reportData = {
          totalLoans: loans.length,
          totalDebt: loans.reduce((sum: number, l: Loan & { facility: Facility & { bank: Bank } }) => sum + parseFloat(l.amount), 0),
          totalFacilities: facilities.length,
          generatedAt: new Date().toISOString()
        };
        break;

      case 'loan_list':
        reportData = { loans: await this.storage.getActiveLoansByUser(organizationId) };
        break;

      case 'bank_exposure':
        const bankConcentration = await this.analyzeBankConcentration({}, organizationId);
        reportData = bankConcentration;
        break;

      case 'collateral_report':
        reportData = { collateral: await this.storage.getUserCollateral(organizationId) };
        break;
    }

    return { 
      success: true, 
      reportType, 
      format,
      data: reportData,
      message: 'Report generated successfully'
    };
  }
}
