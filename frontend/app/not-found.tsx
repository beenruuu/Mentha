import NotFoundContent from '@/components/shared/NotFoundContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 - Page Not Found | Mentha',
  description: 'The page you are looking for does not exist.',
};

export default function NotFound() {
  return <NotFoundContent />;
}
