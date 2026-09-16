import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { BlogPost } from '../../types';
import { format } from 'date-fns';

interface BlogCardProps {
  post: BlogPost;
  index?: number;
}

export const BlogCard: React.FC<BlogCardProps> = ({ post, index = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group bg-white rounded-xl overflow-hidden border border-neutral-100 hover:border-neutral-200 hover:shadow-lg transition-all"
    >
      <Link to={`/blog/${post.slug}`} className="block relative aspect-[16/9] overflow-hidden">
        <img
          src={post.coverImage || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80'}
          alt={post.coverImageAlt || post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        {post.category && (
          <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-neutral-900 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            {post.category}
          </span>
        )}
      </Link>

      <div className="p-6">
        <div className="flex items-center gap-4 text-xs text-neutral-500 mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {post.publishedAt ? format(new Date(post.publishedAt), 'MMM d, yyyy') : 'Recently'}
          </span>
          {post.readingTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {post.readingTime}
            </span>
          )}
        </div>

        <Link to={`/blog/${post.slug}`}>
          <h3 className="text-xl font-bold text-neutral-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
            {post.title}
          </h3>
        </Link>

        {post.excerpt && (
          <p className="text-neutral-600 text-sm mb-6 line-clamp-3 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2">
            {post.author.avatarUrl ? (
              <img
                src={post.author.avatarUrl}
                alt={post.author.name}
                className="w-6 h-6 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-[10px] font-bold text-neutral-500">
                {post.author.name.charAt(0)}
              </div>
            )}
            <span className="text-xs font-medium text-neutral-700">{post.author.name}</span>
          </div>

          <Link
            to={`/blog/${post.slug}`}
            className="text-primary-600 text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all"
          >
            Read More
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
