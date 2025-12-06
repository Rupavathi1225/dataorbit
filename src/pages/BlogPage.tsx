import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RelatedSearches from "@/components/RelatedSearches";
import { trackEvent } from "@/lib/tracking";

interface Blog {
  id: string;
  serial_number: number;
  title: string;
  slug: string;
  content: string;
  featured_image: string;
  author: string;
  author_bio: string | null;
  author_image: string | null;
  published_at: string;
  categories: { name: string; slug: string } | null;
}

interface RelatedSearch {
  id: string;
  title: string;
  position: number;
  web_result_page: number;
}

const BlogPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [relatedSearches, setRelatedSearches] = useState<RelatedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const { data: blogData } = await supabase
        .from('blogs')
        .select('*, categories(name, slug)')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();
      
      if (blogData) {
        setBlog(blogData as Blog);
        await trackEvent('page_view', { blogId: blogData.id, pageUrl: window.location.pathname });
        
        const { data: searchData } = await supabase
          .from('related_searches')
          .select('*')
          .eq('blog_id', blogData.id)
          .order('position');
        
        if (searchData) setRelatedSearches(searchData);
      }
      
      setLoading(false);
    };
    
    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Blog Not Found</h1>
          <p className="text-muted-foreground">The article you're looking for doesn't exist.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <span className="inline-block bg-muted text-muted-foreground text-sm px-3 py-1 rounded-full">
              {blog.categories?.name}
            </span>
            <span className="text-muted-foreground text-sm ml-3">
              • {new Date(blog.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-8 leading-tight">
            {blog.title}
          </h1>
          
          <img 
            src={blog.featured_image} 
            alt={blog.title}
            className="w-full rounded-xl mb-8 aspect-video object-cover"
          />
          
          <RelatedSearches searches={relatedSearches} blogId={blog.id} />
          
          <article className="prose prose-lg max-w-none">
            {blog.content.split('\n').map((paragraph, i) => (
              <p key={i} className="mb-4 text-foreground/90 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </article>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default BlogPage;
