import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Shield, Save, Trash2 } from 'lucide-react';

export function ProfileSettings() {
  const { user, updateUser, deleteAccount, signOut } = useAuthStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateUser({
        displayName: formData.displayName,
        email: formData.email,
      });

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated"
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmationText !== 'DELETE MY ACCOUNT') {
      toast({
        title: "Confirmation required",
        description: "Please type 'DELETE MY ACCOUNT' to confirm",
        variant: "destructive"
      });
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccount();
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted"
      });
      await signOut();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialog(false);
      setConfirmationText('');
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Please log in to view settings</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your account information and preferences</p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-center">
              <div className="mb-4">
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{user.displayName || 'User'}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Enter your display name"
                data-testid="input-display-name"
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  readOnly
                  className="bg-gray-50 dark:bg-gray-800 pl-10"
                  data-testid="input-email"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Account Type</span>
            </div>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              user.role === 'admin' 
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}>
              {user.role === 'admin' ? 'Administrator' : 'User'}
            </span>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-save-profile"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Progress Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {user.solvedProblems?.length || 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Problems Solved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {user.starredProblems?.length || 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Starred Problems</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Object.keys(user.notes || {}).length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Notes Written</div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-4">Danger Zone</h3>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-red-900 dark:text-red-100">Delete Account</h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button
                variant="destructive"
                className="mt-3 bg-red-600 hover:bg-red-700"
                onClick={() => setDeleteDialog(true)}
                data-testid="button-delete-account"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete My Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-900 dark:text-red-100">
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              Delete Account
            </DialogTitle>
            <DialogDescription className="pt-2">
              <div className="space-y-3 text-gray-600 dark:text-gray-400">
                <p>
                  <strong className="text-red-600 dark:text-red-400">Warning:</strong> This action is irreversible and will permanently delete:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Your profile and account information</li>
                  <li>All your problem-solving progress ({user.solvedProblems?.length || 0} solved problems)</li>
                  <li>Your starred problems ({user.starredProblems?.length || 0} starred)</li>
                  <li>All your notes ({Object.keys(user.notes || {}).length} notes)</li>
                </ul>
                <p className="text-sm">
                  To confirm, type <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">DELETE MY ACCOUNT</span> below:
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Type: DELETE MY ACCOUNT"
              className="font-mono"
              data-testid="input-delete-confirmation"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialog(false);
                setConfirmationText('');
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting || confirmationText !== 'DELETE MY ACCOUNT'}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}