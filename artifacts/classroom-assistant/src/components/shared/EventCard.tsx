import React from "react";
import { format } from "date-fns";
import { Calendar, Trash2, CheckCircle2, Clock } from "lucide-react";
import { AcademicEvent } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EventTypeBadge } from "./EventTypeBadge";
import { useSyncEventToCalendar, useDeleteEvent, getListEventsQueryKey, getGetUpcomingEventsQueryKey, getGetEventsSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function EventCard({ event }: { event: AcademicEvent }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const syncToCalendar = useSyncEventToCalendar();
  const deleteEvent = useDeleteEvent();

  const handleSync = () => {
    syncToCalendar.mutate({ id: event.id }, {
      onSuccess: () => {
        toast({
          title: "Synced to Calendar",
          description: `Successfully added ${event.eventType} for ${event.courseName} to your calendar.`,
        });
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetUpcomingEventsQueryKey() });
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Sync Failed",
          description: "Could not sync event to Google Calendar.",
        });
      }
    });
  };

  const handleDelete = () => {
    deleteEvent.mutate({ id: event.id }, {
      onSuccess: () => {
        toast({
          title: "Event deleted",
          description: "The event was successfully removed.",
        });
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetUpcomingEventsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetEventsSummaryQueryKey() });
      }
    });
  };

  const parsedDate = event.eventDate ? new Date(event.eventDate) : null;
  const isPast = parsedDate ? parsedDate < new Date() : false;

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0 gap-4">
        <div>
          <h3 className="font-semibold text-lg line-clamp-1" title={event.courseName}>
            {event.courseName}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <EventTypeBadge type={event.eventType} />
            {parsedDate && (
              <span className={`text-sm flex items-center gap-1 font-medium ${isPast ? 'text-muted-foreground' : 'text-foreground'}`}>
                <Clock size={14} className={isPast ? 'opacity-50' : 'text-primary'} />
                {format(parsedDate, "MMM d, yyyy h:mm a")}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4 flex-1">
        <div className="bg-muted/50 p-3 rounded-md border text-sm text-muted-foreground line-clamp-4 h-full relative group">
          {event.rawText}
          <div className="absolute inset-0 bg-gradient-to-t from-muted/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex items-center justify-between border-t p-4 mt-auto bg-muted/20">
        <div className="flex items-center gap-2">
          {event.calendarEventId ? (
            <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium px-2 py-1 rounded-md bg-green-50 border border-green-100">
              <CheckCircle2 size={16} />
              <span>Synced</span>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncToCalendar.isPending}
              className="gap-2"
            >
              <Calendar size={14} />
              {syncToCalendar.isPending ? "Syncing..." : "Add to Calendar"}
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={deleteEvent.isPending}
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 size={16} />
        </Button>
      </CardFooter>
    </Card>
  );
}
