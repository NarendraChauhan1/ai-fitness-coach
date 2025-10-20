import Link from 'next/link';
import { Dumbbell, Activity, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            AI Fitness Coach
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Real-time 3D pose analysis with voice feedback
          </p>
          <Link
            href="/workout"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Start Workout
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="flex justify-center mb-4">
              <Activity className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-center mb-3">
              3D Pose Detection
            </h3>
            <p className="text-gray-600 text-center">
              Advanced AI tracks your movement in real-time with 12 body landmarks
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="flex justify-center mb-4">
              <Zap className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-center mb-3">
              Instant Feedback
            </h3>
            <p className="text-gray-600 text-center">
              Get voice corrections within 200ms when form deviates
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="flex justify-center mb-4">
              <Dumbbell className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-center mb-3">
              Multiple Exercises
            </h3>
            <p className="text-gray-600 text-center">
              Push-ups, marching, jumping jacks with discipline-specific guidance
            </p>
          </div>
        </div>

        {/* Requirements */}
        <div className="mt-16 max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-3">Requirements:</h3>
          <ul className="space-y-2 text-gray-700">
            <li>✓ Modern browser (Chrome, Edge, Safari)</li>
            <li>✓ Device camera access</li>
            <li>✓ Well-lit environment</li>
            <li>✓ Full body visible in frame</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
