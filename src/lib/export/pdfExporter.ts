import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

// Wells Fargo brand colors
const WF_RED = '#D71E28';
const WF_GRAY_DARK = '#333333';
const WF_GRAY_MEDIUM = '#666666';
const WF_GRAY_LIGHT = '#F5F5F5';

export interface IntakeFormData {
  // Page 1 fields
  opportunityName: string;
  owner?: string;
  sponsor?: string;
  opportunityType?: 'Operational Enabler' | 'Growth Opportunity' | 'Transformative Idea';

  // Problem & Solution
  problemDescription?: string;
  problemPainPoint?: string;
  problemIssues?: string;
  solutionDescription?: string;
  solutionApproach?: string;
  solutionImprovement?: string;

  // How the Solution Will Work
  aiTask?: string;
  method?: string;
  output?: string;
  other?: string;

  // Target Outcomes
  targetKPIs?: string;

  // CL Priority Alignment
  clPriority?: string;

  // Page 2 fields
  // Readiness
  canExecute?: string;
  haveData?: string;
  willIntegrate?: string;

  // Build vs Buy vs Partner
  overallApproach?: string;
  approachDetails?: string;

  // Investment
  ftesRequired?: string;
  estimatedCost?: string;
  timeline?: string;

  // Risks & Roadblocks
  risks?: string[];
  mitigation?: string[];

  // AI Analysis (if available)
  aiSummary?: string;
  aiClassification?: string;
  aiReadinessScore?: number;
  aiGaps?: string[];
  aiRecommendations?: string[];
}

export class PDFExporter {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private currentY: number = 20;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  /**
   * Generate the complete 2-page Wells Fargo intake form
   */
  generateIntakeForm(data: IntakeFormData): jsPDF {
    this.renderPage1(data);
    this.doc.addPage();
    this.currentY = 20;
    this.renderPage2(data);
    return this.doc;
  }

  /**
   * Page 1: Strategic Framing
   */
  private renderPage1(data: IntakeFormData): void {
    // Header section
    this.renderPageHeader('Strategic Framing (Page 1 of 2)');

    // Title section with red color
    this.doc.setFontSize(20);
    this.doc.setTextColor(WF_RED);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Type of AI Opportunity:', this.margin, this.currentY);
    this.currentY += 8;
    this.doc.text(data.opportunityName || 'Name', this.margin, this.currentY);
    this.currentY += 10;

    // Owner & Sponsor + Type classification
    this.doc.setFontSize(10);
    this.doc.setTextColor(WF_GRAY_DARK);
    this.doc.setFont('helvetica', 'normal');
    const ownerText = `Owner & Sponsor: ${data.owner || 'CL Lead'} / ${data.sponsor || 'CL Lead'}`;
    const typeText = data.opportunityType || 'Operational Enabler';
    this.doc.text(ownerText, this.margin, this.currentY);
    this.doc.text(`Type: ${typeText}`, this.pageWidth - this.margin - 60, this.currentY);
    this.currentY += 10;

    // Problem & Solution section
    this.renderSectionHeader('Problem & Solution', true);

    // Problem subsection
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Problem', this.margin + 5, this.currentY);
    this.currentY += 6;

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.renderBulletPoint(data.problemDescription || 'TBD');
    this.renderBulletPoint(`What is the customer or business pain point? ${data.problemPainPoint || 'TBD'}`);
    this.renderBulletPoint(`Why is the current process slow, costly, inconsistent, or risky? ${data.problemIssues || 'TBD'}`);
    this.currentY += 5;

    // AI-Enabled Solution subsection
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('AI-Enabled Solution', this.margin + 5, this.currentY);
    this.currentY += 6;

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.renderBulletPoint(data.solutionDescription || 'TBD');
    this.renderBulletPoint(`What AI-enabled approach addresses this? ${data.solutionApproach || 'TBD'}`);
    this.renderBulletPoint(`How does it improve on the current process? ${data.solutionImprovement || 'TBD'}`);
    this.currentY += 8;

    // How the Solution will Work section
    this.renderSectionHeader('How the Solution will Work', true);

    this.renderFieldRow('AI Task', data.aiTask || 'TBD');
    this.renderFieldRow('Method', data.method || 'TBD');
    this.renderFieldRow('Output', data.output || 'TBD');
    this.renderFieldRow('Other', data.other || 'TBD');
    this.currentY += 8;

    // Target Outcomes section
    this.renderSectionHeader('Target Outcomes', true);
    this.renderMultilineText(data.targetKPIs || 'TBD - What are the core KPIs this will move? Quantify its efficiency, revenue, customer impact, or cost savings.');
    this.currentY += 8;

    // CL Priority Alignment section
    this.renderSectionHeader('CL Priority Alignment', true);
    this.renderMultilineText(data.clPriority || 'TBD - What CL priority does this support? (e.g., supports 2026 Card initiative with focus on tech-driven marketing, testing, targeting, personalization)');
  }

  /**
   * Page 2: Feasibility and Investing Case
   */
  private renderPage2(data: IntakeFormData): void {
    // Header section
    this.renderPageHeader('Feasibility and Investing Case (Page 2 of 2)');

    // Title section
    this.doc.setFontSize(20);
    this.doc.setTextColor(WF_RED);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Type of AI Opportunity:', this.margin, this.currentY);
    this.currentY += 8;
    this.doc.text(data.opportunityName || 'Name', this.margin, this.currentY);
    this.currentY += 12;

    // Readiness section
    this.renderSectionHeader('Readiness', true);

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Can we execute?', this.margin + 5, this.currentY);
    this.doc.setFont('helvetica', 'italic');
    this.doc.setFontSize(8);
    this.doc.text('(Tech, tools, people)', this.margin + 35, this.currentY);
    this.currentY += 5;

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.renderBulletPoint(data.canExecute || 'TBD');
    this.currentY += 2;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Do we have the data?', this.margin + 5, this.currentY);
    this.doc.setFont('helvetica', 'italic');
    this.doc.setFontSize(8);
    this.doc.text('(Training inputs)', this.margin + 42, this.currentY);
    this.currentY += 5;

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.renderBulletPoint(data.haveData || 'TBD');
    this.currentY += 2;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Will it integrate?', this.margin + 5, this.currentY);
    this.doc.setFont('helvetica', 'italic');
    this.doc.setFontSize(8);
    this.doc.text('(Systems/ Workflows)', this.margin + 36, this.currentY);
    this.currentY += 5;

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.renderBulletPoint(data.willIntegrate || 'TBD');
    this.currentY += 5;

    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'italic');
    this.doc.setTextColor(WF_GRAY_MEDIUM);
    const guidingText = 'Guiding questions: Can we execute: Do we have the internal tools, platforms, and people to build and run this? Do we have the data: Do we have the right data or content to train and tune the AI model? Will it integrate: Can this connect easily with existing tools, workflows, or processes?';
    const lines = this.doc.splitTextToSize(guidingText, this.pageWidth - 2 * this.margin - 10);
    this.doc.text(lines, this.margin + 5, this.currentY);
    this.currentY += lines.length * 4 + 6;

    this.doc.setTextColor(WF_GRAY_DARK);

    // Build vs. Buy vs. Partner section
    this.renderSectionHeader('Build vs. Buy vs. Partner', true);
    this.renderFieldRow('Overall Approach', data.overallApproach || 'TBD');
    this.renderFieldRow('Details', data.approachDetails || 'TBD');
    this.currentY += 5;

    // Investment section
    this.renderSectionHeader('Investment', true);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(data.ftesRequired || 'TBD', this.margin + 10, this.currentY);
    this.currentY += 5;
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('FTEs Required', this.margin + 10, this.currentY);
    this.currentY += 8;

    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'italic');
    this.doc.setTextColor(WF_GRAY_MEDIUM);
    const investmentText = 'What will it take? Provide one metric each for people (e.g., FTE), $ cost, and timeline (e.g., 3-month MVP). Suggested approach: Work with Finance, your CTO, and CDAI (Chris Challis / Dhaval Pandya)';
    const investLines = this.doc.splitTextToSize(investmentText, this.pageWidth - 2 * this.margin - 10);
    this.doc.text(investLines, this.margin + 5, this.currentY);
    this.currentY += investLines.length * 4 + 6;

    this.doc.setTextColor(WF_GRAY_DARK);

    // Risks & Roadblocks section
    this.renderSectionHeader('Risks & Roadblocks', true, true);

    if (data.risks && data.risks.length > 0) {
      data.risks.forEach(risk => {
        this.renderBulletPoint(risk);
      });
    } else {
      this.renderBulletPoint('TBD');
      this.renderBulletPoint('TBD');
      this.renderBulletPoint('TBD');
    }
    this.currentY += 3;

    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'italic');
    this.doc.setTextColor(WF_GRAY_MEDIUM);
    this.doc.text('What are the biggest risks and how could we reduce them?', this.margin + 5, this.currentY);
    this.currentY += 8;

    this.doc.setTextColor(WF_GRAY_DARK);

    // Mitigation section
    this.renderSectionHeader('Mitigation', false, true);

    if (data.mitigation && data.mitigation.length > 0) {
      data.mitigation.forEach(mit => {
        this.renderBulletPoint(mit);
      });
    } else {
      this.renderBulletPoint('TBD');
    }
  }

  /**
   * Render page header text
   */
  private renderPageHeader(text: string): void {
    this.doc.setFontSize(10);
    this.doc.setTextColor(WF_GRAY_DARK);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(text, this.margin, this.currentY);
    this.currentY += 8;
  }

  /**
   * Render section header with icon background
   */
  private renderSectionHeader(title: string, hasIcon: boolean = false, isWarning: boolean = false): void {
    // Background rectangle
    if (hasIcon) {
      if (isWarning) {
        this.doc.setFillColor(255, 200, 100); // Warning yellow/orange
      } else {
        this.doc.setFillColor(200, 200, 220); // Light blue/gray
      }
      this.doc.rect(this.margin, this.currentY - 4, 8, 6, 'F');
    }

    this.doc.setFontSize(11);
    this.doc.setTextColor(WF_GRAY_DARK);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin + (hasIcon ? 10 : 0), this.currentY);
    this.currentY += 7;
  }

  /**
   * Render a field row with label and value
   */
  private renderFieldRow(label: string, value: string): void {
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(label, this.margin + 5, this.currentY);

    this.doc.setFont('helvetica', 'normal');
    const lines = this.doc.splitTextToSize(value, this.pageWidth - this.margin - 60);
    this.doc.text(lines, this.margin + 40, this.currentY);
    this.currentY += Math.max(lines.length * 5, 6);
  }

  /**
   * Render a bullet point
   */
  private renderBulletPoint(text: string): void {
    const bulletX = this.margin + 8;
    const textX = this.margin + 12;

    // Draw bullet
    this.doc.circle(bulletX, this.currentY - 1, 0.5, 'F');

    // Draw text
    const lines = this.doc.splitTextToSize(text, this.pageWidth - textX - this.margin);
    this.doc.text(lines, textX, this.currentY);
    this.currentY += lines.length * 4 + 2;
  }

  /**
   * Render multiline text
   */
  private renderMultilineText(text: string): void {
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    const lines = this.doc.splitTextToSize(text, this.pageWidth - 2 * this.margin - 10);
    this.doc.text(lines, this.margin + 5, this.currentY);
    this.currentY += lines.length * 5;
  }

  /**
   * Save the PDF with a given filename
   */
  save(filename: string): void {
    this.doc.save(filename);
  }

  /**
   * Get the PDF as a blob for uploading
   */
  getBlob(): Blob {
    return this.doc.output('blob');
  }

  /**
   * Get the PDF as a data URL for preview
   */
  getDataUrl(): string {
    return this.doc.output('dataurlstring');
  }
}

/**
 * Helper function to map conversation data to intake form structure
 */
export function mapConversationToIntakeForm(
  userData: Record<string, any>,
  analysis?: any
): IntakeFormData {
  return {
    // Extract opportunity name from various possible fields
    opportunityName: userData.idea_name || userData.ideaName || userData.project_name || 'GenAI Idea',

    // Owner/Sponsor
    owner: userData.owner || userData.submitter || 'TBD',
    sponsor: userData.sponsor || 'TBD',

    // Opportunity type from classification
    opportunityType: analysis?.classification?.includes('Transformative')
      ? 'Transformative Idea'
      : analysis?.classification?.includes('Growth')
      ? 'Growth Opportunity'
      : 'Operational Enabler',

    // Problem & Solution
    problemDescription: userData.problem || userData.business_problem || 'TBD',
    problemPainPoint: userData.pain_point || userData.problem_details || 'TBD',
    problemIssues: userData.current_issues || userData.why_now || 'TBD',

    solutionDescription: userData.solution || userData.proposed_solution || 'TBD',
    solutionApproach: userData.ai_approach || userData.how_ai_helps || 'TBD',
    solutionImprovement: userData.improvements || userData.expected_benefits || 'TBD',

    // How Solution Works
    aiTask: userData.ai_task || analysis?.classification || 'TBD',
    method: userData.method || userData.technical_approach || 'TBD',
    output: userData.output || userData.expected_output || 'TBD',
    other: userData.other_details || '',

    // Target Outcomes
    targetKPIs: userData.target_outcomes || userData.success_metrics || userData.kpis || 'TBD',

    // Priority
    clPriority: userData.priority || userData.business_priority || 'TBD',

    // Readiness
    canExecute: userData.execution_readiness || userData.technical_feasibility || 'TBD',
    haveData: userData.data_availability || userData.data_sources || 'TBD',
    willIntegrate: userData.integration || userData.systems_integration || 'TBD',

    // Approach
    overallApproach: userData.approach || userData.build_buy_partner || 'TBD',
    approachDetails: userData.approach_details || 'TBD',

    // Investment
    ftesRequired: userData.ftes || userData.team_size || 'TBD',
    estimatedCost: userData.cost || userData.budget || 'TBD',
    timeline: userData.timeline || userData.estimated_timeline || '3-month MVP',

    // Risks
    risks: userData.risks || analysis?.gaps || ['TBD'],
    mitigation: userData.mitigation || analysis?.recommendations || ['TBD'],

    // AI Analysis
    aiSummary: analysis?.summary,
    aiClassification: analysis?.classification,
    aiReadinessScore: analysis?.readiness,
    aiGaps: analysis?.gaps,
    aiRecommendations: analysis?.recommendations,
  };
}
