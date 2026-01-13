import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransporter({
      host: this.configService.get<string>('email.smtp.host'),
      port: this.configService.get<number>('email.smtp.port'),
      secure: false,
      auth: {
        user: this.configService.get<string>('email.smtp.user'),
        pass: this.configService.get<string>('email.smtp.password'),
      },
    });
  }

  async sendEmail(options: {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    from?: string;
    attachments?: Array<{
      filename: string;
      content: Buffer | string;
      contentType?: string;
    }>;
  }): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: options.from || this.configService.get<string>('email.smtp.user'),
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendBudgetAlertEmail(
    to: string,
    organizationName: string,
    budgetName: string,
    spentAmount: number,
    budgetAmount: number,
    percentageUsed: number,
  ): Promise<void> {
    const subject = `Budget Alert: ${budgetName} - ${percentageUsed}% Used`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Budget Alert</h2>
        <p>Hello,</p>
        <p>This is to inform you that the budget <strong>${budgetName}</strong> in <strong>${organizationName}</strong> has reached <strong>${percentageUsed}%</strong> of its allocated amount.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Budget Details:</strong></p>
          <ul>
            <li>Budget Name: ${budgetName}</li>
            <li>Allocated Amount: $${budgetAmount.toFixed(2)}</li>
            <li>Amount Spent: $${spentAmount.toFixed(2)}</li>
            <li>Percentage Used: ${percentageUsed}%</li>
          </ul>
        </div>
        
        <p>Please review your spending and take appropriate action if necessary.</p>
        
        <p>Best regards,<br>Virtual AI CFO Team</p>
      </div>
    `;

    await this.sendEmail({ to, subject, html });
  }

  async sendLowCashBalanceAlert(
    to: string,
    organizationName: string,
    currentBalance: number,
    threshold: number,
  ): Promise<void> {
    const subject = `Low Cash Balance Alert: ${organizationName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Low Cash Balance Alert</h2>
        <p>Hello,</p>
        <p>This is to inform you that the cash balance for <strong>${organizationName}</strong> has fallen below the set threshold.</p>
        
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <p><strong>Balance Details:</strong></p>
          <ul>
            <li>Current Balance: $${currentBalance.toFixed(2)}</li>
            <li>Alert Threshold: $${threshold.toFixed(2)}</li>
            <li>Status: <span style="color: #dc2626; font-weight: bold;">BELOW THRESHOLD</span></li>
          </ul>
        </div>
        
        <p>Please review your cash flow and take appropriate action to maintain healthy cash reserves.</p>
        
        <p>Best regards,<br>Virtual AI CFO Team</p>
      </div>
    `;

    await this.sendEmail({ to, subject, html });
  }

  async sendMonthlyFinancialSummary(
    to: string,
    organizationName: string,
    summary: {
      totalIncome: number;
      totalExpenses: number;
      netProfit: number;
      topExpenseCategories: Array<{ name: string; amount: number }>;
      month: string;
    },
  ): Promise<void> {
    const subject = `Monthly Financial Summary - ${organizationName} (${summary.month})`;
    
    const topExpensesList = summary.topExpenseCategories
      .map(category => `<li>${category.name}: $${category.amount.toFixed(2)}</li>`)
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Monthly Financial Summary</h2>
        <p>Hello,</p>
        <p>Here is your financial summary for <strong>${summary.month}</strong>:</p>
        
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e40af;">${organizationName}</h3>
          <p><strong>Financial Overview:</strong></p>
          <ul>
            <li>Total Income: <span style="color: #16a34a; font-weight: bold;">$${summary.totalIncome.toFixed(2)}</span></li>
            <li>Total Expenses: <span style="color: #dc2626; font-weight: bold;">$${summary.totalExpenses.toFixed(2)}</span></li>
            <li>Net Profit: <span style="color: ${summary.netProfit >= 0 ? '#16a34a' : '#dc2626'}; font-weight: bold;">$${summary.netProfit.toFixed(2)}</span></li>
          </ul>
        </div>
        
        <div style="background-color: #fefce8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Top Expense Categories:</strong></p>
          <ul>
            ${topExpensesList}
          </ul>
        </div>
        
        <p>Thank you for using Virtual AI CFO for your financial management needs.</p>
        
        <p>Best regards,<br>Virtual AI CFO Team</p>
      </div>
    `;

    await this.sendEmail({ to, subject, html });
  }
}