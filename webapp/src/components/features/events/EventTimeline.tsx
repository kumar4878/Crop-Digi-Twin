import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';

interface EventTimelineProps {
  plotId: string;
  season: string;
}

export const EventTimeline: React.FC<EventTimelineProps> = ({ plotId, season }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['events', plotId, season],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:3000/api/events/plot/${plotId}/season/${season}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  });

  if (isLoading) return <div className="p-4 animate-pulse bg-slate-100 h-32 rounded-md">Loading event timeline...</div>;
  if (error) return <div className="p-4 text-red-500">Failed to load events.</div>;
  if (!data?.events || data.events.length === 0) return <div className="p-4 text-gray-500">No events recorded yet for this season.</div>;

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          Immutable Event Ledger
          <Badge variant="secondary" className="text-xs font-normal">
            {data.count} events
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative border-l-2 border-slate-200 ml-3 md:ml-4 space-y-6 pb-4">
          {data.events.map((event: any) => (
            <div key={event.eventId} className="relative pl-6">
              {/* Timeline Dot */}
              <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                <h4 className="text-sm font-semibold tracking-tight text-slate-900">
                  {event.eventType.replace(/_/g, ' ')}
                </h4>
                <time className="text-xs text-slate-500">
                  {format(new Date(event.timestamp), 'MMM d, yyyy h:mm a')}
                </time>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-slate-50">
                  {event.provenance.source}
                </Badge>
                {event.provenance.confidence < 100 && (
                  <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800 hover:bg-amber-100">
                    {event.provenance.confidence}% Confidence
                  </Badge>
                )}
                {event.payload?.reasoning && event.payload.reasoning.length > 0 && (
                  <span className="text-xs text-slate-600 block mt-1 w-full italic">
                    {event.payload.reasoning.join('. ')}
                  </span>
                )}
              </div>
              
              <div className="mt-3 text-[10px] font-mono text-slate-400 bg-slate-50 p-1.5 rounded truncate" title={event.hash}>
                Hash: {event.hash}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
