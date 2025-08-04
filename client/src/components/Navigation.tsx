import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProblemStore } from '@/store/useProblemStore';
import { useAuthStore } from '@/store/useAuthStore';
import { SectionType } from '@/types';
import { useEffect } from 'react';

export function Navigation() {
  const { user } = useAuthStore();
  const { activeSection, setActiveSection, applyFilters, problems } = useProblemStore();

  // Update filtered problems when section changes
  useEffect(() => {
    if (user && problems.length > 0) {
      applyFilters(user.solvedProblems || [], user.starredProblems || []);
    }
  }, [activeSection, user?.solvedProblems, user?.starredProblems, problems, applyFilters]);

  // Get dynamic sections from problems that exist
  const getDynamicSections = () => {
    const sectionsFromProblems = Array.from(new Set(problems.map(p => p.sheetType))).filter(Boolean);
    return sectionsFromProblems.map(section => ({
      id: section.toLowerCase().replace(/\s+/g, '-'),
      label: section,
      count: getSectionProgress(section.toLowerCase().replace(/\s+/g, '-'))
    }));
  };

  const getSectionProgress = (sectionId: string) => {
    const sectionProblems = problems.filter(p => 
      p.sheetType.toLowerCase().replace(/\s+/g, '-') === sectionId
    );
    const solvedCount = sectionProblems.filter(p => 
      user?.solvedProblems?.includes(p.id)
    ).length;
    return `${solvedCount}/${sectionProblems.length}`;
  };

  const dynamicSections = getDynamicSections();

  const handleSectionChange = (section: SectionType) => {
    setActiveSection(section);
  };

  return (
    <nav className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 overflow-x-auto">
          {dynamicSections.map((section) => (
            <Button
              key={section.id}
              variant="ghost"
              data-testid={`nav-${section.id}`}
              className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors rounded-none ${
                activeSection === section.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleSectionChange(section.id)}
            >
              <div className="flex flex-col items-center">
                <span>{section.label}</span>
                <span className="text-xs opacity-75">({section.count})</span>
              </div>
            </Button>
          ))}

          {user?.role === 'admin' && (
            <Button
              variant="ghost"
              data-testid="nav-admin"
              className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors rounded-none ${
                activeSection === 'admin'
                  ? 'border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleSectionChange('admin')}
            >
              <Settings className="h-4 w-4 mr-1" />
              Admin
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}