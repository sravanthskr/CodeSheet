import { useState } from 'react';
import { Plus, Upload, FileText, Trash2, Edit, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useProblemStore } from '@/store/useProblemStore';
import { useToast } from '@/hooks/use-toast';
import { parseCSV, parseJSON, ParseResult } from '@/utils/csvParser';
import { Problem } from '@/types';
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

export function AdminPanel() {
  const { 
    problems, 
    addProblem, 
    updateProblem, 
    deleteProblem, 
    bulkAddProblems, 
    isLoading, 
    error,
    fetchProblems 
  } = useProblemStore();

  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    link: '',
    topic: '',
    subTopic: '',
    difficulty: 'Easy' as 'Easy' | 'Medium' | 'Hard',
    sheetType: ''
  });

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ParseResult | null>(null);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [customSection, setCustomSection] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProblems, setSelectedProblems] = useState<Set<string>>(new Set());
  const [draggedProblem, setDraggedProblem] = useState<string | null>(null);
  const [reorderMode, setReorderMode] = useState(false);

  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    type: 'single' | 'bulk';
    problemId?: string;
    problemTitle?: string;
    count?: number;
  }>({
    isOpen: false,
    type: 'single'
  });

  const getExistingSections = () => {
    const sections = Array.from(new Set(problems.map(p => p.sheetType))).filter(Boolean);
    return sections.length > 0 ? sections : ['DSA', 'SQL', 'System Design', 'Web Development'];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalSheetType = formData.sheetType === 'custom' ? customSection : formData.sheetType;

    if (!formData.title || !formData.link || !formData.topic || !finalSheetType) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingProblem) {
        await updateProblem(editingProblem.id, { ...formData, sheetType: finalSheetType });
        toast({
          title: "Problem updated",
          description: "The problem has been successfully updated"
        });
        setEditingProblem(null);
      } else {
        await addProblem({ ...formData, sheetType: finalSheetType });
        toast({
          title: "Problem added",
          description: "The problem has been successfully added"
        });
      }

      // Reset form
      setFormData({
        title: '',
        link: '',
        topic: '',
        subTopic: '',
        difficulty: 'Easy',
        sheetType: ''
      });
      setCustomSection('');
    } catch (err) {
      toast({
        title: "Failed to save problem",
        description: error || "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);

    try {
      let result: ParseResult;

      if (file.name.endsWith('.csv')) {
        result = await parseCSV(file);
      } else if (file.name.endsWith('.json')) {
        result = await parseJSON(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV or JSON file",
          variant: "destructive"
        });
        return;
      }

      setPreviewData(result);

      if (result.errors.length > 0) {
        toast({
          title: "File has errors",
          description: `${result.errors.length} errors found. Please review before uploading.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "File parsed successfully",
          description: `${result.data.length} problems ready for upload`
        });
      }
    } catch (err) {
      toast({
        title: "Failed to parse file",
        description: "Please check your file format",
        variant: "destructive"
      });
    }
  };

  const handleBulkUpload = async () => {
    if (!previewData || previewData.data.length === 0) {
      toast({
        title: "No data to upload",
        description: "Please preview a file first",
        variant: "destructive"
      });
      return;
    }

    if (previewData.errors.length > 0) {
      toast({
        title: "Cannot upload with errors",
        description: "Please fix all errors before uploading",
        variant: "destructive"
      });
      return;
    }

    try {
      await bulkAddProblems(previewData.data);
      toast({
        title: "Bulk upload successful",
        description: `${previewData.data.length} problems added successfully`
      });

      setUploadFile(null);
      setPreviewData(null);
    } catch (err) {
      toast({
        title: "Bulk upload failed",
        description: error || "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (problem: Problem) => {
    setEditingProblem(problem);
    setFormData({
      title: problem.title,
      link: problem.link,
      topic: problem.topic,
      subTopic: problem.subTopic,
      difficulty: problem.difficulty,
      sheetType: problem.sheetType
    });
  };

  const confirmDelete = (problemId: string) => {
    const problem = problems.find(p => p.id === problemId);
    setDeleteDialog({
      isOpen: true,
      type: 'single',
      problemId,
      problemTitle: problem?.title
    });
  };

  const confirmBulkDelete = () => {
    if (selectedProblems.size === 0) return;

    setDeleteDialog({
      isOpen: true,
      type: 'bulk',
      count: selectedProblems.size
    });
  };

  const handleDelete = async () => {
    try {
      if (deleteDialog.type === 'single' && deleteDialog.problemId) {
        await deleteProblem(deleteDialog.problemId);
        toast({
          title: "Problem deleted",
          description: "The problem has been successfully deleted"
        });
      } else if (deleteDialog.type === 'bulk') {
        await Promise.all(Array.from(selectedProblems).map(id => deleteProblem(id)));
        setSelectedProblems(new Set());
        toast({
          title: "Problems deleted",
          description: `${selectedProblems.size} problems have been successfully deleted`
        });
      }
    } catch (err) {
      toast({
        title: "Failed to delete problem(s)",
        description: error || "Please try again",
        variant: "destructive"
      });
    } finally {
      setDeleteDialog({ isOpen: false, type: 'single' });
    }
  };

  const toggleSelectProblem = (problemId: string) => {
    const newSelected = new Set(selectedProblems);
    if (newSelected.has(problemId)) {
      newSelected.delete(problemId);
    } else {
      newSelected.add(problemId);
    }
    setSelectedProblems(newSelected);
  };

  const selectAllProblems = () => {
    if (selectedProblems.size === problems.length) {
      setSelectedProblems(new Set());
    } else {
      setSelectedProblems(new Set(problems.map(p => p.id)));
    }
  };

  const sortByTopic = async () => {
    try {
      const sortedProblems = [...problems].sort((a, b) => {
        if (a.topic !== b.topic) {
          return a.topic.localeCompare(b.topic);
        }
        return a.title.localeCompare(b.title);
      });

      // Update display orders
      const updates = sortedProblems.map((problem, index) => ({
        id: problem.id,
        displayOrder: index + 1
      }));

      for (const update of updates) {
        await updateProblem(update.id, { displayOrder: update.displayOrder });
      }

      await fetchProblems();
      toast({
        title: "Problems sorted by topic",
        description: "All problems have been reorganized by topic",
      });
    } catch (error) {
      toast({
        title: "Failed to sort problems",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const sortByDifficulty = async () => {
    try {
      const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
      const sortedProblems = [...problems].sort((a, b) => {
        const diffA = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 4;
        const diffB = difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 4;

        if (diffA !== diffB) {
          return diffA - diffB;
        }
        if (a.topic !== b.topic) {
          return a.topic.localeCompare(b.topic);
        }
        return a.title.localeCompare(b.title);
      });

      // Update display orders
      const updates = sortedProblems.map((problem, index) => ({
        id: problem.id,
        displayOrder: index + 1
      }));

      for (const update of updates) {
        await updateProblem(update.id, { displayOrder: update.displayOrder });
      }

      await fetchProblems();
      toast({
        title: "Problems sorted by difficulty",
        description: "All problems have been reorganized by difficulty (Easy → Medium → Hard)",
      });
    } catch (error) {
      toast({
        title: "Failed to sort problems",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const cancelEdit = () => {
    setEditingProblem(null);
    setFormData({
      title: '',
      link: '',
      topic: '',
      subTopic: '',
      difficulty: 'Easy',
      sheetType: ''
    });
  };

  const handleDragStart = (e: React.DragEvent, problemId: string) => {
    setDraggedProblem(problemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetProblemId: string) => {
    e.preventDefault();

    if (!draggedProblem || draggedProblem === targetProblemId) {
      setDraggedProblem(null);
      return;
    }

    try {
      const draggedIndex = problems.findIndex(p => p.id === draggedProblem);
      const targetIndex = problems.findIndex(p => p.id === targetProblemId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      // Create new order based on drag and drop
      const reorderedProblems = [...problems];
      const [draggedItem] = reorderedProblems.splice(draggedIndex, 1);
      reorderedProblems.splice(targetIndex, 0, draggedItem);

      // Update display orders
      const updates = reorderedProblems.map((problem, index) => ({
        id: problem.id,
        displayOrder: index + 1
      }));

      // Update each problem's display order in Firebase
      for (const update of updates) {
        await updateProblem(update.id, { displayOrder: update.displayOrder });
      }

      toast({
        title: "Problems reordered successfully",
        description: "The problem order has been updated",
      });

      // Refresh the problems list to reflect new order
      await fetchProblems();
    } catch (error) {
      toast({
        title: "Failed to reorder problems",
        description: "Please try again",
        variant: "destructive"
      });
    }

    setDraggedProblem(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Admin Panel</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage problems and bulk uploads</p>
      </div>

      {/* Add/Edit Problem Form */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {editingProblem ? 'Edit Problem' : 'Add New Problem'}
          </h3>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  data-testid="input-problem-title"
                  placeholder="Problem title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="link">Link</Label>
                <Input
                  id="link"
                  type="url"
                  data-testid="input-problem-link"
                  placeholder="https://..."
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  data-testid="input-problem-topic"
                  placeholder="e.g., Arrays"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="subTopic">Subtopic (Optional)</Label>
                <Input
                  id="subTopic"
                  data-testid="input-problem-subtopic"
                  placeholder="e.g., Two Pointers (optional)"
                  value={formData.subTopic}
                  onChange={(e) => setFormData({ ...formData, subTopic: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select 
                  value={formData.difficulty} 
                  onValueChange={(value: 'Easy' | 'Medium' | 'Hard') => 
                    setFormData({ ...formData, difficulty: value })
                  }
                >
                  <SelectTrigger data-testid="select-problem-difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="sheetType">Sheet Type</Label>
                <Select value={formData.sheetType} onValueChange={(value) => setFormData({...formData, sheetType: value})}>
                  <SelectTrigger data-testid="select-sheet-type">
                    <SelectValue placeholder="Select or create sheet type" />
                  </SelectTrigger>
                  <SelectContent>
                    {getExistingSections().map(section => (
                      <SelectItem key={section} value={section}>{section}</SelectItem>
                    ))}
                    <SelectItem value="custom">+ Create New Section</SelectItem>
                  </SelectContent>
                </Select>

                {formData.sheetType === 'custom' && (
                  <input
                    type="text"
                    placeholder="Enter new section name (e.g., MongoDB, React)"
                    value={customSection}
                    onChange={(e) => setCustomSection(e.target.value)}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    data-testid="input-custom-section"
                  />
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                data-testid="button-save-problem"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                <Plus className="h-4 w-4 mr-2" />
                {editingProblem ? 'Update Problem' : 'Add Problem'}
              </Button>

              {editingProblem && (
                <Button
                  type="button"
                  variant="outline"
                  data-testid="button-cancel-edit"
                  onClick={cancelEdit}
                >
                  Cancel
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                data-testid="button-reset-form"
                onClick={() => setFormData({
                  title: '',
                  link: '',
                  topic: '',
                  subTopic: '',
                  difficulty: 'Easy',
                  sheetType: ''
                })}
              >
                Reset
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Bulk Upload */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Bulk Upload</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <Label htmlFor="upload">Upload CSV/JSON</Label>
            <Input
              id="upload"
              type="file"
              accept=".csv,.json"
              data-testid="input-file-upload"
              onChange={handleFileUpload}
            />
          </div>

          <div className="text-xs text-gray-500">
            Expected format: title, link, topic, subTopic, difficulty, sheetType
          </div>

          {previewData && (
            <div className="space-y-2">
              <h4 className="font-medium">Preview Results</h4>
              <div className="text-sm">
                <span className="text-green-600">{previewData.data.length} valid problems</span>
                {previewData.errors.length > 0 && (
                  <span className="text-red-600 ml-4">{previewData.errors.length} errors</span>
                )}
              </div>

              {previewData.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded text-sm">
                  <h5 className="font-medium text-red-800 dark:text-red-200 mb-2">Errors:</h5>
                  <ul className="space-y-1 text-red-700 dark:text-red-300">
                    {previewData.errors.slice(0, 5).map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                    {previewData.errors.length > 5 && (
                      <li>• ... and {previewData.errors.length - 5} more errors</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              data-testid="button-preview-upload"
              onClick={() => uploadFile && handleFileUpload({ target: { files: [uploadFile] } } as any)}
              disabled={!uploadFile}
            >
              <FileText className="h-4 w-4 mr-2" />
              Preview Upload
            </Button>

            <Button
              data-testid="button-bulk-upload"
              onClick={handleBulkUpload}
              disabled={!previewData || previewData.errors.length > 0 || isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Problems
            </Button>
          </div>
        </div>
      </div>

      {/* Problems Management */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Manage Problems ({problems.length})</h3>
        </div>
        <div className="p-6">
          <div className="mb-4 space-y-3">
            <div className="flex gap-3 items-center">
              <Input
                placeholder="Search problems by title, topic, or difficulty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
                data-testid="input-search-admin-problems"
              />
              <Button
                variant={reorderMode ? 'default' : 'outline'}
                onClick={() => setReorderMode(!reorderMode)}
                className="whitespace-nowrap"
              >
                {reorderMode ? 'Exit Reorder' : 'Reorder Mode'}
              </Button>
            </div>
            {selectedProblems.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedProblems.size} problems selected
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={confirmBulkDelete}
                  data-testid="button-bulk-delete"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedProblems(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={sortByTopic}
            >
              Sort by Topic
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={sortByDifficulty}
            >
              Sort by Difficulty
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {reorderMode && <TableHead className="w-12"></TableHead>}
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedProblems.size > 0}
                      onChange={selectAllProblems}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Sheet Type</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {problems
                  .filter(problem => 
                    !searchTerm || 
                    problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    problem.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    problem.difficulty.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    problem.sheetType.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .slice(0, 20).map((problem) => (
                  <TableRow 
                    key={problem.id}
                    draggable={reorderMode}
                    onDragStart={(e) => handleDragStart(e, problem.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, problem.id)}
                    className={`${draggedProblem === problem.id ? 'opacity-50' : ''} ${reorderMode ? 'cursor-move' : ''}`}
                  >
                    {reorderMode && (
                      <TableCell>
                        <GripVertical className="h-4 w-4 text-gray-400" />
                      </TableCell>
                    )}
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedProblems.has(problem.id)}
                        onChange={() => toggleSelectProblem(problem.id)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <a 
                        href={problem.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {problem.title}
                      </a>
                    </TableCell>
                    <TableCell>{problem.topic}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        problem.difficulty === 'Easy' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : problem.difficulty === 'Medium'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {problem.difficulty}
                      </span>
                    </TableCell>
                    <TableCell>{problem.sheetType}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-edit-${problem.id}`}
                          onClick={() => handleEdit(problem)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-delete-${problem.id}`}
                          onClick={() => confirmDelete(problem.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {problems.filter(problem => 
              !searchTerm || 
              problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              problem.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
              problem.difficulty.toLowerCase().includes(searchTerm.toLowerCase()) ||
              problem.sheetType.toLowerCase().includes(searchTerm.toLowerCase())
            ).length > 20 && (
              <div className="text-center text-sm text-gray-500 mt-4">
                Showing first 20 matching problems. Use search to narrow results.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.isOpen} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              Delete Confirmation
            </DialogTitle>
            <DialogDescription className="pt-2">
              {deleteDialog.type === 'single' ? (
                <>
                  Are you sure you want to delete "<span className="font-medium text-gray-900 dark:text-gray-100">{deleteDialog.problemTitle}</span>"?
                  <br /><br />
                  This action cannot be undone and will permanently remove this problem from the database.
                </>
              ) : (
                <>
                  Are you sure you want to delete <span className="font-medium text-gray-900 dark:text-gray-100">{deleteDialog.count} selected problems</span>?
                  <br /><br />
                  This action cannot be undone and will permanently remove these problems from the database.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialog(prev => ({ ...prev, isOpen: false }))}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete {deleteDialog.type === 'bulk' ? 'All' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}