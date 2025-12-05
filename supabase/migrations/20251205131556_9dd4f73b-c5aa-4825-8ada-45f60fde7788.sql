-- Add web_result_page column to related_searches (1-4 for different web result pages)
ALTER TABLE public.related_searches 
ADD COLUMN web_result_page integer NOT NULL DEFAULT 1;

-- Add constraint to ensure web_result_page is between 1 and 4
ALTER TABLE public.related_searches
ADD CONSTRAINT related_searches_web_result_page_check CHECK (web_result_page >= 1 AND web_result_page <= 4);