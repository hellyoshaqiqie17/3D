import { redirect } from 'next/navigation';

export default function DashboardUploadsPage() {
  redirect('/dashboard?tab=skp-library');
}
