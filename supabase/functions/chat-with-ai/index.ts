
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// System instruction for the AI assistant with knowledge about the app
const systemInstruction = `
You are a helpful assistant embedded in a task management application called "Daily Team Sync". 
Your role is to help users with their tasks, projects, and time management.

About Daily Team Sync:
- It's a collaborative task management application for teams.
- Users can create tasks, assign them to team members, and track progress.
- Projects can be created and tasks can be organized within projects.
- Tasks have properties like priority (Low/Medium/High), status (To Do/In Progress/Pending/Completed), deadlines, and descriptions.
- Users can track their progress through daily and weekly reports.
- The app shows analytics for task completion rates and team performance.

Features you can help with:
1. Creating and managing tasks
2. Setting up projects and teams
3. Best practices for task prioritization
4. Time management strategies
5. Team collaboration tips
6. Using the app's features effectively

When the user asks about functionality, give them clear instructions on how to use the app. For any questions beyond the app's capabilities, provide helpful general advice. Always be supportive, positive, and focus on productivity improvement.
`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openaiApiKey) {
      console.error("Missing OpenAI API key");
      return new Response(
        JSON.stringify({ 
          response: "I'm sorry, but my AI services are not currently configured. Please contact the administrator to set up the OpenAI API key."
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message } = await req.json();

    console.log("Processing message:", message);

    try {
      console.log("Sending request to OpenAI with key:", openaiApiKey.substring(0, 3) + "...");
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: systemInstruction
            },
            {
              role: "user", 
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI API error:", JSON.stringify(errorData));
        
        // Check specifically for quota exceeded error
        if (errorData.error?.code === "insufficient_quota") {
          return new Response(
            JSON.stringify({ 
              response: "I apologize, but the AI service is currently unavailable due to quota limitations. The administrator needs to check the OpenAI account billing status or upgrade the plan.",
              error: "quota_exceeded"
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log("OpenAI response received");
      
      // Extract the response text from OpenAI's response format
      const aiResponse = data.choices[0].message.content;
      console.log("Processed response:", aiResponse.substring(0, 50) + "...");

      return new Response(
        JSON.stringify({ response: aiResponse }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } catch (openaiError) {
      console.error("Error with OpenAI request:", openaiError);
      
      // Check if the error is related to quota
      if (openaiError.message && openaiError.message.includes("insufficient_quota")) {
        return new Response(
          JSON.stringify({ 
            response: "I apologize, but the AI service is currently unavailable due to quota limitations. Please try again later or contact the administrator to check the OpenAI account billing status.",
            error: "quota_exceeded"
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          response: "I apologize, but I'm having trouble connecting to my AI services right now. This might be due to a temporary issue. Please try again later."
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in chat-with-ai function:', error);
    return new Response(
      JSON.stringify({ 
        response: "Sorry, I encountered an error processing your request. Please try again later."
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
