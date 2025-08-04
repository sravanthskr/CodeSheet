
import { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useAuthStore } from '@/store/useAuthStore';
import { useProblemStore } from '@/store/useProblemStore';
import { Problem } from '@/types';
import { NotesModal } from './NotesModal';
import { useToast } from '@/hooks/use-toast';

interface TopicGroup {
  topic: string;
  problems: Problem[];
  isExpanded: boolean;
}

interface HierarchicalProblemTableProps {
  problems: Problem[];
}

export function HierarchicalProblemTable({ problems }: HierarchicalProblemTableProps) {
  const [topicGroups, setTopicGroups] = useState<Record<string, boolean>>({});
  const [notesModal, setNotesModal] = useState<{
    isOpen: boolean;
    problemId: string;
    problemTitle: string;
    initialNote: string;
  }>({
    isOpen: false,
    problemId: '',
    problemTitle: '',
    initialNote: ''
  });

  const { user, updateUserProgress } = useAuthStore();
  const { activeSection } = useProblemStore();
  const { toast } = useToast();

  // Group problems by topic
  const groupedProblems = problems.reduce((groups: Record<string, Problem[]>, problem) => {
    const topic = problem.topic || 'Other';
    if (!groups[topic]) {
      groups[topic] = [];
    }
    groups[topic].push(problem);
    return groups;
  }, {});

  const toggleTopic = useCallback((topic: string) => {
    setTopicGroups(prev => ({
      ...prev,
      [topic]: !prev[topic]
    }));
  }, []);

  const handleToggleSolved = useCallback(async (problemId: string, currentStatus: boolean) => {
    if (!user) return;
    
    try {
      const action = currentStatus ? 'unsolved' : 'solve';
      await updateUserProgress(problemId, action);
    } catch (error) {
      toast({
        title: "Failed to update progress",
        description: "Please try again",
        variant: "destructive"
      });
    }
  }, [user, updateUserProgress, toast]);

  const handleToggleStar = useCallback(async (problemId: string, currentStatus: boolean) => {
    if (!user) return;
    
    try {
      const action = currentStatus ? 'unstar' : 'star';
      await updateUserProgress(problemId, action);
    } catch (error) {
      toast({
        title: "Failed to update preferences",
        description: "Please try again",
        variant: "destructive"
      });
    }
  }, [user, updateUserProgress, toast]);

  const openNotesModal = (problemId: string, problemTitle: string) => {
    const note = user?.notes?.[problemId] || '';
    setNotesModal({
      isOpen: true,
      problemId,
      problemTitle,
      initialNote: note
    });
  };

  const getTopicProgress = (topicProblems: Problem[]) => {
    const solvedCount = topicProblems.filter(p => 
      user?.solvedProblems?.includes(p.id)
    ).length;
    return { solved: solvedCount, total: topicProblems.length };
  };

  const getSectionTitle = () => {
    if (activeSection === 'admin') return 'Admin Dashboard';
    const sectionName = problems[0]?.sheetType || 'Problems';
    return sectionName;
  };

  if (problems.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          No problems found in this section.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {getSectionTitle()}
            </h2>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {Object.entries(groupedProblems).map(([topic, topicProblems]) => {
              const isExpanded = topicGroups[topic] !== false; // Default to expanded
              const progress = getTopicProgress(topicProblems);

              return (
                <div key={topic} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  <div 
                    className="bg-gray-50 dark:bg-gray-700 p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors select-none"
                    onClick={() => toggleTopic(topic)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-500 transition-transform" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500 transition-transform" />
                        )}
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {topic}
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({progress.solved}/{progress.total} completed)
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-200"
                            style={{ width: `${progress.total > 0 ? (progress.solved / progress.total) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-10">
                          {progress.total > 0 ? Math.round((progress.solved / progress.total) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-200 dark:border-gray-600">
                          <TableHead className="w-8 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Status</TableHead>
                          <TableHead className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Problem</TableHead>
                          <TableHead className="w-20 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Difficulty</TableHead>
                          <TableHead className="w-12 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Notes</TableHead>
                          <TableHead className="w-12 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Star</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topicProblems.map((problem, index) => {
                          const isSolved = user?.solvedProblems?.includes(problem.id) || false;
                          const isStarred = user?.starredProblems?.includes(problem.id) || false;
                          const hasNote = (user?.notes?.[problem.id]?.trim()?.length || 0) > 0;

                          return (
                            <TableRow 
                              key={problem.id} 
                              className="border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <TableCell className="px-4 py-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleSolved(problem.id, isSolved)}
                                  className="p-1 h-auto"
                                  data-testid={`button-solve-${problem.id}`}
                                >
                                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-150 ${
                                    isSolved 
                                      ? 'bg-green-500 border-green-500' 
                                      : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
                                  }`}>
                                    {isSolved && (
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                </Button>
                              </TableCell>

                              <TableCell className="px-4 py-3">
                                <a
                                  href={problem.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`font-medium hover:underline transition-colors ${
                                    isSolved ? 'text-green-700 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                                  }`}
                                >
                                  {problem.title}
                                </a>
                              </TableCell>

                              <TableCell className="px-4 py-3">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                  problem.difficulty === 'Easy' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : problem.difficulty === 'Medium'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}>
                                  {problem.difficulty}
                                </span>
                              </TableCell>

                              <TableCell className="px-4 py-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openNotesModal(problem.id, problem.title)}
                                  className="p-1 h-auto"
                                  data-testid={`button-notes-${problem.id}`}
                                >
                                  <StickyNote 
                                    className={`h-4 w-4 transition-colors ${
                                      hasNote 
                                        ? 'text-blue-500' 
                                        : 'text-gray-300 dark:text-gray-600'
                                    }`} 
                                  />
                                </Button>
                              </TableCell>

                              <TableCell className="px-4 py-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleStar(problem.id, isStarred)}
                                  className="p-1 h-auto"
                                  data-testid={`button-star-${problem.id}`}
                                >
                                  <div className={`w-4 h-4 transition-all duration-150 ${
                                    isStarred 
                                      ? 'text-yellow-500' 
                                      : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'
                                  }`}>
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                    </svg>
                                  </div>
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <NotesModal
        isOpen={notesModal.isOpen}
        onClose={() => setNotesModal(prev => ({ ...prev, isOpen: false }))}
        problemId={notesModal.problemId}
        problemTitle={notesModal.problemTitle}
        initialNote={notesModal.initialNote}
      />
    </>
  );
}
