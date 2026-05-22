import React, { createContext, useState, useEffect, useCallback } from 'react';
import { isConnected, getPublicKey, requestAccess, signTransaction } from '@stellar/freighter-api';
import * as Client from 'family-fund';
import { RPC_URL, NETWORK_PASSPHRASE } from '../lib/stellar';
import { MOCK_DATA } from '../lib/mock-data';

export const FamilyFundContext = createContext();

export const FamilyFundProvider = ({ children }) => {
  // Config state
  const [isDemoMode, setIsDemoMode] = useState(false); // Live Mode by default
  const [isLoading, setIsLoading] = useState(false);
  
  // Wallet state
  const [walletAddress, setWalletAddress] = useState(null);
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);

  // App data state
  const [fundBalance, setFundBalance] = useState(0);
  const [adminAddress, setAdminAddress] = useState(null);
  const [members, setMembers] = useState([]);
  const [allowances, setAllowances] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [transferRequests, setTransferRequests] = useState([]);

  const client = new Client.Client({
    rpcUrl: RPC_URL,
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  // Check wallet connection on load
  useEffect(() => {
    const checkWallet = async () => {
      if (await isConnected()) {
        try {
          const key = await getPublicKey();
          if (key) setWalletAddress(key);
        } catch (e) {
          console.log('Wallet locked or not connected yet');
        }
      }
    };
    checkWallet();
  }, []);

  const connectWallet = async () => {
    setIsWalletConnecting(true);
    try {
      if (await isConnected()) {
        const accessStr = await requestAccess();
        setWalletAddress(accessStr);
      } else {
        alert('Vui lòng cài đặt ví Freighter!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsWalletConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
  };

  // ---------------------------------------------------------
  // Blockchain Interaction Helpers
  // ---------------------------------------------------------
  
  const submitTx = async (txBuilderFunction, successMessage) => {
    if (!walletAddress) {
      alert("Vui lòng kết nối ví Freighter trước!");
      return false;
    }
    
    setIsLoading(true);
    try {
      // 1. Build the transaction using the Soroban Client
      const tx = await txBuilderFunction();
      
      // 2. Sign with Freighter
      const signedXdr = await signTransaction(tx.toXDR(), { 
        networkPassphrase: NETWORK_PASSPHRASE,
      });
      
      // 3. Submit to network
      // (The Client's AssembledTransaction can't ingest raw XDR easily without stellar-sdk, 
      // but wait, the Client itself might not have a direct submit from raw XDR)
      // Actually, since we're using generated bindings, we can do:
      const { TransactionBuilder, Networks } = await import('@stellar/stellar-sdk');
      const { server } = await import('../lib/stellar');
      
      const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
      const sendResult = await server.sendTransaction(signedTx);
      
      if (sendResult.status === 'ERROR') {
        throw new Error(JSON.stringify(sendResult.errorResult));
      }
      
      // 4. Poll for result
      let txStatus;
      console.log(`Waiting for tx: ${sendResult.hash}`);
      while (true) {
        txStatus = await server.getTransaction(sendResult.hash);
        if (txStatus.status !== 'NOT_FOUND') break;
        await new Promise(r => setTimeout(r, 1000));
      }
      
      if (txStatus.status === 'SUCCESS') {
        if (successMessage) alert(successMessage);
        await refreshData();
        return true;
      } else {
        throw new Error(`Transaction failed: ${txStatus.status}`);
      }
    } catch (error) {
      console.error("Transaction Error:", error);
      alert(`Lỗi: ${error.message || "Giao dịch thất bại"}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------
  const refreshData = useCallback(async () => {
    if (isDemoMode) {
      setFundBalance(MOCK_DATA.fundBalance);
      setAdminAddress(MOCK_DATA.adminAddress);
      setMembers(MOCK_DATA.members);
      setAllowances(MOCK_DATA.allowances);
      setTasks(MOCK_DATA.tasks);
      setTransferRequests(MOCK_DATA.transferRequests);
      return;
    }

    try {
      // Run queries in parallel
      const [
        adminRes,
        fundRes,
        membersRes,
        tasksRes
      ] = await Promise.all([
        client.getAdmin(),
        client.getFundBalance(),
        client.getAllMembers(),
        client.getAllTasks()
      ]);

      if (adminRes.result) setAdminAddress(adminRes.result.toString());
      if (fundRes.result) setFundBalance(Number(fundRes.result));
      if (membersRes.result) setMembers(membersRes.result);
      if (tasksRes.result) setTasks(tasksRes.result);

      // We need to fetch allowances and transfer requests.
      // Since our contract doesn't have `get_all_allowances`, we fetch per member
      if (membersRes.result) {
        const allowPromises = membersRes.result.map(m => client.getAllowance({ member: m.address }));
        const allowResults = await Promise.all(allowPromises);
        const validAllowances = allowResults.map(r => r.result).filter(Boolean);
        setAllowances(validAllowances);
      }
      
      // NOTE: get_transfer_request expects ID. We might need to iterate 
      // or implement get_all_transfer_requests in contract. 
      // For now, if contract lacks it, we will fetch IDs 0 to 10 speculatively or keep empty.
      // Let's assume we can fetch up to ID 5.
      const reqPromises = [0,1,2,3,4,5].map(id => client.getTransferRequest({ id }));
      const reqResults = await Promise.all(reqPromises.map(p => p.catch(() => null)));
      const validReqs = reqResults.filter(r => r && r.result).map(r => r.result);
      setTransferRequests(validReqs);

    } catch (e) {
      console.error("Error fetching Soroban data:", e);
      // Fallback or ignore if contract not initialized
    }
  }, [isDemoMode]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // ---------------------------------------------------------
  // Contract Actions (Mutations)
  // ---------------------------------------------------------
  const initContract = async () => {
    if (!walletAddress) return alert("Please connect wallet");
    await submitTx(
      () => client.initialize({ admin: walletAddress }),
      "Khởi tạo quỹ thành công!"
    );
  };

  return (
    <FamilyFundContext.Provider
      value={{
        isDemoMode,
        setIsDemoMode,
        walletAddress,
        connectWallet,
        disconnectWallet,
        isWalletConnecting,
        isLoading,
        
        fundBalance,
        setFundBalance,
        adminAddress,
        members,
        setMembers,
        allowances,
        setAllowances,
        tasks,
        setTasks,
        transferRequests,
        setTransferRequests,
        
        refreshData,
        initContract,
        client,
        submitTx,
      }}
    >
      {children}
    </FamilyFundContext.Provider>
  );
};
