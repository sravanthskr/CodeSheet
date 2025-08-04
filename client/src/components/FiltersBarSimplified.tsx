
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useProblemStore } from '@/store/useProblemStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Search, Star } from 'lucide-react';

export function FiltersBarSimplified() {
  const { 
    problems,
    searchQuery, 
    statusFilter,
    setSearchQuery,
    setStatusFilter,
    applyFilters,
    activeSection
  } = useProblemStore();
  
  const { user } = useAuthStore();
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Apply filters whenever dependencies change
  useEffect(() => {
    if (user) {
      applyFilters(user.solvedProblems || [], user.starredProblems || []);
    }
  }, [
    searchQuery, 
    statusFilter, 
    problems, 
    activeSection,
    user?.solvedProblems,
    user?.starredProblems,
    applyFilters
  ]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchQuery, setSearchQuery]);

  const toggleStarredFilter = () => {
    setStatusFilter(statusFilter === 'starred' ? 'all' : 'starred');
  };

  // Get section stats
  const getSectionStats = () => {
    const sectionProblems = problems.filter(problem => {
      const sectionMap: Record<string, string> = {
        'dsa': 'DSA',
        'sql': 'SQL',
        'system-design': 'System Design',
        'web-dev': 'Web Development'
      };
      return activeSection === 'admin' || problem.sheetType === sectionMap[activeSection];
    });

    const easySolved = sectionProblems.filter(p => p.difficulty === 'Easy' && user?.solvedProblems?.includes(p.id)).length;
    const easyTotal = sectionProblems.filter(p => p.difficulty === 'Easy').length;
    
    const mediumSolved = sectionProblems.filter(p => p.difficulty === 'Medium' && user?.solvedProblems?.includes(p.id)).length;
    const mediumTotal = sectionProblems.filter(p => p.difficulty === 'Medium').length;
    
    const hardSolved = sectionProblems.filter(p => p.difficulty === 'Hard' && user?.solvedProblems?.includes(p.id)).length;
    const hardTotal = sectionProblems.filter(p => p.difficulty === 'Hard').length;

    return { easy: `${easySolved}/${easyTotal}`, medium: `${mediumSolved}/${mediumTotal}`, hard: `${hardSolved}/${hardTotal}` };
  };

  const stats = getSectionStats();

  return (
    <div className="mb-6 space-y-4">
      {/* Progress Stats */}
      {activeSection !== 'admin' && activeSection !== 'settings' && (
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-medium">Easy:</span>
            <span className="text-gray-600 dark:text-gray-400">{stats.easy}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-600 font-medium">Medium:</span>
            <span className="text-gray-600 dark:text-gray-400">{stats.medium}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-medium">Hard:</span>
            <span className="text-gray-600 dark:text-gray-400">{stats.hard}</span>
          </div>
        </div>
      )}

      {/* Search and Stack Filter */}
      <div className="flex gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search problems..."
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-problems"
            />
          </div>
        </div>
        
        <Button
          variant={statusFilter === 'starred' ? 'default' : 'outline'}
          onClick={toggleStarredFilter}
          className={`flex items-center gap-2 ${
            statusFilter === 'starred' 
              ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500' 
              : 'hover:bg-yellow-50 hover:border-yellow-300'
          }`}
          data-testid="button-stack-filter"
        >
          <Star className={`h-4 w-4 ${statusFilter === 'starred' ? 'fill-current text-white' : 'text-gray-500'}`} />
          Stack
        </Button>
      </div>
    </div>
  );
}
