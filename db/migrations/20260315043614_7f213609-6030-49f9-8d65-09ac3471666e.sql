
-- Add 'pro' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'pro';

-- Add requested_role column to premium_requests
ALTER TABLE public.premium_requests 
ADD COLUMN IF NOT EXISTS requested_role text NOT NULL DEFAULT 'premium';

-- Create blog_articles table
CREATE TABLE public.blog_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  excerpt text,
  cover_image_url text,
  author_name text NOT NULL DEFAULT 'NIS2Shield Team',
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.blog_articles ENABLE ROW LEVEL SECURITY;

-- Public can read published articles
CREATE POLICY "Anyone can read published articles"
ON public.blog_articles FOR SELECT
USING (published = true);

-- Admins can manage all articles
CREATE POLICY "Admins can manage articles"
ON public.blog_articles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_blog_articles_updated_at
  BEFORE UPDATE ON public.blog_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
