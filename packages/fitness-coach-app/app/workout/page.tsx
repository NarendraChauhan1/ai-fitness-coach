import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function WorkoutSelectionPage() {
  const exercises = [
    {
      id: 'push_ups',
      name: 'Push-ups',
      description: 'Build upper body strength with proper form',
      image: '💪',
      available: true,
    },
    {
      id: 'marching',
      name: 'Marching',
      description: 'Low-impact cardio with leg lift tracking',
      image: '🚶',
      available: true,
    },
    {
      id: 'jumping_jacks',
      name: 'Jumping Jacks',
      description: 'Full-body cardio with coordination tracking',
      image: '🤸',
      available: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-700 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Select Exercise</h1>
          <p className="text-gray-600 mt-2">
            Choose an exercise to begin your workout session
          </p>
        </div>

        {/* Exercise Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl">
          {exercises.map((exercise) => (
            <div
              key={exercise.id}
              className={`bg-white rounded-xl shadow-lg p-6 ${
                exercise.available
                  ? 'cursor-pointer hover:shadow-xl transition-shadow'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              {exercise.available ? (
                <Link href={`/workout/${exercise.id}`}>
                  <div className="text-center">
                    <div className="text-6xl mb-4">{exercise.image}</div>
                    <h3 className="text-xl font-bold mb-2">{exercise.name}</h3>
                    <p className="text-gray-600 text-sm">{exercise.description}</p>
                    <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Start Exercise
                    </button>
                  </div>
                </Link>
              ) : (
                <div className="text-center">
                  <div className="text-6xl mb-4">{exercise.image}</div>
                  <h3 className="text-xl font-bold mb-2">{exercise.name}</h3>
                  <p className="text-gray-600 text-sm">{exercise.description}</p>
                  <div className="mt-4 w-full bg-gray-300 text-gray-600 py-2 rounded-lg">
                    Coming Soon
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Discipline Selection (Phase 5) */}
        <div className="mt-12 max-w-2xl bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-3">Training Discipline:</h3>
          <p className="text-sm text-gray-600 mb-4">
            Different disciplines apply different form thresholds
          </p>
          <div className="space-y-2">
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="discipline"
                value="fitness"
                defaultChecked
                className="w-4 h-4"
              />
              <span>Fitness (Strict form requirements)</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="discipline"
                value="yoga"
                className="w-4 h-4"
              />
              <span>Yoga (Relaxed thresholds)</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="discipline"
                value="general"
                className="w-4 h-4"
              />
              <span>General (Moderate guidance)</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
