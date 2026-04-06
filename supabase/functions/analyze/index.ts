import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function extractJSON(text: string): any {
  const codeBlockMatch = text.match(/```(?:json)?\s*(\[[\s\S]*?\]|\{[\s\S]*?\})\s*```/);
  if (codeBlockMatch) {
    return JSON.parse(codeBlockMatch[1]);
  }

  const jsonArrayMatch = text.match(/\[[\s\S]*\]/);
  if (jsonArrayMatch) {
    return JSON.parse(jsonArrayMatch[0]);
  }

  const jsonObjectMatch = text.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) {
    return JSON.parse(jsonObjectMatch[0]);
  }

  throw new Error("No JSON found in response");
}

function cleanTextToArray(text: string): string[] {
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/^\[|\]$/g, '');
  text = text.replace(/^["']|["']$/gm, '');

  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => line.replace(/^[-*•]\s*/, ''))
    .map(line => line.replace(/^\d+\.\s*/, ''))
    .filter(line => !line.startsWith('{') && !line.startsWith('['));

  return lines;
}

async function callAnthropicAPI(prompt: string): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const data = await req.json();

    const { businessName, businessAddress, industry, painPoints } = data;

    if (!businessName || !businessAddress || !industry || !painPoints) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const helpfulCompaniesPrompt = `You are helping a business find real, actual service providers near their location.

Business: ${businessName}
Address: ${businessAddress}
Industry: ${industry}
Pain Points: ${painPoints}

Find 3-5 REAL companies or service providers that are located near ${businessAddress} and can help solve these pain points in the ${industry} industry. Use your knowledge of actual businesses, directories, and common service providers in that area.

If you cannot find specific local businesses near this address, return companies that operate nationally or offer remote services in this industry.

Return ONLY a JSON array with this exact format (no markdown, no code blocks, no extra text):
[
  {
    "name": "Company Name",
    "address": "Full Address or 'National Service'",
    "industry": "${industry}",
    "distance": "X miles" or "Remote/National",
    "website": "https://www.example.com or N/A if unknown"
  }
]`;

    const actionableAdvicePrompt = `A business called ${businessName} in the ${industry} industry is facing these challenges: ${painPoints}.

Provide actionable advice to address these pain points in a structured format.

Return ONLY a JSON object with this exact format (no markdown, no code blocks, no extra text):
{
  "category": "BUSINESS STRATEGY",
  "headline": "Strategic Recommendations for Growth",
  "subtitle": "Expert insights and actionable steps to address your business challenges and drive sustainable success.",
  "items": [
    {
      "icon": "target",
      "title": "Short Bold Title",
      "description": "Detailed description of the actionable advice item."
    }
  ]
}

Provide 5 advice items. Use appropriate icons from: target, lightbulb, chart, users, gear, star, rocket, shield, check, arrow.`;

    const emailTemplatePrompt = `You are helping ${businessName}, a business in the ${industry} industry, write an outreach email to potential service providers.

Context:
- ${businessName} is located at ${businessAddress}
- They are facing these challenges: ${painPoints}
- They want to reach out to service providers who can help solve these problems

Write a professional email FROM ${businessName} TO a potential service provider. The email should:
1. Introduce ${businessName} and their business
2. Explain the challenges they're facing
3. Express interest in the service provider's solutions
4. Request a consultation or meeting

Include a subject line and full email body. Use [Service Provider Name] as a placeholder for the recipient.

Return as plain text with "Subject:" and "Body:" labels.`;

    const [helpfulCompaniesResponse, actionableAdviceResponse, emailTemplateResponse] = await Promise.all([
      callAnthropicAPI(helpfulCompaniesPrompt),
      callAnthropicAPI(actionableAdvicePrompt),
      callAnthropicAPI(emailTemplatePrompt),
    ]);

    let helpfulCompanies;
    let actionableAdvice;

    try {
      helpfulCompanies = extractJSON(helpfulCompaniesResponse);

      if (!Array.isArray(helpfulCompanies)) {
        throw new Error("Response is not an array");
      }

      helpfulCompanies = helpfulCompanies.map(company => ({
        name: company.name || "Unknown",
        address: company.address || "N/A",
        industry: company.industry || industry,
        distance: company.distance || "N/A",
        website: company.website || "N/A"
      }));
    } catch (error) {
      console.error("Error parsing helpful companies:", error.message);
      helpfulCompanies = [
        {
          name: "Error finding local companies",
          address: "Please try searching online for service providers in your area",
          industry: industry,
          distance: "N/A"
        }
      ];
    }

    try {
      actionableAdvice = extractJSON(actionableAdviceResponse);

      if (!actionableAdvice.category || !actionableAdvice.headline || !Array.isArray(actionableAdvice.items)) {
        throw new Error("Invalid advice structure");
      }
    } catch (error) {
      console.error("Error parsing actionable advice:", error.message);
      actionableAdvice = {
        category: "BUSINESS STRATEGY",
        headline: "Strategic Recommendations for Growth",
        subtitle: "Expert insights and actionable steps to address your business challenges and drive sustainable success.",
        items: [
          {
            icon: "target",
            title: "Review Current Processes",
            description: "Conduct a comprehensive audit of your existing business processes to identify inefficiencies and areas for improvement."
          },
          {
            icon: "users",
            title: "Consult Industry Experts",
            description: "Engage with experienced consultants or mentors who specialize in your industry to gain valuable insights and guidance."
          },
          {
            icon: "chart",
            title: "Analyze Competitor Strategies",
            description: "Research successful competitors in your area to understand market trends and identify opportunities for differentiation."
          },
          {
            icon: "rocket",
            title: "Embrace Digital Transformation",
            description: "Explore technology solutions and digital tools that can streamline operations and enhance customer experience."
          },
          {
            icon: "star",
            title: "Gather Customer Feedback",
            description: "Implement regular feedback mechanisms to understand customer needs and continuously improve your offerings."
          }
        ]
      };
    }

    const response = {
      helpfulCompanies,
      actionableAdvice,
      emailTemplate: emailTemplateResponse,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
