export interface Account {
  accountId: string;
  accountNumber: string;
  accountType: string;
  accountStatus: string;
  customerId?: string;
  customerName?: string;
  branchCode?: string;
  currencyCode?: string;
  openDate?: string;
  closeDate?: string;
  createdAt?: string;
}

export interface AccountBalance {
  accountId: string;
  availableBalance: number;
  ledgerBalance: number;
  earmarkedAmount?: number;
  uncollectedAmount?: number;
  overdraftLimit?: number;
  currencyCode?: string;
  balanceAsAt?: string;
}
