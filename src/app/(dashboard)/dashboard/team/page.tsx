'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  Shield, 
  Calendar,
  Trash2,
  DollarSign,
  Eye
} from 'lucide-react';
import { dashboardApi } from '@/lib/api/services';
import { format } from 'date-fns';

export default function TeamPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'founder' | 'accountant' | 'viewer'>('viewer');

  const { data: teamData, isLoading, refetch } = useQuery({
    queryKey: ['team', searchTerm],
    queryFn: dashboardApi.getTeamMembers,
  });

  const handleInviteMember = async () => {
    if (!inviteEmail) return;
    
    try {
      await dashboardApi.inviteTeamMember({
        email: inviteEmail,
        role: inviteRole,
      });
      
      setInviteEmail('');
      setShowInviteModal(false);
      refetch();
      alert('Invitation sent successfully!');
    } catch {
      alert('Failed to send invitation');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (confirm('Are you sure you want to remove this team member?')) {
      try {
        await dashboardApi.removeTeamMember(memberId);
        refetch();
        alert('Team member removed successfully');
      } catch {
        alert('Failed to remove team member');
      }
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'founder':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'accountant':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'founder':
        return <Shield className="h-4 w-4" />;
      case 'accountant':
        return <DollarSign className="h-4 w-4" />;
      case 'viewer':
        return <Eye className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Team Management</h1>
            <p className="text-gray-600">Manage your team members and access levels</p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-gray-600">Manage your team members and access levels</p>
        </div>
        <Button onClick={() => setShowInviteModal(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Team Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamData?.data?.totalMembers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active team members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Founders</CardTitle>
            <Shield className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {teamData?.data?.byRole?.founder || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Full access
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accountants</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {teamData?.data?.byRole?.accountant || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Financial access
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Viewers</CardTitle>
            <Eye className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {teamData?.data?.byRole?.viewer || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Read-only access
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {teamData?.data?.members && teamData.data.members.length > 0 ? (
            <div className="space-y-3">
              {teamData.data.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-gray-500 flex items-center space-x-1">
                        <Mail className="h-3 w-3" />
                        <span>{member.email}</span>
                      </p>
                      <p className="text-xs text-gray-400 flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Last active {format(new Date(member.lastActive), 'MMM dd, yyyy')}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getRoleColor(member.role)}`}
                    >
                      {getRoleIcon(member.role)}
                      <span className="ml-1 capitalize">{member.role}</span>
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'Try adjusting your search terms.' : 'Invite your first team member to get started.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowInviteModal(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite First Member
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Invite Team Member</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="invite-role">Role</Label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'viewer' | 'accountant' | 'founder')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="viewer">Viewer - Read-only access</option>
                  <option value="accountant">Accountant - Financial access</option>
                  <option value="founder">Founder - Full access</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={handleInviteMember}
                  disabled={!inviteEmail}
                  className="flex-1"
                >
                  Send Invitation
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}