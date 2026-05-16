import React, { useState } from "react";
import { 
  useListEvents, 
  useSyncClassroom,
  getListEventsQueryKey,
  getGetUpcomingEventsQueryKey,
  getGetEventsSummaryQueryKey
} from "@workspace/api-client-react";
import { Shell } from "@/components/layout/Shell";
import { EventCard } from "@/components/shared/EventCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Calendar as CalendarIcon, RefreshCw } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const EVENT_TYPES = [
  "quiz", "exam", "viva", "assignment", "presentation", "other"
];

export default function Events() {
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryParams = eventTypeFilter ? { event_type: eventTypeFilter } : {};

  const { data: events, isLoading } = useListEvents(queryParams, {
    query: { queryKey: getListEventsQueryKey(queryParams) }
  });

  const syncClassroom = useSyncClassroom();

  const handleSync = () => {
    syncClassroom.mutate({}, {
      onSuccess: (result) => {
        toast({
          title: "Sync Complete",
          description: `Processed ${result.coursesProcessed} courses, found ${result.announcementsFound} announcements, extracted ${result.eventsExtracted} events.`,
        });
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetUpcomingEventsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetEventsSummaryQueryKey() });
      }
    });
  };

  const filteredEvents = events?.filter(event => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return event.courseName.toLowerCase().includes(lowerQuery) || 
           event.rawText.toLowerCase().includes(lowerQuery);
  });

  return (
    <Shell>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Events</h1>
          <p className="text-muted-foreground mt-1">
            Browse and filter your academic schedule.
          </p>
        </div>
        <Button variant="outline" onClick={handleSync} disabled={syncClassroom.isPending} className="gap-2">
          <RefreshCw size={16} className={syncClassroom.isPending ? "animate-spin" : ""} />
          Sync Classroom
        </Button>
      </div>

      <div className="flex flex-col space-y-4 mb-8 bg-card border rounded-lg p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by course or text..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
          <div className="flex items-center">
            <ToggleGroup 
              type="single" 
              value={eventTypeFilter} 
              onValueChange={(value) => setEventTypeFilter(value)}
              className="justify-start overflow-x-auto flex-nowrap pb-1 md:pb-0"
            >
              <ToggleGroupItem value="" aria-label="All" className="px-3 whitespace-nowrap text-sm">
                All
              </ToggleGroupItem>
              {EVENT_TYPES.map(type => (
                <ToggleGroupItem 
                  key={type} 
                  value={type} 
                  aria-label={type}
                  className="px-3 capitalize whitespace-nowrap text-sm"
                >
                  {type}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredEvents && filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEvents.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border rounded-lg border-dashed bg-muted/20">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <CalendarIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No events found</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            {eventTypeFilter 
              ? `No ${eventTypeFilter} events match your filters.` 
              : "You don't have any extracted events yet."}
          </p>
          {!eventTypeFilter && (
            <Button onClick={handleSync} disabled={syncClassroom.isPending}>
              Sync from Classroom
            </Button>
          )}
        </div>
      )}
    </Shell>
  );
}
