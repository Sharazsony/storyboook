import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), retry: false }
  });

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-3xl" />
      
      <div className="z-10 w-full max-w-md p-8 md:p-12 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 text-center">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground mx-auto mb-6 shadow-lg shadow-primary/20">
          <BookOpen size={32} />
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-2">
          ClassMind
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-10 text-lg leading-relaxed">
          Your calm, intelligent academic command center. Let AI organize your coursework.
        </p>

        <Button 
          asChild 
          className="w-full h-12 text-base font-medium shadow-md transition-transform active:scale-[0.98]"
        >
          <a href="/api/auth/google">
            Sign in with Google
          </a>
        </Button>

        <p className="mt-8 text-sm text-gray-400 dark:text-gray-500">
          Securely connects to your Google Classroom and Calendar.
        </p>
      </div>
    </div>
  );
}
