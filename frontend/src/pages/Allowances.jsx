import React, { useState } from 'react';
import { useFamilyFund } from '../hooks/useFamilyFund';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { formatToken, formatDate } from '../utils/format';
import { CalendarClock, Plus, WalletCards } from 'lucide-react';

const Allowances = () => {
  const { 
    allowances, setAllowances, members, 
    fundBalance, setFundBalance,
    isDemoMode, walletAddress, adminAddress,
    client, submitTx
  } = useFamilyFund();
  
  const [isSetModalOpen, setIsSetModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState('');
  const [amount, setAmount] = useState('');
  const [intervalDays, setIntervalDays] = useState('30');

  const isAdmin = walletAddress === adminAddress || isDemoMode;
  
  const getMemberInfo = (addr) => members.find(m => m.address === addr);

  const handleSetAllowance = async (e) => {
    e.preventDefault();
    if (!selectedMember || !amount || !intervalDays) return;
    
    const intervalSecs = Number(intervalDays) * 86400;
    
    if (isDemoMode) {
      const newAllowance = {
        member: selectedMember,
        amount: Number(amount),
        interval: intervalSecs,
        last_claimed: Math.floor(Date.now() / 1000), // starts now
        is_active: true,
      };
      
      const filtered = allowances.filter(a => a.member !== selectedMember);
      setAllowances([...filtered, newAllowance]);
    } else {
      const stroops = BigInt(Math.floor(Number(amount) * 10000000));
      await submitTx(
        () => client.setAllowance({ 
          admin: walletAddress, 
          member: selectedMember, 
          amount: stroops, 
          interval: intervalSecs 
        }),
        "Đã thiết lập lương tháng thành công!"
      );
    }
    
    setIsSetModalOpen(false);
    setSelectedMember('');
    setAmount('');
  };

  const handleClaim = async (memberAddr) => {
    const allowance = allowances.find(a => a.member === memberAddr);
    if (!allowance) return;
    
    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - Number(allowance.last_claimed);
    
    if (elapsed < Number(allowance.interval)) {
      alert('Chưa đến hạn claim!');
      return;
    }
    
    if (isDemoMode) {
      const periods = Math.floor(elapsed / Number(allowance.interval));
      const totalAmount = Number(allowance.amount) * periods;
      
      if (fundBalance < totalAmount) {
        alert('Quỹ không đủ tiền!');
        return;
      }
      
      setFundBalance(prev => prev - totalAmount);
      setAllowances(alls => alls.map(a => {
        if (a.member === memberAddr) {
          return { ...a, last_claimed: Number(a.last_claimed) + (periods * Number(a.interval)) };
        }
        return a;
      }));
      
      alert(`Đã nhận thành công ${formatToken(totalAmount)}!`);
    } else {
      await submitTx(
        () => client.claimAllowance({ member: memberAddr }),
        "Đã nhận lương thành công từ quỹ gia đình!"
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Monthly Allowances</h2>
          <p className="text-text-secondary">Quản lý lương tháng cho các thành viên.</p>
        </div>
        
        {isAdmin && (
          <button onClick={() => setIsSetModalOpen(true)} className="btn btn-primary self-start sm:self-auto">
            <Plus size={18} />
            Thiết Lập Lương
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allowances.filter(a => a.is_active).map((allowance) => {
          const member = getMemberInfo(allowance.member);
          if (!member) return null;
          
          const now = Math.floor(Date.now() / 1000);
          const intervalNum = Number(allowance.interval);
          const lastClaimedNum = Number(allowance.last_claimed);
          const amountNum = Number(allowance.amount);
          
          const elapsed = now - lastClaimedNum;
          const isClaimable = elapsed >= intervalNum;
          const daysLeft = isClaimable ? 0 : Math.ceil((intervalNum - elapsed) / 86400);
          
          const periodsToClaim = Math.floor(elapsed / intervalNum);
          const claimableAmount = periodsToClaim * amountNum;
          
          const displayAmount = amountNum / (isDemoMode ? 1 : 10000000);
          const displayClaimable = claimableAmount / (isDemoMode ? 1 : 10000000);

          return (
            <Card key={allowance.member} className="flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl">
                  {member.avatar || '👤'}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                  <p className="text-sm text-text-secondary">{formatToken(displayAmount)} / {Math.floor(intervalNum / 86400)} ngày</p>
                </div>
              </div>
              
              <div className="bg-bg-primary/50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-text-secondary">Lần nhận cuối:</span>
                  <span className="text-sm text-white">{formatDate(lastClaimedNum)}</span>
                </div>
                
                {!isClaimable ? (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-text-secondary">Chờ đến kỳ tiếp theo...</span>
                      <span className="text-accent-blue">{daysLeft} ngày nữa</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5">
                      <div 
                        className="bg-accent-blue h-1.5 rounded-full transition-all duration-1000" 
                        style={{ width: `${(elapsed / intervalNum) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 p-3 bg-accent-emerald/10 border border-accent-emerald/20 rounded-md flex items-center gap-2 text-accent-emerald">
                    <WalletCards size={18} />
                    <span className="text-sm font-medium">Có thể nhận: {formatToken(displayClaimable)}</span>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => handleClaim(allowance.member)}
                disabled={!isClaimable || (!isAdmin && walletAddress !== allowance.member)}
                className={`btn w-full mt-auto ${isClaimable ? 'btn-success' : 'btn-secondary opacity-50 cursor-not-allowed'}`}
              >
                {isClaimable ? 'Nhận Lương' : 'Chưa Đến Hạn'}
              </button>
            </Card>
          );
        })}
        
        {allowances.filter(a => a.is_active).length === 0 && (
          <div className="col-span-full py-12 text-center text-text-secondary">
            <CalendarClock className="mx-auto mb-3 opacity-50" size={48} />
            <p>Chưa có lương tháng nào được thiết lập.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isSetModalOpen} onClose={() => setIsSetModalOpen(false)} title="Thiết lập Lương Tháng">
        <form onSubmit={handleSetAllowance} className="space-y-4">
          <div>
            <label className="input-label">Chọn Thành Viên</label>
            <select 
              value={selectedMember} 
              onChange={(e) => setSelectedMember(e.target.value)}
              className="input-field bg-bg-primary"
              required
            >
              <option value="">-- Chọn thành viên --</option>
              {members.filter(m => m.is_active && m.role === 0).map(m => (
                <option key={m.address} value={m.address}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">Số Lượng (XLM)</label>
            <input 
              type="number" min="1" step="0.01"
              value={amount} onChange={(e) => setAmount(e.target.value)}
              className="input-field" required
            />
          </div>
          <div>
            <label className="input-label">Chu kỳ (Số ngày)</label>
            <select 
              value={intervalDays} 
              onChange={(e) => setIntervalDays(e.target.value)}
              className="input-field bg-bg-primary"
            >
              <option value="7">1 Tuần (7 ngày)</option>
              <option value="15">Nửa tháng (15 ngày)</option>
              <option value="30">1 Tháng (30 ngày)</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary w-full">Lưu Cài Đặt</button>
        </form>
      </Modal>
    </div>
  );
};

export default Allowances;
