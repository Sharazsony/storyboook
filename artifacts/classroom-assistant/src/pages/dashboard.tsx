import React from "react";
import { Link } from "wouter";
import { 
  useListEvents,
  useGetEventsSummary, 
  useListCourses,
  useSyncClassroom,
  getGetEventsSummaryQueryKey,
  getListEventsQueryKey,
  getListCoursesQueryKey
} from "@workspace/api-client-react";
import { Shell } from "@/components/layout/Shell";
import { EventCard } from "@/components/shared/EventCard";
import { EventTypeBadge } from "@/components/shared/EventTypeBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, RefreshCw, AlertCircle, Book, ArrowRight, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allEvents, isLoading: loadingEvents } = useListEvents({}, {
    query: { queryKey: getListEventsQueryKey() }
  });
  const recentEvents = allEvents?.slice(0, 6) ?? [];
  
  const { data: summary, isLoading: loadingSummary } = useGetEventsSummary({
    query: { queryKey: getGetEventsSummaryQueryKey() }
  });
  
  const { data: courses, isLoading: loadingCourses } = useListCourses({
    query: { queryKey: getListCoursesQueryKey() }
  });
  
  const syncClassroom = useSyncClassroom();

  const handleSync = () => {
    syncClassroom.mutate(undefined, {
      onSuccess: (result) => {
        toast({
          title: "Sync Complete",
          description: `Processed ${result.coursesProcessed} courses, found ${result.announcementsFound} announcements, extracted ${result.eventsExtracted} events.`,
        });
        queryClient.invalidateQueries({ queryKey: getGetEventsSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Sync Failed",
          description: "Failed to sync with Google Classroom.",
        });
      }
    });
  };

  const isLoading = loadingEvents || loadingSummary || loadingCourses;

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">
            Your academic command center. Automatically extracted from Classroom.
          </p>
        </div>
        <Button onClick={handleSync} disabled={syncClassroom.isPending} className="gap-2">
          <RefreshCw size={16} className={syncClassroom.isPending ? "animate-spin" : ""} />
          {syncClassroom.isPending ? "Syncing..." : "Sync Classroom"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card className="bg-primary/5 border-primary/10 shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="font-medium text-primary">Total Events</CardDescription>
            <CardTitle className="text-4xl text-primary">{summary?.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="col-span-1 md:col-span-2 shadow-none border-border">
          <CardHeader className="pb-2">
            <CardDescription className="font-medium">Event Breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {summary?.byType && summary.byType.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {summary.byType.map((typeCount) => (
                  <div key={typeCount.eventType} className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md border">
                    <EventTypeBadge type={typeCount.eventType} />
                    <span className="font-semibold text-lg">{typeCount.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground text-sm">No events found.</span>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <AlertCircle size={20} className="text-orange-500" />
              Recent Events
            </h2>
            <Link href="/events" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {recentEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed bg-muted/30">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">No upcoming events</h3>
                <p className="text-muted-foreground text-sm max-w-sm mb-6">
                  You're all caught up! If you think something is missing, try syncing with Google Classroom.
                </p>
                <Button variant="outline" onClick={handleSync} disabled={syncClassroom.isPending}>
                  Sync Classroom
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Book size={20} className="text-blue-500" />
            Your Courses
          </h2>
          
          <Card className="shadow-none">
            <div className="divide-y">
              {courses && courses.length > 0 ? (
                courses.map((course) => (
                  <div key={course.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <h4 className="font-medium text-sm line-clamp-1" title={course.name}>{course.name}</h4>
                    {(course.section || course.room) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {[course.section, course.room].filter(Boolean).join(" • ")}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No courses found.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
