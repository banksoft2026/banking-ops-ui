export interface Transaction {
  txnId: string;
  txnReference: string;
  txnCode?: string;
  accountId?: string;
  txnAmount: number;
  txnCurrency?: string;
  drCrIndicator?: 'DR' | 'CR';
  txnStatus: string;
  valueDate?: string;
  bookingDate?: string;
  createdAt?: string;
  narrative?: string;
}
