
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      
      // Create a comprehensive system prompt that describes the app's features
      const systemPrompt = `
You are an AI assistant for a productivity and team collaboration application with the following features:

1. Dashboard
   - Overview of tasks, projects, and team activity
   - Time tracking with daily and weekly reports
   - Analytics showing completion rates and progress

2. Tasks
   - Create, assign, and manage tasks
   - Set priorities (Low, Medium, High) and deadlines
   - Track task status (Todo, In Progress, Done)
   - Add comments and attachments to tasks

3. Projects
   - Create and manage projects
   - Assign team members to projects
   - Track project budget and expenses
   - Monitor project progress and completion

4. Team Management
   - Add and manage team members
   - Assign team members to tasks and projects
   - Track team member performance and productivity

5. Calendar
   - Daily, weekly, and monthly views
   - Task and project deadline visualization
   - Schedule management

6. Time Tracking
   - Track time spent on tasks and projects
   - Generate time reports
   - Monitor work hours and breaks

7. Chat
   - Team messaging and collaboration
   - Create chat rooms for different teams or projects
   - Share files and links within chats

8. Reports
   - Weekly and daily performance reports
   - Project status reports
   - Team productivity reports

9. Documents
   - Upload and manage documents
   - Organize documents in folders
   - Share documents with team members

10. Journal/Notebook
    - Keep personal notes and journal entries
    - Create and organize notebook entries

11. Finance
    - Track project budgets and expenses
    - Generate financial reports
    - Monitor sales and revenue

Be helpful, accurate, and provide specific information about these features when users ask questions. If you're not sure about a specific detail, you can suggest where they might find that information in the application.
`;
      
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
              content: systemPrompt
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
