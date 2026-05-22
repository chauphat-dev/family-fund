import React from 'react';
import { useFamilyFund } from '../hooks/useFamilyFund';
import { Wallet } from 'lucide-react';
import { truncateAddress } from '../utils/format';

const ConnectWallet = () => {
  const { walletAddress, connectWallet, disconnectWallet, isWalletConnecting } = useFamilyFund();

  if (walletAddress) {
    return (
      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col items-end">
          <span className="text-xs text-text-secondary">Connected</span>
          <span className="text-sm font-medium text-accent-emerald">
            {truncateAddress(walletAddress)}
          </span>
        </div>
        <button 
          onClick={disconnectWallet}
          className="btn btn-secondary !px-4 !py-2 text-sm"
          title="Disconnect"
        >
          <Wallet size={16} />
          <span className="hidden sm:inline">Disconnect</span>
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={connectWallet} 
      disabled={isWalletConnecting}
      className="btn btn-primary"
    >
      <Wallet size={18} />
      {isWalletConnecting ? 'Connecting...' : 'Connect Freighter'}
    </button>
  );
};

export default ConnectWallet;
