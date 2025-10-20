import { WorkoutSession } from '@/components/workout/workout-session';

// Required for static export with dynamic routes
export async function generateStaticParams(): Promise<Array<{ exercise: string }>> {
  return [
    { exercise: 'push_ups' },
    { exercise: 'marching' },
    { exercise: 'jumping_jacks' },
  ];
}

type WorkoutPageProps = {
  params: Promise<{ exercise: string }>;
};

export default async function WorkoutPage({ params }: WorkoutPageProps) {
  const { exercise } = await params;

  return <WorkoutSession exercise={exercise} discipline={undefined} />;
}
