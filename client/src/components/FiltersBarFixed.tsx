import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProblemStore } from '@/store/useProblemStore';
import { useAuthStore } from '@/store/useAuthStore';
import { DifficultyFilter, StatusFilter } from '@/types';
import { Search } from 'lucide-react';

export function FiltersBar() {
  const { 
    problems,
    searchQuery, 
    difficultyFilter, 
    statusFilter,
    setSearchQuery,
    setDifficultyFilter,
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
    difficultyFilter, 
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

  const handleDifficultyChange = (value: string) => {
    if (value === 'all') {
      setDifficultyFilter('all');
    } else {
      setDifficultyFilter(value as DifficultyFilter);
    }
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as StatusFilter);
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row gap-3">
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
        
        <div className="flex gap-3">
          <Select value={difficultyFilter} onValueChange={handleDifficultyChange}>
            <SelectTrigger className="w-32" data-testid="select-difficulty-filter">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="Easy">Easy</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Hard">Hard</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-32" data-testid="select-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="solved">Solved</SelectItem>
              <SelectItem value="unsolved">Unsolved</SelectItem>
              <SelectItem value="starred">Starred</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}