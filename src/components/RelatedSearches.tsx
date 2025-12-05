import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { trackEvent } from "@/lib/tracking";

interface RelatedSearch {
  id: string;
  title: string;
  position: number;
  web_result_page: number;
}

interface RelatedSearchesProps {
  searches: RelatedSearch[];
  blogId: string;
}

const RelatedSearches = ({ searches, blogId }: RelatedSearchesProps) => {
  const navigate = useNavigate();

  const handleClick = async (search: RelatedSearch) => {
    await trackEvent('related_search_click', { 
      blogId, 
      relatedSearchId: search.id,
      pageUrl: `/wr=${search.web_result_page}`
    });
    navigate(`/wr=${search.web_result_page}`);
  };

  if (searches.length === 0) return null;

  // Limit to 4 related searches
  const limitedSearches = searches.slice(0, 4);

  return (
    <div className="my-8">
      <p className="text-muted-foreground text-sm mb-4">Related searches</p>
      <div className="space-y-3">
        {limitedSearches.map((search) => (
          <button
            key={search.id}
            onClick={() => handleClick(search)}
            className="w-full bg-[#1a1a2e] hover:bg-[#252545] text-white p-5 rounded-lg flex items-center justify-between transition-all duration-200 group"
          >
            <span className="font-medium">{search.title}</span>
            <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default RelatedSearches;