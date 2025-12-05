import { Link } from "react-router-dom";
import { Calendar, User } from "lucide-react";
import { trackEvent } from "@/lib/tracking";

interface BlogCardProps {
  id: string;
  serialNumber: number;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  author: string;
  publishedAt: string;
  categoryName: string;
  categorySlug: string;
}

const BlogCard = ({
  id,
  serialNumber,
  title,
  slug,
  excerpt,
  featuredImage,
  author,
  publishedAt,
  categoryName,
  categorySlug,
}: BlogCardProps) => {
  const handleClick = () => {
    trackEvent('blog_click', { blogId: id, pageUrl: `/blog/${categorySlug}/${slug}` });
  };

  return (
    <Link 
      to={`/blog/${categorySlug}/${slug}`} 
      onClick={handleClick}
      className="group block bg-card rounded-xl overflow-hidden border border-border hover:shadow-lg transition-all duration-300"
    >
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={featuredImage} 
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded">
          #{serialNumber}
        </span>
      </div>
      <div className="p-5">
        <span className="text-primary text-sm font-medium">{categoryName}</span>
        <h3 className="text-foreground font-semibold text-lg mt-1 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{excerpt}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {author}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default BlogCard;
