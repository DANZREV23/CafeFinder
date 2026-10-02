import React from 'react';
import { motion } from 'motion/react';
import { HeroSearch } from '../components/home/HeroSearch';
import { RecommendedForYou } from '../components/home/RecommendedForYou';
import { TrendingCafes } from '../components/home/TrendingCafes';
import { CuratedLists } from '../components/home/CuratedLists';
import { VibeExplorer } from '../components/home/VibeExplorer';
import { DiscoveryCTA } from '../components/home/DiscoveryCTA';
import { TestimonialsSection } from '../components/home/TestimonialsSection';
import { BlogPreview } from '../components/home/BlogPreview';
import { OwnerCTA } from '../components/home/OwnerCTA';

import { MainLayout } from '@/components/layout/MainLayout';
import { SEO } from '@/components/common/SEO';

const HomePage: React.FC = () => {
  return (
    <MainLayout>
      <SEO 
        title="Find Your Next Favorite Cafe"
        description="Discover cafes by location, vibe, coffee type, Wi-Fi, amenities, reviews, and more. Your ultimate guide to the best coffee shops."
      />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col w-full"
      >
        <HeroSearch />
        
        <RecommendedForYou />

        <TrendingCafes />
        
        <CuratedLists />
        
        <VibeExplorer />
        
        <DiscoveryCTA />
        
        <TestimonialsSection />
        
        <BlogPreview />
        
        <OwnerCTA />
      </motion.main>
    </MainLayout>
  );
};

export default HomePage;
