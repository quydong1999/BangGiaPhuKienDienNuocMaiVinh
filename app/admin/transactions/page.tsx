import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import TransactionsClient from './TransactionsClient';

export const metadata = {
  title: 'Lịch sử giao dịch',
};

export default async function TransactionsPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    redirect('/');
  }

  return <TransactionsClient />;
}
