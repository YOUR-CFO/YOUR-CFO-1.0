import { NextResponse } from 'next/server';

// Mock data for team members
const generateMockTeamMembers = () => [
  {
    id: '1',
    name: 'John Smith',
    email: 'john@company.com',
    role: 'CEO',
    avatar: '/avatars/john.jpg',
    department: 'Executive',
    joinDate: new Date('2023-01-15'),
    status: 'active' as const,
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@company.com',
    role: 'CTO',
    avatar: '/avatars/sarah.jpg',
    department: 'Technology',
    joinDate: new Date('2023-02-20'),
    status: 'active' as const,
  },
  {
    id: '3',
    name: 'Mike Chen',
    email: 'mike@company.com',
    role: 'CFO',
    avatar: '/avatars/mike.jpg',
    department: 'Finance',
    joinDate: new Date('2023-03-10'),
    status: 'active' as const,
  },
  {
    id: '4',
    name: 'Lisa Rodriguez',
    email: 'lisa@company.com',
    role: 'Marketing Director',
    avatar: '/avatars/lisa.jpg',
    department: 'Marketing',
    joinDate: new Date('2023-04-05'),
    status: 'active' as const,
  },
];

export async function GET() {
  try {
    const teamMembers = generateMockTeamMembers();
    return NextResponse.json({
      success: true,
      data: teamMembers,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch team members data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}