
import { create } from 'zustand';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Problem, SectionType, DifficultyFilter, StatusFilter } from '@/types';

interface ProblemStore {
  problems: Problem[];
  filteredProblems: Problem[];
  isLoading: boolean;
  error: string | null;
  
  // Filters
  activeSection: SectionType;
  searchQuery: string;
  topicFilter: string;
  difficultyFilter: DifficultyFilter;
  statusFilter: StatusFilter;
  
  // Actions
  fetchProblems: () => Promise<void>;
  addProblem: (problem: Omit<Problem, 'id'>) => Promise<void>;
  updateProblem: (id: string, updates: Partial<Problem>) => Promise<void>;
  deleteProblem: (id: string) => Promise<void>;
  bulkAddProblems: (problems: Omit<Problem, 'id'>[]) => Promise<void>;
  
  // Filter actions
  setActiveSection: (section: SectionType) => void;
  setSearchQuery: (query: string) => void;
  setTopicFilter: (topic: string) => void;
  setDifficultyFilter: (difficulty: DifficultyFilter) => void;
  setStatusFilter: (status: StatusFilter) => void;
  applyFilters: (userSolvedProblems: string[], userStarredProblems: string[]) => void;
  
  clearError: () => void;
}

export const useProblemStore = create<ProblemStore>((set, get) => ({
  problems: [],
  filteredProblems: [],
  isLoading: false,
  error: null,
  
  activeSection: '',
  searchQuery: '',
  topicFilter: 'All Topics',
  difficultyFilter: 'All Difficulty',
  statusFilter: 'all',

  fetchProblems: async () => {
    try {
      set({ isLoading: true, error: null });
      const querySnapshot = await getDocs(collection(db, 'problems'));
      const problems: Problem[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        problems.push({ 
          id: doc.id, 
          ...data,
          displayOrder: data.displayOrder ?? 999999 // Default high number for existing problems without order
        } as Problem);
      });
      
      // Sort by displayOrder first, then by topic and title for consistent ordering
      problems.sort((a, b) => {
        // Primary sort by displayOrder
        if (a.displayOrder !== b.displayOrder) {
          return a.displayOrder - b.displayOrder;
        }
        // Secondary sort by topic
        if (a.topic !== b.topic) {
          return a.topic.localeCompare(b.topic);
        }
        // Tertiary sort by title
        return a.title.localeCompare(b.title);
      });
      
      // Set default active section to first available section
      const state = get();
      if (!state.activeSection && problems.length > 0) {
        const firstSection = problems[0].sheetType.toLowerCase().replace(/\s+/g, '-');
        set({ problems, isLoading: false, activeSection: firstSection });
      } else {
        set({ problems, isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  addProblem: async (problemData) => {
    try {
      set({ error: null });
      const currentProblems = get().problems;
      
      // Find the highest order within the same topic for better organization
      const sameTopicProblems = currentProblems.filter(p => p.topic === problemData.topic);
      const maxOrderInTopic = sameTopicProblems.length > 0 
        ? Math.max(...sameTopicProblems.map(p => p.displayOrder || 0))
        : Math.max(...currentProblems.map(p => p.displayOrder || 0), 0);
      
      const problemWithOrder = { ...problemData, displayOrder: maxOrderInTopic + 1 };
      
      const docRef = await addDoc(collection(db, 'problems'), problemWithOrder);
      const newProblem = { id: docRef.id, ...problemWithOrder };
      
      // Re-sort the problems array after adding
      const updatedProblems = [...currentProblems, newProblem].sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) {
          return a.displayOrder - b.displayOrder;
        }
        if (a.topic !== b.topic) {
          return a.topic.localeCompare(b.topic);
        }
        return a.title.localeCompare(b.title);
      });
      
      set({ problems: updatedProblems });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateProblem: async (id, updates) => {
    try {
      set({ error: null });
      await updateDoc(doc(db, 'problems', id), updates);
      
      set({
        problems: get().problems.map(p => 
          p.id === id ? { ...p, ...updates } : p
        )
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteProblem: async (id) => {
    try {
      set({ error: null });
      await deleteDoc(doc(db, 'problems', id));
      
      set({
        problems: get().problems.filter(p => p.id !== id)
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  bulkAddProblems: async (problemsData) => {
    try {
      set({ error: null, isLoading: true });
      const batch = writeBatch(db);
      
      problemsData.forEach((problemData) => {
        const docRef = doc(collection(db, 'problems'));
        batch.set(docRef, problemData);
      });
      
      await batch.commit();
      await get().fetchProblems(); // Refresh the list
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  setActiveSection: (section) => {
    set({ activeSection: section });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setTopicFilter: (topic) => {
    set({ topicFilter: topic });
  },

  setDifficultyFilter: (difficulty) => {
    set({ difficultyFilter: difficulty });
  },

  setStatusFilter: (status) => {
    set({ statusFilter: status });
  },

  applyFilters: (userSolvedProblems, userStarredProblems) => {
    const { 
      problems, 
      activeSection, 
      searchQuery, 
      difficultyFilter, 
      statusFilter 
    } = get();

    let filtered = problems.filter(problem => {
      // Section filter - only apply if not admin or settings
      if (activeSection !== 'admin' && activeSection !== 'settings' && activeSection) {
        const sectionMap: Record<string, string> = {
          'dsa': 'DSA',
          'sql': 'SQL',
          'system-design': 'System Design',
          'web-dev': 'Web Development'
        };
        
        if (problem.sheetType !== sectionMap[activeSection]) {
          return false;
        }
      }

      // Search filter - improved search functionality
      if (searchQuery && searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase().trim();
        const titleMatch = problem.title.toLowerCase().includes(searchLower);
        const topicMatch = problem.topic.toLowerCase().includes(searchLower);
        const subTopicMatch = problem.subTopic?.toLowerCase().includes(searchLower) || false;
        const difficultyMatch = problem.difficulty.toLowerCase().includes(searchLower);
        const sheetTypeMatch = problem.sheetType.toLowerCase().includes(searchLower);
        
        if (!titleMatch && !topicMatch && !subTopicMatch && !difficultyMatch && !sheetTypeMatch) {
          return false;
        }
      }

      // Difficulty filter
      if (difficultyFilter !== 'all' && difficultyFilter !== 'All Difficulty' && problem.difficulty !== difficultyFilter) {
        return false;
      }

      // Status filter - fixed starred filter
      if (statusFilter !== 'all') {
        const isSolved = userSolvedProblems.includes(problem.id);
        const isStarred = userStarredProblems.includes(problem.id);
        
        switch (statusFilter) {
          case 'solved':
            if (!isSolved) return false;
            break;
          case 'starred':
            if (!isStarred) return false;
            break;
          case 'unsolved':
            if (isSolved) return false;
            break;
          default:
            break;
        }
      }

      return true;
    });

    set({ filteredProblems: filtered });
  },

  clearError: () => set({ error: null })
}));
