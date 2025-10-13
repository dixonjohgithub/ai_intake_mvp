import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userData, conversationHistory } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      // Return mock analysis if no API key
      return res.status(200).json({
        analysis: {
          summary: 'GenAI idea for improving operational efficiency',
          gaps: ['Technical architecture details', 'Security considerations'],
          recommendations: [
            'Define specific use cases',
            'Identify data sources',
            'Consider compliance requirements'
          ],
          classification: 'GenAI with Tools',
          readiness: 65
        }
      });
    }

    const prompt = `<submission_data>
<user_responses>
${JSON.stringify(userData, null, 2)}
</user_responses>

<conversation_history>
${conversationHistory
  .map((item: any, i: number) => `<exchange_${i + 1}>
  <question>${item.question}</question>
  <answer>${item.answer}</answer>
</exchange_${i + 1}>`)
  .join('\n')}
</conversation_history>
</submission_data>

<analysis_task>
Perform comprehensive assessment of this GenAI proposal for Wells Fargo implementation
</analysis_task>

<evaluation_criteria>
- Business value and ROI potential
- Technical feasibility and architecture fit
- Compliance and regulatory alignment
- Security and privacy considerations
- Resource requirements and timeline
- Risk factors and mitigation strategies
</evaluation_criteria>

<output_specification>
Return JSON with exactly these fields:
1. summary: Executive summary of the proposal (2-3 clear sentences)
2. gaps: Array of specific missing critical information
3. recommendations: Array of actionable improvement suggestions
4. classification: One of ['Simple GenAI', 'GenAI with Tools', 'Agentic AI', 'Multi-Agent System']
5. readiness: Integer 0-100 representing proposal completeness and viability
</output_specification>`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: [
        {
          role: 'system',
          content: `<role>
Senior AI architect and risk assessor for Wells Fargo GenAI initiatives
</role>

<expertise>
- Enterprise-scale AI implementation
- Financial services regulatory compliance
- Model risk management (SR 11-7)
- Security and data privacy
- Cost-benefit analysis
</expertise>

<assessment_focus>
Evaluate proposals for technical feasibility, business value, compliance readiness, and implementation risks
</assessment_focus>`,
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    });

    const response = completion.choices[0]?.message?.content;
    if (response) {
      const analysis = JSON.parse(response);
      return res.status(200).json({ analysis });
    }

    return res.status(500).json({ error: 'No response from OpenAI' });
  } catch (error: any) {
    console.error('Analysis error:', error);

    // Return mock data on error
    return res.status(200).json({
      analysis: {
        summary: 'GenAI idea analysis pending',
        gaps: ['Unable to analyze at this time'],
        recommendations: ['Please try again later'],
        classification: 'Simple GenAI',
        readiness: 50
      }
    });
  }
}