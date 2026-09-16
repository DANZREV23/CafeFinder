import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, Clock, User, ArrowLeft, Share2, Facebook, Twitter, Link as LinkIcon, ChevronRight } from 'lucide-react';
import { blogService } from '../../services/blogService';
import { BlogPost } from '../../types';
import { format } from 'date-fns';
import { BlogCard } from '../../components/blog/BlogCard';
import ReactMarkdown from 'react-markdown';
import { MainLayout } from '../../components/layout/MainLayout';

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadPost();
    }
  }, [slug]);

  const loadPost = async () => {
    setLoading(true);
    try {
      const response = await blogService.getBySlug(slug!);
      if (response.success) {
        setPost(response.data.post);
        setRelatedPosts(response.data.relatedPosts);
        
        // SEO: Update document title and meta tags if needed
        document.title = `${response.data.post.metaTitle || response.data.post.title} | CafeFinder`;
      } else {
        navigate('/blog');
      }
    } catch (error) {
      console.error('Failed to load blog post:', error);
      navigate('/blog');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!post) return null;

  return (
    <MainLayout>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="relative h-[60vh] min-h-[400px] w-full overflow-hidden">
          <img
            src={post.coverImage || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80'}
            alt={post.coverImageAlt || post.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-white" />
          
          <div className="absolute inset-0 flex flex-col justify-end px-4 sm:px-6 lg:px-8 pb-12">
            <div className="max-w-4xl mx-auto w-full">
              <Link 
                to="/blog"
                className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-6 font-medium bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-full transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Blog
              </Link>
              
              {post.category && (
                <span className="inline-block bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-widest mb-4">
                  {post.category}
                </span>
              )}
              
              <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight drop-shadow-md">
                {post.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-6 text-white/90 font-medium">
                <div className="flex items-center gap-2">
                  <img
                    src={post.author.avatarUrl || 'https://ui-avatars.com/api/?name=' + post.author.name}
                    alt={post.author.name}
                    className="w-10 h-10 rounded-full border-2 border-white/50"
                    referrerPolicy="no-referrer"
                  />
                  <span>{post.author.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {post.publishedAt ? format(new Date(post.publishedAt), 'MMMM d, yyyy') : 'Recently'}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  {post.readingTime}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_80px] gap-12">
            {/* Main Content */}
            <article className="prose prose-lg prose-neutral max-w-none">
              <div className="mb-12 text-xl text-neutral-600 italic leading-relaxed font-medium border-l-4 border-primary-500 pl-6">
                {post.excerpt}
              </div>
              
              <div className="markdown-body">
                {/<\/?[a-z][\s\S]*>/i.test(post.content) ? (
                  <div dangerouslySetInnerHTML={{ __html: post.content }} />
                ) : (
                  <ReactMarkdown>{post.content}</ReactMarkdown>
                )}
              </div>
            </article>

            {/* Social Sidebar (Desktop) */}
            <aside className="hidden lg:flex flex-col items-center gap-6 sticky top-32 h-fit">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 rotate-90 mb-8 whitespace-nowrap">
                Share Article
              </div>
              <button className="w-12 h-12 rounded-full border border-neutral-100 flex items-center justify-center hover:bg-primary-50 hover:border-primary-100 text-neutral-600 hover:text-primary-600 transition-all">
                <Facebook className="w-5 h-5" />
              </button>
              <button className="w-12 h-12 rounded-full border border-neutral-100 flex items-center justify-center hover:bg-primary-50 hover:border-primary-100 text-neutral-600 hover:text-primary-600 transition-all">
                <Twitter className="w-5 h-5" />
              </button>
              <button className="w-12 h-12 rounded-full border border-neutral-100 flex items-center justify-center hover:bg-primary-50 hover:border-primary-100 text-neutral-600 hover:text-primary-600 transition-all">
                <LinkIcon className="w-5 h-5" />
              </button>
            </aside>
          </div>

          {/* Post Footer */}
          <div className="mt-20 pt-12 border-t border-neutral-100 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <img
                src={post.author.avatarUrl || 'https://ui-avatars.com/api/?name=' + post.author.name}
                alt={post.author.name}
                className="w-16 h-16 rounded-full"
                referrerPolicy="no-referrer"
              />
              <div>
                <div className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-1">Written By</div>
                <div className="text-xl font-bold text-neutral-900">{post.author.name}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-full font-bold hover:bg-neutral-800 transition-all">
                <Share2 className="w-4 h-4" />
                Share this story
              </button>
            </div>
          </div>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="bg-neutral-50 py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-3xl font-black text-neutral-900">More Stories</h2>
                <Link to="/blog" className="text-primary-600 font-bold flex items-center gap-1 hover:gap-2 transition-all">
                  View All <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {relatedPosts.map((p, idx) => (
                  <BlogCard key={p.id} post={p} index={idx} />
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </MainLayout>
  );
};

export default BlogPostPage;
