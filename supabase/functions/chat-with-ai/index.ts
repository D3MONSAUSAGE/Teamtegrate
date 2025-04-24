
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    if (!openAIApiKey) {
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
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant integrated into a project management application. Be concise, professional, and helpful.'
            },
            { role: 'user', content: message }
          ],
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI API error:", errorData);
        
        // Check if it's a quota error
        const isQuotaError = errorData.error && 
          (errorData.error.code === "insufficient_quota" || 
           errorData.error.type === "insufficient_quota");
        
        if (isQuotaError) {
          // Return a helpful message about quota limits
          return new Response(
            JSON.stringify({ 
              response: "I'm sorry, but the AI service is currently unavailable due to usage limits. The administrator needs to check the OpenAI account billing and quota settings."
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log("AI response received:", data.choices[0].message.content.substring(0, 50) + "...");
      
      const aiResponse = data.choices[0].message.content;

      return new Response(
        JSON.stringify({ response: aiResponse }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } catch (openaiError) {
      console.error("Error with OpenAI request:", openaiError);
      
      // Provide a fallback response
      return new Response(
        JSON.stringify({ 
          response: "I apologize, but I'm having trouble connecting to my AI services right now. This might be due to a temporary issue or account limitations. Please try again later."
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
