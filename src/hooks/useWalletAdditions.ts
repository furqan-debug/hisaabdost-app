
import { useState, useEffect } from "react";
import { useWalletQueries } from "./wallet/useWalletQueries";
import { useWalletMutations } from "./wallet/useWalletMutations";
import { WalletAdditionInput } from "./wallet/types";
import { useQueryClient } from "@tanstack/react-query";

export type { WalletAddition, WalletAdditionInput } from "./wallet/types";

export function useWalletAdditions(selectedMonth?: Date) {
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const queryClient = useQueryClient();

  // Listen for wallet update events - simplified to prevent excessive refreshes
  useEffect(() => {
    const handleWalletUpdate = async () => {
      // Simple invalidation only - let staleTime handle when to refetch
      await queryClient.invalidateQueries({ queryKey: ['wallet-additions'] });
    };
    
    // Listen to essential wallet events only
    window.addEventListener('wallet-updated', handleWalletUpdate);
    
    return () => {
      window.removeEventListener('wallet-updated', handleWalletUpdate);
    };
  }, [queryClient]);

  // Use the separated query and mutation hooks with selected month
  const {
    walletAdditions,
    allWalletAdditions,
    totalAdditions,
    isLoading,
    isLoadingAll,
  } = useWalletQueries(selectedMonth);

  const {
    addFundsMutation,
    deleteFundsMutation,
    isAdding,
    isDeleting,
  } = useWalletMutations(allWalletAdditions);

  const addFunds = (addition: WalletAdditionInput) => {
    addFundsMutation.mutate(addition);
  };

  const deleteFunds = (fundId: string) => {
    console.log('Delete funds called for:', fundId);
    deleteFundsMutation.mutate(fundId);
  };

  return {
    walletAdditions,
    allWalletAdditions,
    totalAdditions,
    isLoading,
    isLoadingAll,
    addFunds,
    deleteFunds,
    isAddFundsOpen,
    setIsAddFundsOpen,
    isAdding,
    isDeleting
  };
}
