import React from 'react';
import { Link } from 'react-router-dom';
import { Store, Plus, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../ui/Button';

export const OwnerCTA: React.FC = () => {
  return (
    <section className="py-24 px-4 bg-white border-t border-brand-border">
      <div className="container max-w-7xl mx-auto">
        <div className="bg-brand-background rounded-[3rem] p-12 md:p-20 overflow-hidden relative border border-brand-border/30">
          {/* Decorative background */}
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-brand-coffee/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-display font-bold text-brand-black mb-8 leading-tight">
                Own a great cafe? <br />
                <span className="text-brand-coffee">Get discovered.</span>
              </h2>
              
              <p className="text-xl text-brand-muted mb-10 max-w-xl leading-relaxed">
                Claim your listing, keep your information updated, and help more coffee lovers discover your cafe. We provide the tools to grow your community.
              </p>
              
              <div className="space-y-4 mb-10">
                {[
                  'Showcase your best photos and menu items',
                  'Respond to customer reviews and feedback',
                  'Gain insights into how customers find you',
                  'Verified business badge for your profile'
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-brand-coffee/10 rounded-full flex items-center justify-center text-brand-coffee">
                      <CheckCircle size={14} />
                    </div>
                    <span className="text-brand-charcoal font-medium">{item}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Link to="/owner">
                  <Button className="bg-brand-coffee text-white hover:bg-brand-coffee/90 rounded-full px-8 py-4 h-auto font-bold shadow-xl shadow-brand-coffee/10">
                    Claim Your Cafe
                  </Button>
                </Link>
                <Link to="/submit-cafe">
                  <Button variant="outline" className="rounded-full px-8 py-4 h-auto font-bold border-brand-coffee text-brand-coffee hover:bg-brand-coffee/5">
                    Submit New Cafe
                  </Button>
                </Link>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&q=80" 
                  alt="Cafe Owner"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-brand-coffee/10" />
              </div>
              
              {/* Floating Stat */}
              <div className="absolute -top-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-brand-border/50 hidden md:block">
                <p className="text-3xl font-display font-bold text-brand-coffee">250+</p>
                <p className="text-xs font-bold text-brand-muted uppercase tracking-widest mt-1">Owners Joined</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
