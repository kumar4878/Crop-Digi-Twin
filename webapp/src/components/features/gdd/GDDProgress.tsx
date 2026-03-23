import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { ThermometerSun, Sprout, Milestone } from 'lucide-react';

interface GDDProgressProps {
  fieldId: string;
}

export const GDDProgress: React.FC<GDDProgressProps> = ({ fieldId }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['gdd-progress', fieldId],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:3000/api/gdd/field/${fieldId}/check`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    },
    refetchInterval: 30000 // Polling every 30s to see if auto-progression hit
  });

  if (isLoading) return <div className="p-4 bg-slate-100 rounded animate-pulse h-40" />;
  if (error || !data) return <div className="p-4 text-red-500">Failed to load temperature progression metrics.</div>;

  // Calculate percentage
  const progressPercent = data.gddRequired ? Math.min(100, (data.gddAccumulated / data.gddRequired) * 100) : 100;

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <ThermometerSun className="h-5 w-5 text-orange-500" />
          Growth Degree Days (GDD) Engine
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Sprout className="h-4 w-4 text-emerald-600" />
              <span className="font-medium">Current: {data.currentStage.replace(/_/g, ' ')}</span>
            </div>
            {data.nextStage && (
              <div className="flex items-center gap-2 text-slate-500">
                <span>Next: {data.nextStage.replace(/_/g, ' ')}</span>
                <Milestone className="h-4 w-4" />
              </div>
            )}
            {!data.nextStage && (
              <div className="text-emerald-700 font-semibold uppercase text-xs tracking-wider">
                Harvest Ready
              </div>
            )}
          </div>

          <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="absolute left-0 top-0 h-full bg-emerald-500 transition-all duration-1000 ease-in-out" 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>

          {data.gddRequired ? (
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>{Math.round(data.gddAccumulated)} / {data.gddRequired} °C-days</span>
              <span>{Math.round(progressPercent)}% to progression</span>
            </div>
          ) : (
            <div className="text-xs text-slate-500">Accumulated {Math.round(data.gddAccumulated)} °C-days since sowing.</div>
          )}
          
          {data.readyToProgress && (
            <div className="text-xs bg-amber-50 text-amber-700 p-2 rounded border border-amber-200">
              Growth thresholds exceeded! Crop will automatically transition to {data.nextStage} in the next nightly batch.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
