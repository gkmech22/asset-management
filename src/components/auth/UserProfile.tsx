import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, Settings, Edit, Trash } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search } from 'lucide-react';

export const UserProfile = () => {
  const { user, signOut, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [openCreateUser, setOpenCreateUser] = useState(false);
  const [openEditUser, setOpenEditUser] = useState(false);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [department, setDepartment] = useState(user?.user_metadata?.department || '');
  const [role, setRole] = useState(user?.user_metadata?.role || '');
  const [accountType, setAccountType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    setFullName(user?.user_metadata?.full_name || '');
    setEmail(user?.email || '');
    setDepartment(user?.user_metadata?.department || '');
    setRole(user?.user_metadata?.role || '');
    setAccountType('');
    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    await signOut();
    setIsLoading(false);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateUser({ data: { full_name: fullName } });
      const { data: session } = await supabase.auth.getSession();
      if (session.session) {
        setFullName(session.session.user.user_metadata.full_name || '');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
      setOpenProfile(false);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateUser({ data: { department, role } });
      const { data: session } = await supabase.auth.getSession();
      if (session.session) {
        setDepartment(session.session.user.user_metadata.department || '');
        setRole(session.session.user.user_metadata.role || '');
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
    } finally {
      setIsLoading(false);
      setOpenSettings(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: 'defaultPassword123', // Replace with secure password or user input
        options: {
          data: {
            department,
            role,
            account_type: accountType || 'Standard',
          },
        },
      });
      if (error) throw error;
      if (data.user) {
        const { error: insertError } = await supabase.from('users').insert({
          id: data.user.id,
          email,
          department,
          role,
          account_type: accountType || 'Standard',
        });
        if (insertError) throw insertError;
        await fetchUsers(); // Ensure data is refreshed
        alert('User created successfully! Please ask the new user to check their email and log in.');
      }
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setIsLoading(false);
      if (!isLoading) {
        setOpenCreateUser(false);
        setEmail('');
        setDepartment('');
        setRole('');
        setAccountType('');
      }
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEmail(user.email);
    setDepartment(user.department || '');
    setRole(user.role || '');
    setAccountType(user.account_type || '');
    setOpenEditUser(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          email,
          department,
          role,
          account_type: accountType,
        })
        .eq('id', selectedUser.id);
      if (error) throw error;
      await fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setIsLoading(false);
      setOpenEditUser(false);
      setSelectedUser(null);
      setEmail('');
      setDepartment('');
      setRole('');
      setAccountType('');
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      setUsers(users.filter(user => user.id !== id));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const userInitials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : user.email?.[0]?.toUpperCase() || 'U';

  if (!user) return <div>Please log in to access this page.</div>;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage
                src={user.user_metadata?.avatar_url}
                alt={user.user_metadata?.full_name || user.email}
              />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.user_metadata?.full_name || 'User'}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpenProfile(true)}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenSettings(true)}>
            <Settings className="mr-2 h-4 w-4" />
            <span>User Management</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSignOut}
            disabled={isLoading}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>{isLoading ? 'Signing out...' : 'Sign out'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Profile Edit Dialog */}
      <Dialog open={openProfile} onOpenChange={setOpenProfile}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your profile information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fullName" className="text-right">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* User Management Dialog */}
      <Dialog open={openSettings} onOpenChange={setOpenSettings}>
        <DialogContent className="max-w-full w-auto overflow-y-auto">
          <DialogHeader className="flex justify-between items-center">
            <div>
              <DialogTitle>User Management</DialogTitle>
              <DialogDescription>Manage user details.</DialogDescription>
            </div>
            <Button onClick={() => setOpenCreateUser(true)} className="ml-auto">Add new users</Button>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
              <Button variant="outline" size="icon" onClick={() => setSearchQuery('')}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-gray-100">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Account Type</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email.split('@')[0]}</TableCell>
                      <TableCell>{user.department}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.account_type}</TableCell>
                      <TableCell className="flex space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)}>
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={openCreateUser} onOpenChange={setOpenCreateUser}>
        <DialogContent className="max-w-full w-auto overflow-y-auto text-sm">
          <DialogHeader>
            <DialogTitle>Create new users</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4 py-4 overflow-y-auto">
            <div>
              <Label htmlFor="accountType">Account Type *</Label>
              <select id="accountType" className="w-full p-2 border rounded" value={accountType} onChange={(e) => setAccountType(e.target.value)}>
                <option value="">Select Account Type</option>
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="department">Select Department *</Label>
              <select id="department" className="w-full p-2 border rounded" value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="">Select Department</option>
                <option value="Administrators">Administrators</option>
                <option value="Consultant">Consultant</option>
                <option value="Customer Support Team">Customer Support Team</option>
                <option value="DevOps Team">DevOps Team</option>
                <option value="DevOps-Production">DevOps-Production</option>
                <option value="Dropped">Dropped</option>
                <option value="FT QA Team">FT QA Team</option>
                <option value="IT Team-East">IT Team-East</option>
              </select>
            </div>
            <div>
              <Label htmlFor="role">Select role *</Label>
              <select id="role" className="w-full p-2 border rounded" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="">Select Role</option>
                <option value="Reporter">Reporter (Read)</option>
                <option value="Operator">Operator (Read,Write)</option>
                <option value="Admin">Admin (Read,Write,Execute)</option>
                <option value="Super Admin">Super Admin (Full Access)</option>
              </select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenCreateUser(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={openEditUser} onOpenChange={setOpenEditUser}>
        <DialogContent className="sm:max-w-[400px] max-h-[70vh] text-sm">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4 py-4 overflow-y-auto max-h-[50vh]">
            <div>
              <Label htmlFor="editEmail">Email *</Label>
              <Input
                id="editEmail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="editDepartment">Select Department *</Label>
              <select id="editDepartment" className="w-full p-2 border rounded" value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="">Select Department</option>
                <option value="Administrators">Administrators</option>
                <option value="Consultant">Consultant</option>
                <option value="Customer Support Team">Customer Support Team</option>
                <option value="DevOps Team">DevOps Team</option>
                <option value="DevOps-Production">DevOps-Production</option>
                <option value="Dropped">Dropped</option>
                <option value="FT QA Team">FT QA Team</option>
                <option value="IT Team-East">IT Team-East</option>
              </select>
            </div>
            <div>
              <Label htmlFor="editRole">Select role *</Label>
              <select id="editRole" className="w-full p-2 border rounded" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="">Select Role</option>
                <option value="Reporter">Reporter (Read)</option>
                <option value="Operator">Operator (Read,Write)</option>
                <option value="Admin">Admin (Read,Write,Execute)</option>
                <option value="Super Admin">Super Admin (Full Access)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="editAccountType">Account Type *</Label>
              <select id="editAccountType" className="w-full p-2 border rounded" value={accountType} onChange={(e) => setAccountType(e.target.value)}>
                <option value="">Select Account Type</option>
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenEditUser(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};