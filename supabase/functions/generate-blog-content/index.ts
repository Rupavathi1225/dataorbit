import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, slug, type, relatedSearchTitle } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate blog content and related searches
    if (type === 'content') {
      if (!title) {
        return new Response(
          JSON.stringify({ error: 'Title is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Generating content for:', title);
      
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `You are a professional blog content writer. Generate content in the following JSON format ONLY:
{
  "content": "Your 100 word blog content here as plain text, no HTML tags",
  "relatedSearches": ["search 1", "search 2", "search 3", "search 4", "search 5", "search 6"]
}

Rules:
- Content must be EXACTLY 100 words, no more, no less
- Content must be plain text without any HTML tags like <p>, <h1>, <h2>, etc.
- Generate exactly 6 related searches
- Each related search must be exactly 5 words
- Related searches should be relevant to the blog topic
- Return ONLY valid JSON, no other text`
            },
            {
              role: 'user',
              content: `Generate blog content and related searches for: "${title}"`
            }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI gateway error:', response.status, errorText);
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: 'AI credits exhausted. Please add more credits.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({ error: 'Failed to generate content' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content;
      
      console.log('Raw AI response:', rawContent);
      
      try {
        const cleanedContent = rawContent.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleanedContent);
        
        return new Response(
          JSON.stringify({ 
            content: parsed.content,
            relatedSearches: parsed.relatedSearches || []
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        return new Response(
          JSON.stringify({ content: rawContent, relatedSearches: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
    } else if (type === 'image') {
      if (!title) {
        return new Response(
          JSON.stringify({ error: 'Title is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Generating image for:', title);
      
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            {
              role: 'user',
              content: `Create a professional, high-quality blog featured image for an article titled: "${title}". The image should be visually appealing, modern, and relevant to the topic. Use vibrant colors and clean design. Make it suitable as a blog header image with 16:9 aspect ratio.`
            }
          ],
          modalities: ['image', 'text'],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI gateway error:', response.status, errorText);
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: 'AI credits exhausted. Please add more credits.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({ error: 'Failed to generate image' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      if (!imageUrl) {
        console.error('No image in response:', JSON.stringify(data));
        return new Response(
          JSON.stringify({ error: 'No image generated' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Image generated successfully');
      
      return new Response(
        JSON.stringify({ imageUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (type === 'webresults') {
      // Generate 6 web results based on related search title
      if (!relatedSearchTitle) {
        return new Response(
          JSON.stringify({ error: 'Related search title is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Generating web results for:', relatedSearchTitle);
      
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `You are a search result generator. Generate exactly 6 realistic web search results in the following JSON format ONLY:
{
  "webResults": [
    {
      "name": "Website Name",
      "title": "Page Title - Descriptive and SEO Friendly",
      "description": "A detailed 2-3 sentence description of what users will find on this page. Make it informative and relevant.",
      "url": "https://www.example.com/relevant-page-path/",
      "is_sponsored": false
    }
  ]
}

Rules:
- Generate exactly 6 web results
- Make the first 2 results sponsored (is_sponsored: true)
- Use realistic website names and domains
- Titles should be 8-15 words and relevant to the search query
- Descriptions should be 30-50 words
- URLs should be realistic and relevant
- Make results diverse (different websites, perspectives)
- Return ONLY valid JSON, no other text`
            },
            {
              role: 'user',
              content: `Generate 6 web search results for the query: "${relatedSearchTitle}"`
            }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI gateway error:', response.status, errorText);
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: 'AI credits exhausted. Please add more credits.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({ error: 'Failed to generate web results' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content;
      
      console.log('Raw web results response:', rawContent);
      
      try {
        const cleanedContent = rawContent.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleanedContent);
        
        return new Response(
          JSON.stringify({ webResults: parsed.webResults || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        return new Response(
          JSON.stringify({ webResults: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

    } else if (type === 'prelanding') {
      // Generate pre-landing page content based on web result name
      if (!title) {
        return new Response(
          JSON.stringify({ error: 'Web result name/title is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Generating pre-landing for:', title);
      
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `You are a landing page copywriter. Generate pre-landing page content in the following JSON format ONLY:
{
  "headline": "Attention-grabbing headline (5-10 words)",
  "description": "Compelling description that creates urgency and interest (20-40 words)",
  "button_text": "Action-oriented CTA text (2-4 words)",
  "main_image_url": "https://images.unsplash.com/photo-RELEVANT_ID?w=800"
}

Rules:
- Headline should be compelling and action-oriented
- Description should create urgency and highlight benefits
- Button text should be short and action-oriented (e.g., "Get Started", "Claim Now", "Visit Site")
- main_image_url should be a relevant Unsplash image URL (use realistic photo IDs)
- Return ONLY valid JSON, no other text`
            },
            {
              role: 'user',
              content: `Generate pre-landing page content for: "${title}"`
            }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI gateway error:', response.status, errorText);
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: 'AI credits exhausted. Please add more credits.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({ error: 'Failed to generate pre-landing content' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content;
      
      console.log('Raw pre-landing response:', rawContent);
      
      try {
        const cleanedContent = rawContent.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleanedContent);
        
        return new Response(
          JSON.stringify(parsed),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        return new Response(
          JSON.stringify({ 
            headline: 'Get Exclusive Access',
            description: 'Discover amazing offers and exclusive content. Limited time opportunity!',
            button_text: 'Get Started',
            main_image_url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid type. Use "content", "image", "webresults", or "prelanding"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in generate-blog-content:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
