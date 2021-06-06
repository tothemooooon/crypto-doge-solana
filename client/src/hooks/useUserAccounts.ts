import { TokenAccount } from "../models/account";
import { useAccountsContext } from "./../contexts/accounts";

export function useUserAccounts() {
  const context = useAccountsContext();
  return {
    userAccounts: context.userAccounts as TokenAccount[],
  };
}
