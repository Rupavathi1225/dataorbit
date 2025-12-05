import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlogCard from "@/components/BlogCard";
import { trackEvent } from "@/lib/tracking";

interface Blog {
  id: string;
  serial_number: number;
  title: string;
  slug: string;
  content: string;
  featured_image: string;
  author: string;
  published_at: string;
  categories: { name: string; slug: string } | null;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

const CategoryPage = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', categorySlug)
        .maybeSingle();
      
      if (catData) {
        setCategory(catData);
        await trackEvent('page_view', { pageUrl: `/category/${categorySlug}` });
        
        const { data: blogsData } = await supabase
          .from('blogs')
          .select('id, serial_number, title, slug, content, featured_image, author, published_at, categories(name, slug)')
          .eq('status', 'published')
          .eq('category_id', catData.id)
          .order('published_at', { ascending: false });
        
        if (blogsData) setBlogs(blogsData as Blog[]);
      }
      
      setLoading(false);
    };
    
    fetchData();
  }, [categorySlug]);

  if (!category && !loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Category Not Found</h1>
          <p className="text-muted-foreground">The category you're looking for doesn't exist.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {category?.name}
          </h1>
          <p className="text-muted-foreground text-lg">
            Explore articles in {category?.name}
          </p>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl border border-border animate-pulse">
                <div className="aspect-video bg-muted" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-6 bg-muted rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No blogs in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <BlogCard
                key={blog.id}
                id={blog.id}
                serialNumber={blog.serial_number}
                title={blog.title}
                slug={blog.slug}
                excerpt={blog.content.substring(0, 150) + '...'}
                featuredImage={blog.featured_image}
                author={blog.author}
                publishedAt={blog.published_at}
                categoryName={blog.categories?.name || 'Uncategorized'}
                categorySlug={blog.categories?.slug || 'uncategorized'}
              />
            ))}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default CategoryPage;
