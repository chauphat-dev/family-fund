import React, { useState } from 'react';
import { useFamilyFund } from '../hooks/useFamilyFund';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { formatDate, truncateAddress } from '../utils/format';
import { UserPlus, UserMinus } from 'lucide-react';

const Members = () => {
  const { members, setMembers, isDemoMode, walletAddress, adminAddress, client, submitTx } = useFamilyFund();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Form state
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberAddress, setNewMemberAddress] = useState('');

  const isAdmin = walletAddress === adminAddress || isDemoMode;

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberName || !newMemberAddress) return;

    if (isDemoMode) {
      const newMember = {
        address: newMemberAddress,
        name: newMemberName,
        role: 0,
        joined_at: Math.floor(Date.now() / 1000),
        is_active: true,
        avatar: '👤',
      };
      setMembers([...members, newMember]);
    } else {
      await submitTx(
        () => client.addMember({ 
          admin: walletAddress, 
          member: newMemberAddress, 
          name: newMemberName, 
          role: 0 // 0 for Member
        }),
        "Thêm thành viên thành công!"
      );
    }
    
    setIsAddModalOpen(false);
    setNewMemberName('');
    setNewMemberAddress('');
  };

  const handleRemoveMember = async (address) => {
    if (!confirm('Bạn có chắc chắn muốn xoá thành viên này?')) return;
    
    if (isDemoMode) {
      setMembers(members.map(m => m.address === address ? { ...m, is_active: false } : m));
    } else {
      await submitTx(
        () => client.removeMember({ admin: walletAddress, member: address }),
        "Đã xoá thành viên!"
      );
    }
  };

  const activeMembers = members.filter(m => m.is_active);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Family Members</h2>
          <p className="text-text-secondary">Quản lý các thành viên trong gia đình.</p>
        </div>
        
        {isAdmin && (
          <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary self-start sm:self-auto">
            <UserPlus size={18} />
            Thêm Thành Viên
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {activeMembers.map((member) => (
          <Card key={member.address} className="flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-purple/20 to-accent-blue/20 border border-white/10 flex items-center justify-center text-2xl">
                  {member.avatar || '👤'}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${member.role === 1 ? 'bg-accent-purple/20 text-accent-purple border border-accent-purple/30' : 'bg-white/10 text-text-secondary border border-white/5'}`}>
                      {member.role === 1 ? 'Admin' : 'Member'}
                    </span>
                  </div>
                </div>
              </div>
              
              {isAdmin && member.role !== 1 && (
                <button 
                  onClick={() => handleRemoveMember(member.address)}
                  className="text-text-muted hover:text-accent-rose transition-colors p-1"
                  title="Remove Member"
                >
                  <UserMinus size={18} />
                </button>
              )}
            </div>
            
            <div className="mt-auto space-y-2 pt-4 border-t border-border-light">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Ví:</span>
                <span className="text-white font-mono">{truncateAddress(member.address)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Tham gia:</span>
                <span className="text-white">{formatDate(Number(member.joined_at))}</span>
              </div>
            </div>
          </Card>
        ))}
        {activeMembers.length === 0 && (
          <div className="col-span-full py-8 text-center text-text-secondary">
            Chưa có thành viên nào.
          </div>
        )}
      </div>

      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        title="Thêm Thành Viên Mới"
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label className="input-label">Tên thành viên</label>
            <input 
              type="text" 
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="VD: Con Trai"
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="input-label">Địa chỉ ví (Stellar Public Key)</label>
            <input 
              type="text" 
              value={newMemberAddress}
              onChange={(e) => setNewMemberAddress(e.target.value)}
              placeholder="G..."
              className="input-field font-mono text-sm"
              required
            />
          </div>
          
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary flex-1">
              Hủy
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              Thêm
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Members;
