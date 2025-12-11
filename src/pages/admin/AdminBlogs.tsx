import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Sparkles, ImageIcon, Loader2, Download, Copy, CheckCircle, XCircle } from "lucide-react";

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
  category_id: number | null;
  status: string;
  published_at: string;
  categories: { name: string } | null;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

const AdminBlogs = () => {
  const { toast } = useToast();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [generatedRelatedSearches, setGeneratedRelatedSearches] = useState<string[]>([]);
  const [selectedRelatedSearches, setSelectedRelatedSearches] = useState<number[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    featured_image: '',
    author: '',
    author_bio: '',
    author_image: '',
    category_id: '',
    status: 'draft',
  });

  const fetchData = async () => {
    const [blogsRes, catsRes] = await Promise.all([
      supabase.from('blogs').select('*, categories(name)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('id'),
    ]);
    
    if (blogsRes.data) setBlogs(blogsRes.data as Blog[]);
    if (catsRes.data) setCategories(catsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData({ ...formData, title, slug: generateSlug(title) });
  };

  const generateContent = async () => {
    if (!formData.title.trim()) {
      toast({ title: 'Error', description: 'Please enter a title first', variant: 'destructive' });
      return;
    }

    setGeneratingContent(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-content', {
        body: { title: formData.title, slug: formData.slug, type: 'content' }
      });

      if (error) throw error;
      
      if (data.content) {
        setFormData(prev => ({ ...prev, content: data.content }));
        if (data.relatedSearches && data.relatedSearches.length > 0) {
          setGeneratedRelatedSearches(data.relatedSearches);
          setSelectedRelatedSearches([0, 1, 2, 3].filter(i => i < data.relatedSearches.length));
        }
        toast({ title: 'Success', description: 'Content and related searches generated' });
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error generating content:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to generate content', 
        variant: 'destructive' 
      });
    } finally {
      setGeneratingContent(false);
    }
  };

  const generateImage = async () => {
    if (!formData.title.trim()) {
      toast({ title: 'Error', description: 'Please enter a title first', variant: 'destructive' });
      return;
    }

    setGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-content', {
        body: { title: formData.title, slug: formData.slug, type: 'image' }
      });

      if (error) throw error;
      
      if (data.imageUrl) {
        setFormData(prev => ({ ...prev, featured_image: data.imageUrl }));
        toast({ title: 'Success', description: 'Image generated successfully' });
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error generating image:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to generate image', 
        variant: 'destructive' 
      });
    } finally {
      setGeneratingImage(false);
    }
  };

  const toggleRelatedSearch = (index: number) => {
    if (selectedRelatedSearches.includes(index)) {
      setSelectedRelatedSearches(prev => prev.filter(i => i !== index));
    } else if (selectedRelatedSearches.length < 4) {
      setSelectedRelatedSearches(prev => [...prev, index]);
    } else {
      toast({ title: 'Limit', description: 'You can select maximum 4 related searches', variant: 'destructive' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const blogData = {
      title: formData.title,
      slug: formData.slug,
      content: formData.content,
      featured_image: formData.featured_image || null,
      author: formData.author,
      author_bio: formData.author_bio || null,
      author_image: formData.author_image || null,
      category_id: formData.category_id ? parseInt(formData.category_id) : null,
      status: formData.status,
      published_at: formData.status === 'published' ? new Date().toISOString() : null,
    };
    
    if (editingBlog) {
      const { error } = await supabase
        .from('blogs')
        .update(blogData)
        .eq('id', editingBlog.id);
      
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Blog updated successfully' });
        setIsDialogOpen(false);
        fetchData();
      }
    } else {
      const { data: newBlog, error } = await supabase.from('blogs').insert(blogData).select().single();
      
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        // Create selected related searches
        if (newBlog && selectedRelatedSearches.length > 0) {
          const relatedSearchesToCreate = selectedRelatedSearches.map((idx, position) => ({
            title: generatedRelatedSearches[idx],
            blog_id: newBlog.id,
            position: position + 1,
            web_result_page: position + 1, // /wr=1, /wr=2, etc.
          }));
          
          await supabase.from('related_searches').insert(relatedSearchesToCreate);
        }
        
        toast({ title: 'Success', description: 'Blog created successfully' });
        setIsDialogOpen(false);
        fetchData();
      }
    }
    
    resetForm();
  };

  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      slug: blog.slug,
      content: blog.content,
      featured_image: blog.featured_image || '',
      author: blog.author,
      author_bio: blog.author_bio || '',
      author_image: blog.author_image || '',
      category_id: blog.category_id?.toString() || '',
      status: blog.status,
    });
    setGeneratedRelatedSearches([]);
    setSelectedRelatedSearches([]);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog?')) return;
    
    const { error } = await supabase.from('blogs').delete().eq('id', id);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Blog deleted successfully' });
      setSelectedIds(prev => prev.filter(i => i !== id));
      fetchData();
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      content: '',
      featured_image: '',
      author: '',
      author_bio: '',
      author_image: '',
      category_id: '',
      status: 'draft',
    });
    setEditingBlog(null);
    setGeneratedRelatedSearches([]);
    setSelectedRelatedSearches([]);
  };

  // Bulk actions
  const toggleSelectAll = () => {
    if (selectedIds.length === blogs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(blogs.map(b => b.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const getBaseUrl = () => {
    return window.location.origin;
  };

  const copyLinks = () => {
    const selectedBlogs = blogs.filter(b => selectedIds.includes(b.id));
    const links = selectedBlogs.map(b => `${getBaseUrl()}/blog/${b.slug}`).join('\n');
    navigator.clipboard.writeText(links);
    toast({ title: 'Copied', description: `${selectedBlogs.length} link(s) copied to clipboard` });
  };

  const exportCSV = (all: boolean) => {
    const dataToExport = all ? blogs : blogs.filter(b => selectedIds.includes(b.id));
    const headers = ['Serial #', 'Title', 'Slug', 'Author', 'Category', 'Status', 'Link'];
    const rows = dataToExport.map(b => [
      b.serial_number,
      b.title,
      b.slug,
      b.author,
      b.categories?.name || '',
      b.status,
      `${getBaseUrl()}/blog/${b.slug}`
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blogs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast({ title: 'Exported', description: `${dataToExport.length} blog(s) exported` });
  };

  const bulkUpdateStatus = async (status: string) => {
    const { error } = await supabase.from('blogs').update({ status }).in('id', selectedIds);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `${selectedIds.length} blog(s) ${status === 'published' ? 'activated' : 'deactivated'}` });
      fetchData();
    }
  };

  const bulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} blog(s)?`)) return;
    const { error } = await supabase.from('blogs').delete().in('id', selectedIds);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `${selectedIds.length} blog(s) deleted` });
      setSelectedIds([]);
      fetchData();
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-foreground">Blogs</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Blog</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBlog ? 'Edit Blog' : 'Create New Blog'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Title *</label>
                <Input value={formData.title} onChange={(e) => handleTitleChange(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Slug *</label>
                <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Author</label>
                <Input value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Category</label>
                <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-foreground">Content * (100 words)</label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={generateContent}
                    disabled={generatingContent || !formData.title.trim()}
                    className="gap-1"
                  >
                    {generatingContent ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Generate AI Content
                  </Button>
                </div>
                <Textarea 
                  value={formData.content} 
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })} 
                  rows={6} 
                  required 
                  placeholder="Enter blog content or generate with AI (100 words)..."
                />
              </div>

              {/* Generated Related Searches */}
              {generatedRelatedSearches.length > 0 && (
                <div className="border border-border rounded-lg p-4 bg-muted/50">
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Select Related Searches (max 4) - Click to select/deselect
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {generatedRelatedSearches.map((search, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => toggleRelatedSearch(index)}
                        className={`p-2 text-sm rounded-md border text-left transition-colors ${
                          selectedRelatedSearches.includes(index)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-border hover:bg-muted'
                        }`}
                      >
                        <span className="font-medium mr-1">#{selectedRelatedSearches.indexOf(index) + 1 || '-'}</span>
                        {search}
                        {selectedRelatedSearches.includes(index) && (
                          <span className="ml-1 text-xs">→ /wr={selectedRelatedSearches.indexOf(index) + 1}</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Selected: {selectedRelatedSearches.length}/4
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-foreground">Featured Image</label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={generateImage}
                    disabled={generatingImage || !formData.title.trim()}
                    className="gap-1"
                  >
                    {generatingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ImageIcon className="w-4 h-4" />
                    )}
                    Generate AI Image
                  </Button>
                </div>
                <Input 
                  value={formData.featured_image} 
                  onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })} 
                  placeholder="Or paste image URL here..."
                />
                {formData.featured_image && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-border">
                    <img 
                      src={formData.featured_image} 
                      alt="Featured preview" 
                      className="w-full h-40 object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Author Image URL</label>
                  <Input value={formData.author_image} onChange={(e) => setFormData({ ...formData, author_image: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Status</label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Author Bio</label>
                <Textarea value={formData.author_bio} onChange={(e) => setFormData({ ...formData, author_bio: e.target.value })} rows={2} />
              </div>
              <Button type="submit" className="w-full">{editingBlog ? 'Update Blog' : 'Create Blog'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="mb-4 p-3 bg-muted rounded-lg flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{selectedIds.length} of {blogs.length} selected</span>
          <div className="flex gap-2 ml-auto flex-wrap">
            <Button variant="outline" size="sm" onClick={() => exportCSV(true)}>
              <Download className="w-4 h-4 mr-1" />Export All CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportCSV(false)}>
              <Download className="w-4 h-4 mr-1" />Export Selected ({selectedIds.length})
            </Button>
            <Button variant="outline" size="sm" onClick={copyLinks}>
              <Copy className="w-4 h-4 mr-1" />Copy
            </Button>
            <Button variant="outline" size="sm" onClick={() => bulkUpdateStatus('published')}>
              <CheckCircle className="w-4 h-4 mr-1" />Activate
            </Button>
            <Button variant="outline" size="sm" onClick={() => bulkUpdateStatus('draft')}>
              <XCircle className="w-4 h-4 mr-1" />Deactivate
            </Button>
            <Button variant="destructive" size="sm" onClick={bulkDelete}>
              <Trash2 className="w-4 h-4 mr-1" />Delete ({selectedIds.length})
            </Button>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="p-4 w-12">
                  <Checkbox 
                    checked={selectedIds.length === blogs.length && blogs.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="text-left p-4 text-sm font-medium text-foreground">#</th>
                <th className="text-left p-4 text-sm font-medium text-foreground">Title</th>
                <th className="text-left p-4 text-sm font-medium text-foreground">Category</th>
                <th className="text-left p-4 text-sm font-medium text-foreground">Author</th>
                <th className="text-left p-4 text-sm font-medium text-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((blog) => (
                <tr key={blog.id} className="border-t border-border">
                  <td className="p-4">
                    <Checkbox 
                      checked={selectedIds.includes(blog.id)}
                      onCheckedChange={() => toggleSelect(blog.id)}
                    />
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{blog.serial_number}</td>
                  <td className="p-4 text-sm text-foreground">{blog.title}</td>
                  <td className="p-4 text-sm text-muted-foreground">{blog.categories?.name || '-'}</td>
                  <td className="p-4 text-sm text-muted-foreground">{blog.author}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded ${blog.status === 'published' ? 'bg-green-500/20 text-green-600' : 'bg-yellow-500/20 text-yellow-600'}`}>
                      {blog.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(blog)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(blog.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminBlogs;