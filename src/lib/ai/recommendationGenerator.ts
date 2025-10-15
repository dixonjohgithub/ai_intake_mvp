/**
 * AI Recommendation Generator
 * Generates the "suggested_*" fields using LLM analysis
 * Called at end of conversation to provide expert recommendations
 */

import { OpenAI } from 'openai';

export interface AIRecommendations {
  suggested_approach: string;
  suggested_kpis_approach: string;
  suggested_build_buy_approach: string;
  suggested_investment_approach: string;
}

/**
 * Generates all AI recommendations based on complete conversation data
 */
export async function generateAllRecommendations(
  aiClient: OpenAI,
  modelName: string,
  userData: Record<string, any>
): Promise<AIRecommendations> {
  const prompt = `You are an expert AI strategy consultant at Wells Fargo. Based on the GenAI opportunity details below, provide specific recommendations for the four key decision areas.

**OPPORTUNITY DETAILS:**
- Name: ${userData.solution_name || userData.idea_name || 'Untitled'}
- Problem: ${userData.problem_statement || userData.business_problem || 'N/A'}
- Solution: ${userData.ai_solution_approach || userData.proposed_solution || 'N/A'}
- Users: ${userData.target_users || 'N/A'}
- Impact: ${userData.core_kpis || userData.expected_benefits || 'N/A'}
- Data: ${userData.data_sources || 'N/A'}
- Feasibility: ${userData.technical_feasibility || 'N/A'}
- Timeline: ${userData.investment_timeline || 'N/A'}
- Approach: ${userData.overall_approach || 'N/A'}
- Risks: ${userData.risks_list || userData.risks || 'N/A'}

**PROVIDE 4 RECOMMENDATIONS:**

1. **Suggested Technical Approach** (1-2 sentences)
   - Recommend specific AI technologies, frameworks, or methodologies
   - Consider Wells Fargo's existing infrastructure and capabilities
   - Be specific (e.g., "Use GPT-4 with RAG" not just "Use AI")

2. **Suggested KPIs Approach** (1-2 sentences)
   - Recommend specific metrics to track success
   - Focus on measurable, business-aligned KPIs
   - Include both efficiency and effectiveness metrics

3. **Suggested Build/Buy/Partner Approach** (1-2 sentences)
   - Recommend Build, Buy, Partner, or Hybrid with clear rationale
   - Consider complexity, timeline, competitive advantage, and cost
   - Be decisive but pragmatic

4. **Suggested Investment Approach** (1-2 sentences)
   - Recommend phasing strategy (POC → Pilot → Scale)
   - Suggest team composition and timeline
   - Consider risk mitigation through iterative approach

**RETURN JSON FORMAT:**
{
  "suggested_approach": "...",
  "suggested_kpis_approach": "...",
  "suggested_build_buy_approach": "...",
  "suggested_investment_approach": "..."
}`;

  try {
    const response = await aiClient.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: 'You are an expert AI strategy consultant at Wells Fargo. Provide specific, actionable recommendations based on the opportunity details. Return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 800
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const recommendations = JSON.parse(content);
    return {
      suggested_approach: recommendations.suggested_approach || 'Analysis pending',
      suggested_kpis_approach: recommendations.suggested_kpis_approach || 'Analysis pending',
      suggested_build_buy_approach: recommendations.suggested_build_buy_approach || 'Analysis pending',
      suggested_investment_approach: recommendations.suggested_investment_approach || 'Analysis pending'
    };
  } catch (error) {
    console.error('Error generating recommendations:', error);
    // Return default recommendations on error
    return {
      suggested_approach: 'Conduct technical discovery to identify optimal AI approach based on data characteristics and infrastructure',
      suggested_kpis_approach: 'Define baseline metrics before implementation, track operational efficiency and business impact KPIs',
      suggested_build_buy_approach: 'Evaluate build vs buy based on competitive differentiation, internal capabilities, and time to market',
      suggested_investment_approach: 'Start with 2-month POC to validate feasibility, then 3-month pilot, followed by phased production rollout'
    };
  }
}

/**
 * Generates technical approach recommendation only
 */
export async function generateTechnicalApproach(
  aiClient: OpenAI,
  modelName: string,
  userData: Record<string, any>
): Promise<string> {
  const prompt = `As a technical AI expert, recommend the best technical approach for this GenAI opportunity:

**Problem**: ${userData.problem_statement || userData.business_problem}
**Solution**: ${userData.ai_solution_approach || userData.proposed_solution}
**Data**: ${userData.data_sources}
**Feasibility**: ${userData.technical_feasibility}

Provide 1-2 sentences recommending specific AI technologies, frameworks, or methodologies. Be specific.`;

  try {
    const response = await aiClient.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: 'You are a technical AI expert. Provide specific technology recommendations.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 200
    });

    return response.choices[0]?.message?.content?.trim() || 'Analysis pending';
  } catch (error) {
    console.error('Error generating technical approach:', error);
    return 'Conduct technical discovery to identify optimal AI approach based on data characteristics';
  }
}

/**
 * Generates KPIs approach recommendation only
 */
export async function generateKPIsApproach(
  aiClient: OpenAI,
  modelName: string,
  userData: Record<string, any>
): Promise<string> {
  const prompt = `As a business analyst, recommend specific KPIs to measure success for this GenAI opportunity:

**Problem**: ${userData.problem_statement || userData.business_problem}
**Expected Impact**: ${userData.core_kpis || userData.expected_benefits}
**Users**: ${userData.target_users}

Provide 1-2 sentences recommending specific, measurable KPIs (both efficiency and effectiveness metrics).`;

  try {
    const response = await aiClient.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: 'You are a business analyst. Recommend specific, measurable KPIs.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 200
    });

    return response.choices[0]?.message?.content?.trim() || 'Analysis pending';
  } catch (error) {
    console.error('Error generating KPIs approach:', error);
    return 'Define baseline metrics before implementation, track operational efficiency and business impact KPIs';
  }
}

/**
 * Generates Build/Buy/Partner recommendation only
 */
export async function generateBuildBuyApproach(
  aiClient: OpenAI,
  modelName: string,
  userData: Record<string, any>
): Promise<string> {
  const prompt = `As a strategic advisor, recommend Build, Buy, Partner, or Hybrid approach for this GenAI opportunity:

**Solution**: ${userData.ai_solution_approach || userData.proposed_solution}
**Current Approach**: ${userData.overall_approach}
**Rationale**: ${userData.approach_rationale}
**Feasibility**: ${userData.technical_feasibility}
**Timeline**: ${userData.investment_timeline}

Provide 1-2 sentences with a decisive recommendation (Build/Buy/Partner/Hybrid) and clear rationale considering complexity, timeline, and competitive advantage.`;

  try {
    const response = await aiClient.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: 'You are a strategic advisor. Provide decisive Build/Buy/Partner recommendations.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 200
    });

    return response.choices[0]?.message?.content?.trim() || 'Analysis pending';
  } catch (error) {
    console.error('Error generating build/buy approach:', error);
    return 'Evaluate build vs buy based on competitive differentiation, internal capabilities, and time to market';
  }
}

/**
 * Generates investment approach recommendation only
 */
export async function generateInvestmentApproach(
  aiClient: OpenAI,
  modelName: string,
  userData: Record<string, any>
): Promise<string> {
  const prompt = `As an investment strategist, recommend a phased investment approach for this GenAI opportunity:

**Timeline**: ${userData.investment_timeline}
**Team**: ${userData.investment_people}
**Budget**: ${userData.investment_cost}
**Risks**: ${userData.risks_list || userData.risks}

Provide 1-2 sentences recommending a phased approach (POC → Pilot → Scale) with team composition and risk mitigation strategy.`;

  try {
    const response = await aiClient.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: 'You are an investment strategist. Recommend phased investment approaches.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 200
    });

    return response.choices[0]?.message?.content?.trim() || 'Analysis pending';
  } catch (error) {
    console.error('Error generating investment approach:', error);
    return 'Start with 2-month POC to validate feasibility, then 3-month pilot, followed by phased production rollout';
  }
}
