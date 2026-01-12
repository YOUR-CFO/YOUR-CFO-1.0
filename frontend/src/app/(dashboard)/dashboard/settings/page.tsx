'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  Save,
  Trash2
} from 'lucide-react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [profile, setProfile] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    company: 'Acme Inc.',
    phone: '',
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    weeklyReports: true,
    criticalAlerts: true,
    marketingEmails: false,
  });

  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    loginNotifications: true,
    sessionTimeout: '24h',
  });

  const [billing, setBilling] = useState({
    plan: 'Growth',
    nextBilling: '2024-02-15',
    paymentMethod: '****1234',
    autoRenew: true,
  });

  const handleSaveProfile = async () => {
    setIsSaving(true);
    // Mock API call
    setTimeout(() => {
      setIsSaving(false);
      alert('Profile updated successfully!');
    }, 1000);
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    // Mock API call
    setTimeout(() => {
      setIsSaving(false);
      alert('Notification preferences updated!');
    }, 1000);
  };

  const handleSaveSecurity = async () => {
    setIsSaving(true);
    // Mock API call
    setTimeout(() => {
      setIsSaving(false);
      alert('Security settings updated!');
    }, 1000);
  };

  const handleDeleteAccount = async () => {
    if (confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
      alert('Account deletion would be processed here');
    }
    setShowDeleteConfirm(false);
  };

  const generateApiKey = () => {
    const key = 'sk_' + Math.random().toString(36).substr(2, 32);
    navigator.clipboard.writeText(key);
    alert('API key generated and copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and configuration</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Profile Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={profile.company}
                onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Acme Inc."
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
          <Button onClick={handleSaveProfile} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Profile'}
          </Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notification Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-alerts">Email Alerts</Label>
              <p className="text-sm text-gray-500">Receive email notifications for important updates</p>
            </div>
            <Switch
              id="email-alerts"
              checked={notifications.emailAlerts}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailAlerts: checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="weekly-reports">Weekly Reports</Label>
              <p className="text-sm text-gray-500">Get weekly financial summary reports</p>
            </div>
            <Switch
              id="weekly-reports"
              checked={notifications.weeklyReports}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, weeklyReports: checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="critical-alerts">Critical Alerts</Label>
              <p className="text-sm text-gray-500">Immediate notifications for critical financial issues</p>
            </div>
            <Switch
              id="critical-alerts"
              checked={notifications.criticalAlerts}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, criticalAlerts: checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="marketing-emails">Marketing Emails</Label>
              <p className="text-sm text-gray-500">Receive updates about new features and tips</p>
            </div>
            <Switch
              id="marketing-emails"
              checked={notifications.marketingEmails}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, marketingEmails: checked }))}
            />
          </div>
          <Button onClick={handleSaveNotifications} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Security Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="2fa">Two-Factor Authentication</Label>
              <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
            </div>
            <Switch
              id="2fa"
              checked={security.twoFactorAuth}
              onCheckedChange={(checked) => setSecurity(prev => ({ ...prev, twoFactorAuth: checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="login-notifications">Login Notifications</Label>
              <p className="text-sm text-gray-500">Get notified when someone logs into your account</p>
            </div>
            <Switch
              id="login-notifications"
              checked={security.loginNotifications}
              onCheckedChange={(checked) => setSecurity(prev => ({ ...prev, loginNotifications: checked }))}
            />
          </div>
          <div>
            <Label htmlFor="session-timeout">Session Timeout</Label>
            <select
              id="session-timeout"
              value={security.sessionTimeout}
              onChange={(e) => setSecurity(prev => ({ ...prev, sessionTimeout: e.target.value }))}
              className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="1h">1 hour</option>
              <option value="6h">6 hours</option>
              <option value="12h">12 hours</option>
              <option value="24h">24 hours</option>
              <option value="never">Never</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>API Access</Label>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={generateApiKey}>
                Generate API Key
              </Button>
              <Button variant="outline">
                View API Docs
              </Button>
            </div>
          </div>
          <Button onClick={handleSaveSecurity} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Security Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* Billing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Billing Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Current Plan</p>
              <p className="text-sm text-gray-500">{billing.plan} Plan</p>
            </div>
            <Badge variant="secondary">Active</Badge>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Next Billing Date</p>
              <p className="text-sm text-gray-500">{billing.nextBilling}</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Payment Method</p>
              <p className="text-sm text-gray-500">{billing.paymentMethod}</p>
            </div>
            <Button variant="outline" size="sm">
              Update
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-renew">Auto-Renew</Label>
              <p className="text-sm text-gray-500">Automatically renew your subscription</p>
            </div>
            <Switch
              id="auto-renew"
              checked={billing.autoRenew}
              onCheckedChange={(checked) => setBilling(prev => ({ ...prev, autoRenew: checked }))}
            />
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              Change Plan
            </Button>
            <Button variant="outline">
              Download Invoice
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <p className="font-medium text-red-900">Delete Account</p>
              <p className="text-sm text-red-600">Permanently delete your account and all data</p>
            </div>
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteConfirm(true)}
              disabled={showDeleteConfirm}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </div>
          {showDeleteConfirm && (
            <div className="p-4 bg-red-100 rounded-lg border border-red-200">
              <p className="text-red-800 mb-3">
                This action cannot be undone. Type &quot;DELETE&quot; to confirm:
              </p>
              <div className="flex space-x-2">
                <Input
                  placeholder="Type DELETE to confirm"
                  className="max-w-xs"
                />
                <Button variant="destructive" onClick={handleDeleteAccount}>
                  Confirm Delete
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}