import React from 'react';
import { useFamilyFund } from '../hooks/useFamilyFund';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatToken, formatRelativeTime } from '../utils/format';
import { TrendingUp, Users, CheckSquare, ArrowRightLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { fundBalance, members, tasks, transferRequests } = useFamilyFund();

  const activeMembers = members.filter(m => m.is_active);
  const pendingTasks = tasks.filter(t => t.status === 0 || t.status === 1);
  const recentTransfers = transferRequests.slice().reverse().slice(0, 5); // Latest 5

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Good Morning, Family!</h2>
        <p className="text-text-secondary">Here's what's happening with the Family Fund today.</p>
      </div>

      <div className="dashboard-grid">
        {/* Balance Card */}
        <Card className="col-span-12 md:col-span-8 lg:col-span-6 bg-gradient-to-br from-[rgba(16,185,129,0.15)] to-transparent border-[rgba(16,185,129,0.2)]">
          <div className="flex flex-col h-full justify-between">
            <div>
              <p className="text-text-secondary mb-1">Total Fund Balance</p>
              <h3 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
                {formatToken(fundBalance)}
              </h3>
            </div>
            <div className="flex items-center gap-2 mt-6 text-accent-emerald text-sm font-medium">
              <TrendingUp size={16} />
              <span>Ready for allowances and rewards</span>
            </div>
          </div>
        </Card>

        {/* Quick Stats Grid */}
        <div className="col-span-12 md:col-span-4 lg:col-span-6 grid grid-cols-2 gap-4">
          <Card className="flex flex-col justify-center items-center text-center p-4">
            <Users className="text-accent-blue mb-2" size={28} />
            <span className="text-2xl font-bold text-white">{activeMembers.length}</span>
            <span className="text-xs text-text-secondary">Active Members</span>
          </Card>
          
          <Card className="flex flex-col justify-center items-center text-center p-4">
            <CheckSquare className="text-accent-purple mb-2" size={28} />
            <span className="text-2xl font-bold text-white">{pendingTasks.length}</span>
            <span className="text-xs text-text-secondary">Pending Tasks</span>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="col-span-12 lg:col-span-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Recent Requests</h3>
            <Link to="/transfers" className="text-sm text-accent-purple hover:underline">View All</Link>
          </div>
          
          <div className="space-y-4">
            {recentTransfers.length === 0 ? (
              <p className="text-text-secondary text-center py-4">No recent activity</p>
            ) : (
              recentTransfers.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/10 p-2 rounded-full">
                      <ArrowRightLeft size={16} className="text-text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{req.reason}</p>
                      <p className="text-xs text-text-secondary">
                        {formatRelativeTime(req.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{formatToken(req.amount)}</p>
                    <StatusBadge status={req.status} type="transfer" className="mt-1" />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Family Members Row */}
        <Card className="col-span-12 lg:col-span-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Family Members</h3>
            <Link to="/members" className="text-sm text-accent-purple hover:underline">Manage</Link>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {activeMembers.slice(0, 6).map((member) => (
              <div key={member.address} className="flex flex-col items-center p-3 rounded-xl bg-white/5 border border-border-light text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center text-2xl mb-2 shadow-lg">
                  {member.avatar || '👤'}
                </div>
                <span className="text-sm font-medium text-white truncate w-full">{member.name}</span>
                <span className="text-xs text-text-secondary mt-1">{member.role === 1 ? 'Admin' : 'Member'}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
