import { useState, useEffect } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { getProfile } from '../lib/api'
import OnboardingModal from './OnboardingModal'

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/expenses', label: 'Expenses' },
  { to: '/profile', label: 'Profile' },
]

export default function Layout() {
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    getProfile().then((profile) => {
      if (profile && !profile.onboarding_completed) setShowOnboarding(true)
    })
  }, [])

  return (
    <div className="min-h-screen flex bg-gray-50">
      {showOnboarding && <OnboardingModal onComplete={() => setShowOnboarding(false)} />}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col py-6 px-4">
        <div className="mb-8">
          <span className="text-xl font-bold text-indigo-600">Insurance Buddy</span>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
