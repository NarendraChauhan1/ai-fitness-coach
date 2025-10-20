import { WorkoutSession } from '@/components/workout/workout-session';

// Required for static export with dynamic routes
export function generateStaticParams() {
  return [
    { exercise: 'push_ups' },
    { exercise: 'marching' },
    { exercise: 'jumping_jacks' },
  ];
}

interface PageProps {
  params: {
    exercise: string;
  };
  searchParams?: {
    discipline?: string;
  };
}

export default function WorkoutPage({ params, searchParams }: PageProps) {
  return <WorkoutSession exercise={params.exercise} discipline={searchParams?.discipline} />;
}
