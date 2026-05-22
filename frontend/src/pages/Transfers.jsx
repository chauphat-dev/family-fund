import React, { useState } from 'react';
import { useFamilyFund } from '../hooks/useFamilyFund';
import Card from '../components/Card';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { formatToken, formatDate } from '../utils/format';
import { ArrowDownToLine, ArrowRightLeft, Check, X } from 'lucide-react';

const Transfers = () => {
  const { 
    fundBalance, setFundBalance, 
    transferRequests, setTransferRequests, 
    isDemoMode, walletAddress, adminAddress, members,
    client, submitTx
  } = useFamilyFund();
  
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const isAdmin = walletAddress === adminAddress || isDemoMode;
  
  // Helper to get member name by address
  const getMemberName = (addr) => {
    const member = members.find(m => m.address === addr);
    return member ? member.name : 'Unknown';
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;
    
    if (isDemoMode) {
      setFundBalance(prev => prev + Number(amount));
    } else {
      // Amount in contract is i128. Need to convert considering token decimals (usually 7 for XLM, but here we just pass big integer string)
      // Assuming 1 XLM = 10,000,000 stroops
      const stroops = BigInt(Math.floor(Number(amount) * 10000000));
      await submitTx(
        () => client.deposit({ from: walletAddress, amount: stroops }),
        "Nạp tiền thành công!"
      );
    }
    
    setIsDepositModalOpen(false);
    setAmount('');
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0 || !reason) return;
    
    if (isDemoMode) {
      const newReq = {
        id: transferRequests.length,
        from: walletAddress || members[1].address,
        amount: Number(amount),
        reason,
        status: 0,
        created_at: Math.floor(Date.now() / 1000),
      };
      setTransferRequests([newReq, ...transferRequests]);
    } else {
      const stroops = BigInt(Math.floor(Number(amount) * 10000000));
      await submitTx(
        () => client.requestTransfer({ member: walletAddress, amount: stroops, reason }),
        "Đã gửi yêu cầu!"
      );
    }
    
    setIsRequestModalOpen(false);
    setAmount('');
    setReason('');
  };

  const handleApprove = async (id, reqAmount) => {
    if (isDemoMode) {
      if (fundBalance < reqAmount) {
        alert('Không đủ số dư trong quỹ!');
        return;
      }
      setFundBalance(prev => prev - reqAmount);
      setTransferRequests(reqs => reqs.map(r => r.id === id ? { ...r, status: 1 } : r));
    } else {
      await submitTx(
        () => client.approveTransfer({ admin: walletAddress, request_id: id }),
        "Đã duyệt yêu cầu chuyển tiền!"
      );
    }
  };

  const handleReject = async (id) => {
    if (isDemoMode) {
      setTransferRequests(reqs => reqs.map(r => r.id === id ? { ...r, status: 2 } : r));
    } else {
      await submitTx(
        () => client.rejectTransfer({ admin: walletAddress, request_id: id }),
        "Đã từ chối yêu cầu!"
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Fund & Transfers</h2>
          <p className="text-text-secondary">Quản lý quỹ chung và các yêu cầu chuyển tiền.</p>
        </div>
        
        <div className="flex gap-3">
          <button onClick={() => setIsDepositModalOpen(true)} className="btn btn-secondary">
            <ArrowDownToLine size={18} />
            Nạp Tiền
          </button>
          <button onClick={() => setIsRequestModalOpen(true)} className="btn btn-primary">
            <ArrowRightLeft size={18} />
            Yêu Cầu Chuyển
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance Summary */}
        <Card className="lg:col-span-1 bg-gradient-to-br from-accent-blue/10 to-transparent border-accent-blue/20">
          <p className="text-text-secondary mb-2">Số dư quỹ hiện tại</p>
          <h3 className="text-4xl font-bold text-white mb-6">{formatToken(fundBalance / (isDemoMode ? 1 : 10000000))}</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Pending Requests:</span>
              <span className="text-accent-amber font-medium">
                {transferRequests.filter(r => r.status === 0).length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Total Approved:</span>
              <span className="text-accent-emerald font-medium">
                {formatToken(transferRequests.filter(r => r.status === 1).reduce((acc, r) => acc + Number(r.amount), 0) / (isDemoMode ? 1 : 10000000))}
              </span>
            </div>
          </div>
        </Card>

        {/* Requests List */}
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">Lịch sử yêu cầu chuyển tiền</h3>
          
          <div className="space-y-3">
            {transferRequests.map((req) => (
              <div key={req.id} className="p-4 rounded-xl bg-white/5 border border-border-light hover:bg-white/10 transition-colors flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white">{getMemberName(req.from)}</span>
                    <span className="text-text-secondary text-sm">yêu cầu</span>
                    <span className="font-bold text-accent-emerald">{formatToken(Number(req.amount) / (isDemoMode ? 1 : 10000000))}</span>
                  </div>
                  <p className="text-sm text-text-secondary">"{req.reason}"</p>
                  <p className="text-xs text-text-muted mt-2">{formatDate(Number(req.created_at))}</p>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <StatusBadge status={req.status} type="transfer" />
                  
                  {isAdmin && req.status === 0 && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleApprove(req.id, req.amount)}
                        className="p-1.5 rounded-md bg-accent-emerald/20 text-accent-emerald hover:bg-accent-emerald hover:text-white transition-colors"
                        title="Duyệt"
                      >
                        <Check size={18} />
                      </button>
                      <button 
                        onClick={() => handleReject(req.id)}
                        className="p-1.5 rounded-md bg-accent-rose/20 text-accent-rose hover:bg-accent-rose hover:text-white transition-colors"
                        title="Từ chối"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {transferRequests.length === 0 && (
              <p className="text-center text-text-secondary py-8">Chưa có yêu cầu nào.</p>
            )}
          </div>
        </Card>
      </div>

      <Modal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} title="Nạp tiền vào quỹ">
        <form onSubmit={handleDeposit} className="space-y-4">
          <div>
            <label className="input-label">Số lượng (XLM)</label>
            <input 
              type="number" min="1" step="0.01"
              value={amount} onChange={(e) => setAmount(e.target.value)}
              className="input-field" required
            />
          </div>
          <button type="submit" className="btn btn-primary w-full">Xác nhận nạp</button>
        </form>
      </Modal>

      <Modal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} title="Tạo yêu cầu chuyển tiền">
        <form onSubmit={handleRequest} className="space-y-4">
          <div>
            <label className="input-label">Số tiền cần rút (XLM)</label>
            <input 
              type="number" min="1" step="0.01"
              value={amount} onChange={(e) => setAmount(e.target.value)}
              className="input-field" required
            />
          </div>
          <div>
            <label className="input-label">Lý do</label>
            <textarea 
              value={reason} onChange={(e) => setReason(e.target.value)}
              className="input-field min-h-[100px] resize-y" required
              placeholder="VD: Mua sách vở..."
            />
          </div>
          <button type="submit" className="btn btn-primary w-full">Gửi yêu cầu</button>
        </form>
      </Modal>
    </div>
  );
};

export default Transfers;
