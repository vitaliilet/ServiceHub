
import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import NotificationBell from './NotificationBell.jsx'
import { MessageCircle } from './MessageIcon.jsx'
import './SpecialistProfile.css'
import BookingForm from './BookingForm'
function SpecialistProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(response => response.ok ? response.json() : null)
      .then(setUser)
      .catch(() => setUser(null))
  }, [])

  const handleLogout = async () => {
    try {
      const csrfResponse = await fetch('/api/auth/csrf', { credentials: 'include' })
      if (!csrfResponse.ok) throw new Error('Could not get CSRF token')
      const csrf = await csrfResponse.json()
      const response = await fetch('/api/auth/logout', {
        method: 'POST', credentials: 'include',
        headers: { [csrf.headerName]: csrf.token }
      })
      if (!response.ok) throw new Error('Logout failed')
      setUser(null)
      navigate('/')
    } catch (error) {
      alert('Could not sign out. Please try again.')
    }
  }

  const [person, setPerson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showBooking, setShowBooking] = useState(false)
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  useEffect(() => {
    fetch('/api/specialists')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load profile')
        }
        return response.json()
      })
      .then(data => {
        const found = data.find(
          item => String(item.id) === id
        )

        if (!found) {
          throw new Error('Professional not found')
        }

        setPerson(found)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

useEffect(() => {
  setReviewsLoading(true)

  fetch(`/api/reviews/specialist/${id}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to load reviews')
      }
      return response.json()
    })
    .then(data => setReviews(data))
    .catch(error => {
      console.error(error)
      setReviews([])
    })
    .finally(() => setReviewsLoading(false))
}, [id])

  if (loading) {
    return <div className="profile-status">Loading profile...</div>
  }

  if (error) {
    return (
      <div className="profile-status">
        <h2>{error}</h2>
        <Link to="/" className="sh-return-link">Back to Home</Link>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <header className="profile-navbar">
        <Link to="/" className="profile-logo">
          Service<span>Hub</span>
        </Link>
        <div className="profile-nav-actions">
          {user ? (
            <>
              <span className="profile-nav-greeting">Hi, {user.name}</span>
              {user.role === 'PROFESSIONAL' && <Link className="profile-nav-btn" to="/professional/dashboard">Profile</Link>}
              {user.role === 'CLIENT' && <Link className="profile-nav-btn" to="/profile">Profile</Link>}
              <Link className="profile-nav-btn" to="/my-bookings">My Bookings</Link>
              {user.role === 'ADMIN' && <Link className="profile-nav-btn" to="/admin">Admin</Link>}
              <Link className="profile-nav-icon" to="/messages" aria-label="Messages" title="Messages"><MessageCircle /></Link>
              <NotificationBell />
              <button className="profile-nav-btn profile-nav-logout" type="button" onClick={handleLogout}>Log Out</button>
            </>
          ) : <Link className="profile-nav-btn" to="/login">Sign In</Link>}
        </div>
      </header>

      <main className="profile-container">
        <Link to="/" className="profile-back sh-return-link">
          ← Browse Professionals
        </Link>

        <div className="profile-layout">
          <section className="profile-main">
            <div className="profile-intro">
              <img
                src={person.imageUrl || `/professionals/${person.id}.jpg`}
                alt={person.name}
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.src = '/default-avatar.svg'
                }}
                className="profile-photo"
              />

              <div>
                <span className="profile-category">
                  {person.service}
                </span>

                <h1>{person.name}</h1>

                <p className="profile-city">
                  📍 {person.city}
                </p>

                <div className="profile-stats">

<span>
  {reviewsLoading ? (
    "Loading rating..."
  ) : reviews.length > 0 ? (
    <>
      <span style={{ color: "#f59e0b" }}>★</span>{" "}
      {(
        reviews.reduce((sum, review) => sum + review.rating, 0) /
        reviews.length
      ).toFixed(1)}
      <small>
        {" "}({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
      </small>
    </>
  ) : (
    <>
      <span style={{ color: "#9ca3af" }}>☆</span>{" "}
      <small>No reviews yet</small>
    </>
  )}
</span>


                  <span className={`profile-experience-badge ${Number(person.experience) >= 10 ? 'profile-experience-gold' : Number(person.experience) >= 6 ? 'profile-experience-purple' : Number(person.experience) >= 3 ? 'profile-experience-green' : 'profile-experience-gray'}`}>
                    {person.experience} years experience
                  </span>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h2>About This Professional</h2>
              <p>{person.description}</p>
            </div>

<div className="profile-section">
  <h2>Customer Reviews</h2>

  {reviewsLoading ? (
    <p>Loading reviews...</p>
  ) : reviews.length === 0 ? (
    <p>No reviews yet. Be the first to leave a review!</p>
  ) : (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {reviews.map((review) => (
        <div
          key={review.id}
          style={{
            padding: 20,
            backgroundColor: "#202a44",
            borderRadius: 12,
            border: "1px solid #35415e",
            color: "#e9edff"
          }}
        >
          <div
            style={{
              color: "#f59e0b",
              fontSize: 22,
              marginBottom: 10
            }}
          >
            {"★".repeat(review.rating)}
            <span style={{ color: "#d1d5db" }}>
              {"★".repeat(5 - review.rating)}
            </span>
          </div>

          <p style={{ margin: 0, lineHeight: 1.6, color: "#e9edff" }}>
            {review.comment}
          </p>
        </div>
      ))}
    </div>
  )}
</div>

            <div className="profile-section">
              <h2>Services Offered</h2>
              <p>{person.service}</p>
            </div>
          </section>

          <aside className="booking-panel">
            <p>Starting from</p>
            <h2>${person.price}</h2>

            <div className="booking-divider" />

            <p>Ready to get started?</p>

            <button
              type="button"
              onClick={() => setShowBooking(true)}
            >
              Book Now
            </button>


          </aside>
        </div>
           </main>

           {showBooking && (
             <BookingForm
               specialist={person}
               onClose={() => setShowBooking(false)}
             />
           )}
         </div>
       )
     }


export default SpecialistProfile
