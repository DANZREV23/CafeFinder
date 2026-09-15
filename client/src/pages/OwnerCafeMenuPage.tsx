import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, LayoutGrid } from 'lucide-react';
import MenuManagement from '@/components/owner/MenuManagement';
import { fetchApi } from '@/services/api';

export default function OwnerCafeMenuPage() {
  const { id } = useParams<{ id: string }>();
  const [cafeName, setCafeName] = useState('');

  useEffect(() => {
    const fetchCafe = async () => {
      try {
        const response = await fetchApi<{ success: boolean, data: any }>(`/owner/cafes/${id}`);
        setCafeName(response.data.name);
      } catch (err) {
        console.error('Failed to fetch cafe');
      }
    };
    fetchCafe();
  }, [id]);

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link to="/owner/cafes" className="hover:text-primary transition-colors">Cafes</Link>
            <span>/</span>
            <Link to={`/owner/cafes/${id}`} className="hover:text-primary transition-colors">{cafeName || 'Cafe Details'}</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Menu</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Manage Cafe Menu</h1>
              <p className="text-muted-foreground">Define categories, items, prices, and variations for {cafeName}</p>
            </div>
            <Button variant="outline" asChild>
              <Link to={`/owner/cafes/${id}`}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Details
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <MenuManagement cafeId={id!} />
        </div>
      </div>
    </MainLayout>
  );
}
