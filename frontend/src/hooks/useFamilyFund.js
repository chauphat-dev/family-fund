import { useContext } from 'react';
import { FamilyFundContext } from '../context/FamilyFundContext';

export const useFamilyFund = () => {
  const context = useContext(FamilyFundContext);
  if (context === undefined) {
    throw new Error('useFamilyFund must be used within a FamilyFundProvider');
  }
  return context;
};
