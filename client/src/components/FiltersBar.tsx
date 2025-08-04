import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProblemStore } from '@/store/useProblemStore';
import { useAuthStore } from '@/store/useAuthStore';
import { DifficultyFilter, StatusFilter } from '@/types';

export function FiltersBar() {
  const { 
    problems,
    searchQuery, 
    topicFilter, 
    difficultyFilter, 
    statusFilter,
    setSearchQuery,
    setTopicFilter,
    setDifficultyFilter,
    setStatusFilter,
    applyFilters,
    activeSection
  } = useProblemStore();
  
  const { user } = useAuthStore();

  // Get unique topics based on current section
  const availableTopics = Array.from(
    new Set(
      problems
        .filter(p => {
          if (activeSection === 'admin') return true;
          const sectionMap = {
            'dsa': 'DSA',
            'sql': 'SQL',
            'system-design': 'System Design',
            'web-dev': 'Web Development'
          };
          return p.sheetType === sectionMap[activeSection as keyof typeof sectionMap];
        })
        .map(p => p.topic)
    )
  ).sort();

  // Apply filters whenever dependencies change
  useEffect(() => {
    if (user) {
      applyFilters(user.solvedProblems || [], user.starredProblems || []);
    }
  }, [
    searchQuery, 
    topicFilter, 
    difficultyFilter, 
    statusFilter, 
    problems, 
    activeSection,
    user?.solvedProblems,
    user?.starredProblems,
    applyFilters
  ]);

  const handleDifficultyChange = (value: string) => {
    setDifficultyFilter(value as DifficultyFilter);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as StatusFilter);
  };

  const handleTopicChange = (value: string) => {
    setTopicFilter(value);
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            type="text"
            data-testid="input-search"
            placeholder="Search problems..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
          />
        </div>
        
        <Select value={topicFilter} onValueChange={handleTopicChange}>
          <SelectTrigger data-testid="select-topic" className="w-full sm:w-36 h-9 border-gray-300 dark:border-gray-600">
            <SelectValue placeholder="All Topics" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Topics">All Topics</SelectItem>
            {availableTopics.map(topic => (
              <SelectItem key={topic} value={topic}>{topic}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={difficultyFilter} onValueChange={handleDifficultyChange}>
          <SelectTrigger data-testid="select-difficulty" className="w-full sm:w-36 h-9 border-gray-300 dark:border-gray-600">
            <SelectValue placeholder="All Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Difficulty">All Difficulty</SelectItem>
            <SelectItem value="Easy">Easy</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Hard">Hard</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger data-testid="select-status" className="w-full sm:w-32 h-9 border-gray-300 dark:border-gray-600">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Status">All Status</SelectItem>
            <SelectItem value="Solved">Solved</SelectItem>
            <SelectItem value="Starred">Starred</SelectItem>
            <SelectItem value="Unsolved">Unsolved</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
