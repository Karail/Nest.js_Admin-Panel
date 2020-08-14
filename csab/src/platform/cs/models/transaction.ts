

export enum TransactionsStatus {
    Hold = 0,
    Canceled,
    Completed
}

export type TransactionWaitMeasure = 'SECOND' | 'DATE';

export interface TransactionType {
    id: number;
    waitCount: number;
    waitMeasure: TransactionWaitMeasure;
    waitFromMomentField: string;
}

