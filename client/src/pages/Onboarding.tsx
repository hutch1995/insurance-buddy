import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Onboarding is now handled via a modal in Layout.
// This route redirects to dashboard where the modal will appear if needed.
export default function Onboarding() {
  const navigate = useNavigate()
  useEffect(() => { navigate('/dashboard', { replace: true }) }, [navigate])
  return null
}
