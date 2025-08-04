import { useState, useEffect } from 'react';
import { Check, Circle, Star, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuthStore } from '@/store/useAuthStore';
import { useProblemStore } from '@/store/useProblemStore';
import { useToast } from '@/hooks/use-toast';
import { Problem } from '@/types';

export function ProblemTable() {
  const { user, updateUserProgress, updateUserNote } = useAuthStore();
  const { filteredProblems, activeSection } = useProblemStore();
  const { toast } = useToast();
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});

  // Initialize local notes from user data
  useEffect(() => {
    if (user?.notes) {
      setLocalNotes(user.notes);
    }
  }, [user?.notes]);

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">Please sign in to view problems.</p>
      </div>
    );
  }

  const handleToggleSolved = async (problemId: string) => {
    const isSolved = user.solvedProblems.includes(problemId);
    
    // Optimistic update for immediate UI response
    const updatedSolvedProblems = isSolved 
      ? user.solvedProblems.filter(id => id !== problemId)
      : [...user.solvedProblems, problemId];
    
    // Update local state immediately
    const { updateUser } = useAuthStore.getState();
    updateUser({ solvedProblems: updatedSolvedProblems });
    
    try {
      await updateUserProgress(problemId, isSolved ? 'unsolved' : 'solve');
    } catch (error) {
      // Revert on error
      updateUser({ solvedProblems: user.solvedProblems });
      toast({
        title: "Failed to update progress",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleToggleStar = async (problemId: string) => {
    const isStarred = user.starredProblems.includes(problemId);
    
    // Optimistic update for immediate UI response
    const updatedStarredProblems = isStarred 
      ? user.starredProblems.filter(id => id !== problemId)
      : [...user.starredProblems, problemId];
    
    // Update local state immediately
    const { updateUser } = useAuthStore.getState();
    updateUser({ starredProblems: updatedStarredProblems });
    
    try {
      await updateUserProgress(problemId, isStarred ? 'unstar' : 'star');
    } catch (error) {
      // Revert on error
      updateUser({ starredProblems: user.starredProblems });
      toast({
        title: "Failed to update preferences",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleNoteChange = (problemId: string, note: string) => {
    setLocalNotes(prev => ({ ...prev, [problemId]: note }));
  };

  const handleNoteBlur = async (problemId: string) => {
    const note = localNotes[problemId] || '';
    try {
      await updateUserNote(problemId, note);
    } catch (error) {
      toast({
        title: "Failed to save note",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'Medium':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'Hard':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
    }
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'dsa':
        return 'Data Structures & Algorithms';
      case 'sql':
        return 'SQL Practice';
      case 'system-design':
        return 'System Design';
      case 'web-dev':
        return 'Web Development';
      case 'admin':
        return 'All Problems';
      default:
        return 'Problems';
    }
  };

  const getSolvedCount = () => {
    return filteredProblems.filter(p => user?.solvedProblems?.includes(p.id)).length;
  };

  if (filteredProblems.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">No problems found matching your filters.</p>
      </div>
    );
  }

  return (
    <section>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{getSectionTitle()}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            <span data-testid="text-progress">{getSolvedCount()}</span> of {filteredProblems.length} problems solved
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <TableHead className="w-12 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Status</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Problem</TableHead>
                <TableHead className="w-32 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Topic</TableHead>
                <TableHead className="w-20 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Difficulty</TableHead>
                <TableHead className="w-64 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Notes</TableHead>
                <TableHead className="w-12 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Star</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProblems.map((problem, index) => {
                const isSolved = user?.solvedProblems?.includes(problem.id) || false;
                const isStarred = user?.starredProblems?.includes(problem.id) || false;
                const note = localNotes[problem.id] || '';

                return (
                  <TableRow 
                    key={problem.id} 
                    className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      isSolved ? 'bg-green-50 dark:bg-green-900/10' : ''
                    }`}
                    data-testid={`row-problem-${problem.id}`}
                  >
                    <TableCell className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`button-toggle-solved-${problem.id}`}
                        onClick={() => handleToggleSolved(problem.id)}
                        className="p-1 h-6 w-6 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        {isSolved ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        )}
                      </Button>
                    </TableCell>
                    
                    <TableCell className="px-4 py-3">
                      <a
                        href={problem.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid={`link-problem-${problem.id}`}
                        className={`font-medium hover:underline transition-colors block ${
                          isSolved 
                            ? 'text-green-700 dark:text-green-400' 
                            : 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
                        }`}
                      >
                        {problem.title}
                      </a>
                    </TableCell>
                    
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {problem.topic}
                    </TableCell>
                    
                    <TableCell className="px-4 py-3">
                      <span 
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}
                        data-testid={`badge-difficulty-${problem.id}`}
                      >
                        {problem.difficulty}
                      </span>
                    </TableCell>
                    
                    <TableCell className="px-4 py-3">
                      <Input
                        type="text"
                        placeholder="Add notes..."
                        data-testid={`input-note-${problem.id}`}
                        value={note}
                        onChange={(e) => handleNoteChange(problem.id, e.target.value)}
                        onBlur={() => handleNoteBlur(problem.id)}
                        className="w-full text-xs border-0 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 focus:border focus:border-blue-300 dark:focus:border-blue-600 rounded px-2 py-1 transition-colors"
                      />
                    </TableCell>
                    
                    <TableCell className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`button-toggle-star-${problem.id}`}
                        onClick={() => handleToggleStar(problem.id)}
                        className="p-1 h-6 w-6 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <Star 
                          className={`h-4 w-4 transition-colors ${
                            isStarred 
                              ? 'text-yellow-500 fill-current' 
                              : 'text-gray-400 hover:text-yellow-500'
                          }`} 
                        />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}
