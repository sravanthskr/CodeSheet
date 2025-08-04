
import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useProblemStore } from '@/store/useProblemStore';
import { Header } from '@/components/Header';
import { Navigation } from '@/components/Navigation';
import { FiltersBarSimplified } from '@/components/FiltersBarSimplified';
import { HierarchicalProblemTable } from '@/components/HierarchicalProblemTable';
import { AdminPanel } from '@/components/AdminPanel';
import { ProfileSettings } from '@/components/ProfileSettings';

export function Dashboard() {
  const { user, isLoading: authLoading } = useAuthStore();
  const { 
    fetchProblems, 
    activeSection, 
    isLoading: problemsLoading, 
    problems, 
    filteredProblems, 
    applyFilters 
  } = useProblemStore();

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  // Apply filters whenever user data changes
  useEffect(() => {
    if (user) {
      applyFilters(user.solvedProblems || [], user.starredProblems || []);
    }
  }, [user, applyFilters]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeSection === 'admin' ? (
          user?.role === 'admin' ? (
            <AdminPanel />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                Access denied. Admin privileges required.
              </p>
            </div>
          )
        ) : activeSection === 'settings' ? (
          <ProfileSettings />
        ) : (
          <>
            <FiltersBarSimplified />
            {problemsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading problems...</p>
              </div>
            ) : (
              <HierarchicalProblemTable problems={filteredProblems || []} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
