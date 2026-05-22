import React, { useState } from 'react';
import { useFamilyFund } from '../hooks/useFamilyFund';
import Card from '../components/Card';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { formatToken, formatDate } from '../utils/format';
import { Plus, CheckCircle2, XCircle, Send } from 'lucide-react';

const Tasks = () => {
  const { 
    tasks, setTasks, members, 
    fundBalance, setFundBalance,
    isDemoMode, walletAddress, adminAddress,
    client, submitTx
  } = useFamilyFund();
  
  const [filter, setFilter] = useState('all'); // all, active, completed
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reward, setReward] = useState('');
  const [assignee, setAssignee] = useState('');

  const isAdmin = walletAddress === adminAddress || isDemoMode;
  
  const getMemberName = (addr) => {
    const m = members.find(m => m.address === addr);
    return m ? m.name : 'Unknown';
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title || !description || !reward || !assignee) return;
    
    if (isDemoMode) {
      const newTask = {
        id: tasks.length,
        title,
        description,
        reward: Number(reward),
        assignee,
        created_by: walletAddress || adminAddress,
        status: 0,
        created_at: Math.floor(Date.now() / 1000),
        completed_at: 0,
      };
      setTasks([newTask, ...tasks]);
    } else {
      const stroops = BigInt(Math.floor(Number(reward) * 10000000));
      await submitTx(
        () => client.createTask({ 
          admin: walletAddress, 
          title, 
          description, 
          reward: stroops, 
          assignee 
        }),
        "Tạo nhiệm vụ mới thành công!"
      );
    }
    
    setIsCreateModalOpen(false);
    setTitle('');
    setDescription('');
    setReward('');
    setAssignee('');
  };

  const handleSubmit = async (taskId) => {
    if (isDemoMode) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 1 } : t));
    } else {
      await submitTx(
        () => client.submitTask({ member: walletAddress, task_id: taskId }),
        "Đã gửi báo cáo hoàn thành!"
      );
    }
  };

  const handleApprove = async (taskId, rewardAmount) => {
    if (isDemoMode) {
      if (fundBalance < rewardAmount) {
        alert('Quỹ không đủ tiền để trả thưởng!');
        return;
      }
      setFundBalance(prev => prev - rewardAmount);
      setTasks(tasks.map(t => t.id === taskId ? { 
        ...t, 
        status: 2,
        completed_at: Math.floor(Date.now() / 1000)
      } : t));
    } else {
      await submitTx(
        () => client.approveTask({ admin: walletAddress, task_id: taskId }),
        "Đã duyệt và chuyển phần thưởng!"
      );
    }
  };

  const handleReject = async (taskId) => {
    if (isDemoMode) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 3 } : t));
    } else {
      await submitTx(
        () => client.rejectTask({ admin: walletAddress, task_id: taskId }),
        "Đã từ chối nhiệm vụ!"
      );
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'active') return t.status === 0 || t.status === 1;
    if (filter === 'completed') return t.status === 2;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Tasks & Rewards</h2>
          <p className="text-text-secondary">Hoàn thành việc nhà, nhận thưởng ngay.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="bg-bg-primary border border-border-light rounded-lg p-1 flex">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'all' ? 'bg-white/10 text-white' : 'text-text-secondary hover:text-white'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('active')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'active' ? 'bg-white/10 text-white' : 'text-text-secondary hover:text-white'}`}
            >
              Active
            </button>
            <button 
              onClick={() => setFilter('completed')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'completed' ? 'bg-white/10 text-white' : 'text-text-secondary hover:text-white'}`}
            >
              Completed
            </button>
          </div>
          
          {isAdmin && (
            <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary">
              <Plus size={18} />
              Tạo Nhiệm Vụ Mới
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTasks.map((task) => {
          const rewardNum = Number(task.reward);
          const displayReward = rewardNum / (isDemoMode ? 1 : 10000000);

          return (
            <Card key={task.id} className="flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <StatusBadge status={task.status} />
                <div className="bg-accent-purple/20 text-accent-purple px-3 py-1 rounded-full text-sm font-bold border border-accent-purple/30">
                  {formatToken(displayReward)}
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-white mb-2">{task.title}</h3>
              <p className="text-sm text-text-secondary mb-4 line-clamp-3 min-h-[60px]">
                {task.description}
              </p>
              
              <div className="mt-auto space-y-3">
                <div className="flex justify-between items-center text-sm bg-bg-primary/50 px-3 py-2 rounded-lg">
                  <span className="text-text-secondary">Người thực hiện:</span>
                  <span className="text-white font-medium">{getMemberName(task.assignee)}</span>
                </div>
                
                <div className="flex justify-between items-center text-xs text-text-muted px-1">
                  <span>Tạo: {formatDate(Number(task.created_at))}</span>
                  {Number(task.completed_at) > 0 && <span>Xong: {formatDate(Number(task.completed_at))}</span>}
                </div>

                <div className="pt-3 border-t border-border-light flex gap-2">
                  {/* Member action: Submit */}
                  {(task.status === 0 || task.status === 3) && (!isAdmin || walletAddress === task.assignee || isDemoMode) && (
                    <button 
                      onClick={() => handleSubmit(task.id)}
                      className="btn btn-primary w-full"
                    >
                      <Send size={16} /> Báo cáo Xong
                    </button>
                  )}
                  
                  {/* Admin actions: Approve/Reject */}
                  {task.status === 1 && isAdmin && (
                    <>
                      <button 
                        onClick={() => handleApprove(task.id, rewardNum)}
                        className="btn btn-success flex-1"
                      >
                        <CheckCircle2 size={16} /> Duyệt & Thưởng
                      </button>
                      <button 
                        onClick={() => handleReject(task.id)}
                        className="btn btn-danger flex-1"
                      >
                        <XCircle size={16} /> Từ chối
                      </button>
                    </>
                  )}
                  
                  {/* Read-only state */}
                  {task.status === 2 && (
                    <div className="w-full py-2 text-center text-accent-emerald text-sm font-medium bg-accent-emerald/10 rounded-lg">
                      Đã hoàn thành & Nhận thưởng
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        
        {filteredTasks.length === 0 && (
          <div className="col-span-full py-12 text-center text-text-secondary">
            <p>Không có nhiệm vụ nào.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Tạo Nhiệm Vụ Mới">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="input-label">Tiêu đề</label>
            <input 
              type="text" 
              value={title} onChange={(e) => setTitle(e.target.value)}
              className="input-field" required
              placeholder="VD: Dọn dẹp phòng khách"
            />
          </div>
          <div>
            <label className="input-label">Mô tả chi tiết</label>
            <textarea 
              value={description} onChange={(e) => setDescription(e.target.value)}
              className="input-field min-h-[100px] resize-y" required
              placeholder="Ghi rõ các yêu cầu cần làm..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Phần thưởng (XLM)</label>
              <input 
                type="number" min="1" step="0.01"
                value={reward} onChange={(e) => setReward(e.target.value)}
                className="input-field" required
              />
            </div>
            <div>
              <label className="input-label">Giao cho</label>
              <select 
                value={assignee} 
                onChange={(e) => setAssignee(e.target.value)}
                className="input-field bg-bg-primary" required
              >
                <option value="">-- Chọn --</option>
                {members.filter(m => m.is_active && m.role === 0).map(m => (
                  <option key={m.address} value={m.address}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-full mt-2">Tạo Nhiệm Vụ</button>
        </form>
      </Modal>
    </div>
  );
};

export default Tasks;
