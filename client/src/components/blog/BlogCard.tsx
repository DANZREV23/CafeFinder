import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { BlogPost } from '../../types';

interface BlogCardProps {
  post: BlogPost;
  index?: number;
}

export const BlogCard: React.FC<BlogCardProps> = ({ post, index = 0 }) => {
  const photoUrl = post.coverImage || post.coverImageAsset?.url || '/placeholder-cafe.jpg';

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group flex flex-col bg-white rounded-2xl border border-brand-border overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300"
    >
      <Link to={`/blog/${post.slug}`} className="relative h-52 w-full overflow-hidden bg-stone-100 block">
        <img
          src={photoUrl}
          alt={post.coverImageAlt || post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {post.category && (
          <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-brand-coffee text-white text-xs font-bold uppercase tracking-wider shadow-sm">
            {post.category}
          </span>
        )}
      </Link>

      <div className="p-6 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center gap-3 text-xs text-stone-400 mb-2.5">
            {post.publishedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(post.publishedAt).toLocaleDateString()}
              </span>
            )}
            {post.author?.name && (
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {post.author.name}
              </span>
            )}
          </div>

          <h3 className="font-serif font-bold text-xl text-stone-900 group-hover:text-brand-coffee transition-colors line-clamp-2 mb-2 leading-snug">
            <Link to={`/blog/${post.slug}`}>{post.title}</Link>
          </h3>

          {post.excerpt && (
            <p className="text-sm text-stone-600 line-clamp-2 leading-relaxed mb-4">
              {post.excerpt}
            </p>
          )}
        </div>

        <Link
          to={`/blog/${post.slug}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-brand-coffee hover:text-brand-coffee-dark mt-auto group-hover:translate-x-1 transition-transform"
        >
          Read Story
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.article>
  );
};

export default BlogCard;
