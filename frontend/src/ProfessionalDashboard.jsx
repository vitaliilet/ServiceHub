import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './ProfessionalDashboard.css';
function ProfessionalDashboard() {
  const [profile, setProfile] = useState(null)
  const [daysOff, setDaysOff] = useState([])
  const [newDayOff, setNewDayOff] = useState('')
  const [dayOffLoading, setDayOffLoading] = useState(false)
  const [dayOffMessage, setDayOffMessage] = useState('')
  const [workStartHour, setWorkStartHour] = useState(8)
  const [workEndHour, setWorkEndHour] = useState(17)
  const [bookings, setBookings] = useState([])
  const [bookingFilter, setBookingFilter] = useState('ALL')
  const [bookingSearch, setBookingSearch] = useState('')
  const [bookingSort, setBookingSort] = useState('newest')
  const [expandedBookingId, setExpandedBookingId] = useState(null)
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewsError, setReviewsError] = useState('')
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [bookingsError, setBookingsError] = useState('')
  const [editing, setEditing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    name: '',
    city: '',
    service: '',
    price: 0,
    experience: 0,
    description: ''
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
const [saving, setSaving] = useState(false)
const [saveMessage, setSaveMessage] = useState('')
const [photoFile, setPhotoFile] = useState(null)
const [photoUploading, setPhotoUploading] = useState(false)
const [photoMessage, setPhotoMessage] = useState('')
    const loadDaysOff = async () => {
      try {
        const response = await fetch('/api/professionals/me/days-off', {
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error('Failed to load days off')
        }

        const data = await response.json()
        setDaysOff(data)
      } catch (error) {
        console.error('Error loading days off:', error)
      }
    }
const addDayOff = async () => {
  if (!newDayOff || dayOffLoading) return

  setDayOffLoading(true)
  setDayOffMessage('')

  try {
    const csrfResponse = await fetch('/api/auth/csrf', {
      credentials: 'include'
    })

    if (!csrfResponse.ok) {
      throw new Error('Could not get security token')
    }

    const csrf = await csrfResponse.json()

    const response = await fetch(
      `/api/professionals/me/days-off?date=${encodeURIComponent(newDayOff)}`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          [csrf.headerName]: csrf.token
        }
      }
    )

    if (!response.ok) {
      const message = await response.text()
      throw new Error(message || 'Failed to add day off')
    }

    setDayOffMessage('Day off added successfully!')
    setNewDayOff('')
    await loadDaysOff()
  } catch (error) {
    setDayOffMessage(error.message)
  } finally {
    setDayOffLoading(false)
  }
}
const deleteDayOff = async (id) => {
  if (!window.confirm('Are you sure you want to delete this day off?')) {
    return
  }

  setDayOffMessage('')

  try {
    const csrfResponse = await fetch('/api/auth/csrf', {
      credentials: 'include'
    })

    if (!csrfResponse.ok) {
      throw new Error('Could not get security token')
    }

    const csrf = await csrfResponse.json()

    const response = await fetch(`/api/professionals/me/days-off/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        [csrf.headerName]: csrf.token
      }
    })

    if (!response.ok) {
      const message = await response.text()
      throw new Error(message || 'Failed to delete day off')
    }

    setDayOffMessage('Day off deleted successfully!')
    await loadDaysOff()

  } catch (error) {
    setDayOffMessage(error.message)
  }
}
    const completeBooking = async (bookingId) => {
      if (!window.confirm('Mark this booking as completed?')) {
        return
      }

  try {
    const csrfResponse = await fetch('/api/auth/csrf', {
      credentials: 'include'
    })

    if (!csrfResponse.ok) {
      throw new Error('Could not get security token')
    }

    const csrf = await csrfResponse.json()

    const response = await fetch(
      `/api/professionals/bookings/${bookingId}/complete`,
      {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          [csrf.headerName]: csrf.token
        }
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.message || 'Failed to complete booking')
    }

    setBookings(previousBookings =>
      previousBookings.map(booking =>
        booking.id === bookingId
          ? { ...booking, status: 'COMPLETED' }
          : booking
      )
    )

  } catch (error) {
    alert(error.message)
  }
}
const cancelBooking = async (bookingId) => {
  if (!window.confirm('Are you sure you want to cancel this booking?')) {
    return
  }

  try {
    const csrfResponse = await fetch('/api/auth/csrf', {
      credentials: 'include'
    })

    if (!csrfResponse.ok) {
      throw new Error('Could not initialize security token')
    }

    const csrf = await csrfResponse.json()

    const response = await fetch(
      `/api/professionals/bookings/${bookingId}/cancel`,
      {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          [csrf.headerName]: csrf.token
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to cancel booking')
    }

    setBookings(previousBookings =>
      previousBookings.map(booking =>
        booking.id === bookingId
          ? { ...booking, status: 'CANCELLED' }
          : booking
      )
    )

  } catch (error) {
    alert(error.message)
  }
}
const createProfile = async () => {
  setSaving(true)
  setSaveMessage('')

  try {
    const csrfResponse = await fetch('/api/auth/csrf', {
      credentials: 'include'
    })

    if (!csrfResponse.ok) {
      throw new Error('Could not initialize security token')
    }

    const csrf = await csrfResponse.json()

    const response = await fetch('/api/professionals/me', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        [csrf.headerName]: csrf.token
      },
      body: JSON.stringify({
        ...form,
        price: Number(form.price),
        experience: Number(form.experience),
        workStartHour: workStartHour,
        workEndHour: workEndHour
      })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to create profile')
    }

    const profileResponse = await fetch('/api/professionals/me', {
      credentials: 'include'
    })

    if (!profileResponse.ok) {
      throw new Error('Profile created, but could not load it')
    }

    const newProfile = await profileResponse.json()

    setProfile(newProfile)
    setForm({
      name: newProfile.name || '',
      city: newProfile.city || '',
      service: newProfile.service || '',
      price: newProfile.price ?? 0,
      experience: newProfile.experience ?? 0,
      description: newProfile.description || ''
    })
    setCreating(false)
    setEditing(false)
    setSaveMessage('Profile created successfully!')
  } catch (error) {
    setSaveMessage(error.message)
  } finally {
    setSaving(false)
  }
}
const saveProfile = async () => {
  setSaving(true)
  setSaveMessage('')

  try {
    const csrfResponse = await fetch('/api/auth/csrf', {
      credentials: 'include'
    })

    if (!csrfResponse.ok) {
      throw new Error('Could not initialize security token')
    }

    const csrf = await csrfResponse.json()
if (workStartHour >= workEndHour) {
  setError('Work end time must be later than start time.')
  return
}
    const response = await fetch('/api/professionals/me', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        [csrf.headerName]: csrf.token
      },
      body: JSON.stringify({
        ...form,
        price: Number(form.price),
        experience: Number(form.experience),
        workStartHour: workStartHour,
        workEndHour: workEndHour
      })
    })

    if (!response.ok) {
      throw new Error('Failed to save profile')
    }

    const updatedResponse = await fetch('/api/professionals/me', {
      credentials: 'include'
    })

    if (!updatedResponse.ok) {
      throw new Error('Profile saved, but could not reload it')
    }

    const updatedProfile = await updatedResponse.json()
    setProfile(updatedProfile)
    setEditing(false)
    setSaveMessage('Profile updated successfully!')
  } catch (error) {
    setSaveMessage(error.message)
  } finally {
    setSaving(false)
  }
}
const loadReviews = async (specialistId) => {
  setReviewsLoading(true)
  setReviewsError('')

  try {
    const response = await fetch(
      `/api/reviews/specialist/${specialistId}`
    )

    if (!response.ok) {
      throw new Error('Failed to load reviews')
    }

    const data = await response.json()
    setReviews(data)
  } catch (error) {
    setReviewsError(error.message)
  } finally {
    setReviewsLoading(false)
  }
}
const uploadPhoto = async () => {
  if (!photoFile) {
    setPhotoMessage('Please select a photo first')
    return
  }

  setPhotoUploading(true)
  setPhotoMessage('')

  try {
    const csrfResponse = await fetch('/api/auth/csrf', {
      credentials: 'include'
    })

    if (!csrfResponse.ok) {
      throw new Error('Could not get security token')
    }

    const csrf = await csrfResponse.json()

    const formData = new FormData()
    formData.append('file', photoFile)

    const response = await fetch('/api/professionals/me/photo', {
      method: 'POST',
      credentials: 'include',
      headers: {
        [csrf.headerName]: csrf.token
      },
      body: formData
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data.message || 'Failed to upload photo')
    }

    setProfile(previous => ({
      ...previous,
      imageUrl: data.imageUrl
    }))

    setPhotoFile(null)
    setPhotoMessage('Photo uploaded successfully!')
  } catch (error) {
    setPhotoMessage(error.message)
  } finally {
    setPhotoUploading(false)
  }
}
useEffect(() => {
  loadDaysOff()
}, [])
    useEffect(() => {
      fetch('/api/professionals/bookings', {
          credentials: 'include'
        })
          .then(async response => {
            if (!response.ok) {
              throw new Error('Could not load bookings')
            }

            return response.json()
          })
          .then(data => {
            setBookings(data)
          })
          .catch(error => {
            setBookingsError(error.message)
          })
                  .finally(() => {
                    setBookingsLoading(false)
                  })
            }, [])

            useEffect(() => {
              fetch('/api/professionals/me', {
      credentials: 'include'
    })
      .then(async response => {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Professional access required')
        }
if (response.status === 404) {
  setCreating(true)
  return null
}
        if (!response.ok) {
          throw new Error('Could not load your profile')
        }

        return response.json()
      })
      .then(data => {
        if (!data) return
        setProfile(data)
        setWorkStartHour(data.workStartHour ?? 8)
        setWorkEndHour(data.workEndHour ?? 17)
        if (data.id) {
          loadReviews(data.id)
        }
        setForm({
          name: data.name || '',
          city: data.city || '',
          service: data.service || '',
          price: data.price ?? 0,
          experience: data.experience ?? 0,
          description: data.description || ''
        })
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div
      className="dashboard-dark"
      style={{
        width: '100%',
        maxWidth: 1440,
        margin: '0 auto',
        padding: '40px clamp(16px, 4vw, 64px) 80px',
        boxSizing: 'border-box',
        minHeight: '100vh'
      }}
    >
      <div className="dashboard-header">
        <div>
          <Link to="/" className="dashboard-back sh-return-link">
            ← Back to Home
          </Link>

          <div className="dashboard-heading">
            <div>
              <span className="dashboard-eyebrow">
                PROFESSIONAL PROFILE
              </span>

              <h1>Welcome back{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''} 👋</h1>

              <p>
                Manage your profile, bookings and reviews.
              </p>
            </div>

            <span className="dashboard-status">
              <span className="dashboard-status-dot" />
              Your workspace
            </span>
          </div>
        </div>
      </div>
      <div className="dashboard-stats">
        {[
          ['Total Bookings', bookings.length],
          ['Active Bookings', bookings.filter(b => b.status === 'CONFIRMED').length],
          ['Completed', bookings.filter(b => b.status === 'COMPLETED').length],
          ['Cancelled', bookings.filter(b => b.status === 'CANCELLED').length]
        ].map(([label, value]) => (
          <div key={label} className="dashboard-stat-card">
            <p className="dashboard-stat-label">{label}</p>

            <div className="dashboard-stat-value">
              {bookingsLoading ? '...' : value}
            </div>
          </div>
        ))}
      </div>

      {loading && <p>Loading your profile...</p>}
      {creating && !loading && (
        <div className="dashboard-create-card" style={{
          background: '#fff',
          padding: 24,
          borderRadius: 16,
          marginTop: 24,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <h2>Create Your Professional Profile</h2>
          <p>
            Complete your profile to start offering services
            and receiving bookings.
          </p>

          <button
            type="button"
            onClick={() => setEditing(true)}
            className="dashboard-create-button"
            style={{
              padding: '12px 20px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Create Profile
          </button>
          {editing && (
            <div className="dashboard-edit-form">

              {[
                ['name', 'Full Name'],
                ['city', 'City'],
                ['service', 'Service'],
                ['price', 'Starting Price ($)'],
                ['experience', 'Years of Experience']
              ].map(([field, label]) => (
                <label key={field} className="dashboard-form-field">
                  {label}
                  <input
                    type={['price', 'experience'].includes(field) ? 'number' : 'text'}
                    min={['price', 'experience'].includes(field) ? 0 : undefined}
                    value={form[field]}
                    onChange={e => setForm({
                      ...form,
                      [field]: e.target.value
                    })}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: 12,
                      marginTop: 6,
                      border: '1px solid #ddd',
                      borderRadius: 8,
                      boxSizing: 'border-box'
                    }}
                  />
                </label>
              ))}

              <label className="dashboard-description-field" style={{ fontWeight: 600 }}>
                Description
                <textarea
                className="dashboard-description-input"
                  value={form.description}
                  onChange={e => setForm({
                    ...form,
                    description: e.target.value
                  })}
                  rows={4}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: 12,
                    marginTop: 6,
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    boxSizing: 'border-box'
                  }}
                />
                            </label>

                            <button
                              type="button"
                              onClick={createProfile}
                              className="dashboard-save-button"
                              disabled={saving}
                              style={{
                                padding: '14px 24px',
                                background: '#16a34a',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 8,
                                cursor: saving ? 'not-allowed' : 'pointer',
                                fontWeight: 600,
                                opacity: saving ? 0.6 : 1
                              }}
                            >
                              {saving ? 'Creating...' : 'Save Profile'}
                            </button>

                            {saveMessage && (
                              <p style={{ color: '#dc2626' }}>
                                {saveMessage}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {profile && (
        <div
          className="dashboard-profile-card"
          style={{ marginTop: 24 }}
        >
          <h2>{profile.name}</h2>

<div className="dashboard-photo-section">
  <img
    src={profile.imageUrl || '/default-avatar.svg'}
    alt={profile.name}
    onError={e => {
      e.currentTarget.onerror = null
      e.currentTarget.src = '/default-avatar.svg'
    }}
    style={{
      width: 120,
      height: 120,
      borderRadius: '50%',
      objectFit: 'cover',
      border: '3px solid #e5e7eb',
      display: 'block',
      marginBottom: 16
    }}
  />

  <input
    type="file"
    accept="image/jpeg,image/png"
    onChange={e => {
      setPhotoFile(e.target.files[0] || null)
      setPhotoMessage('')
    }}
  />

  <button
    type="button"
    onClick={uploadPhoto}
    className="dashboard-upload-button"
    disabled={!photoFile || photoUploading}
    style={{
      display: 'block',
      marginTop: 12,
      padding: '10px 20px',
      background: '#2563eb',
      color: 'white',
      border: 'none',
      borderRadius: 8,
      cursor: photoUploading ? 'wait' : 'pointer',
      opacity: !photoFile || photoUploading ? 0.6 : 1
    }}
  >
    {photoUploading ? 'Uploading...' : 'Upload Photo'}
  </button>

  {photoMessage && (
    <p style={{ marginTop: 10 }}>{photoMessage}</p>
  )}
</div>

          <div className="dashboard-profile-details">
            <div className="dashboard-detail-item">
              <span>LOCATION</span>
              <strong>📍 {profile.city}</strong>
            </div>

            <div className="dashboard-detail-item">
              <span>SERVICE</span>
              <strong>{profile.service}</strong>
            </div>

            <div className="dashboard-detail-item">
              <span>STARTING PRICE</span>
              <strong>${profile.price}</strong>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditing(!editing)}
            className="dashboard-edit-button"
          >
            {editing ? '✕ Cancel Editing' : '✎ Edit Profile'}
          </button>
          {editing && (
            <div className="dashboard-edit-form">
              {[
                ['name', 'Full Name'],
                ['city', 'City'],
                ['service', 'Service'],
                ['price', 'Starting Price ($)'],
                ['experience', 'Years of Experience']
              ].map(([field, label]) => (
                <label key={field} style={{ fontWeight: 600 }}>
                  {label}
                  <input
                    type={['price', 'experience'].includes(field) ? 'number' : 'text'}
                    min={['price', 'experience'].includes(field) ? 0 : undefined}
                    value={form[field]}
                    onChange={e => setForm({
                      ...form,
                      [field]: e.target.value
                    })}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: 12,
                      marginTop: 6,
                      border: '1px solid #ddd',
                      borderRadius: 8,
                      boxSizing: 'border-box'
                    }}
                  />
                </label>
              ))}

              <label
                className="dashboard-description-field"
                style={{ fontWeight: 600 }}
              >
                Description
                <textarea
                  value={form.description}
                  onChange={e => setForm({
                    ...form,
                    description: e.target.value
                  })}
                  rows={4}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: 12,
                    marginTop: 6,
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    boxSizing: 'border-box'
                  }}
                />
              </label>
              <div className="dashboard-work-hours">
                <label>
                  Work Start
                  <select
                    value={workStartHour}
                    onChange={e => setWorkStartHour(Number(e.target.value))}
                  >
                    {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                      <option key={hour} value={hour}>
                        {String(hour).padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Work End
                  <select
                    value={workEndHour}
                    onChange={e => setWorkEndHour(Number(e.target.value))}
                  >
                    {Array.from({ length: 24 }, (_, i) => i + 1).map(hour => (
                      <option key={hour} value={hour}>
                        {String(hour).padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                type="button"
                className="dashboard-save-button"
                onClick={saveProfile}
                disabled={saving}
                style={{
                  padding: '14px 24px',
                  background: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: 600
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>

              {saveMessage && (
                <p style={{ color: '#2563eb' }}>
                  {saveMessage}
                </p>
              )}
            </div>
          )}
        </div>
      )}
{profile && (
  <section className="dashboard-days-off" style={{
    marginTop: 40,
    padding: 24,
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
  }}>
    <h2>📅 My Days Off</h2>
<div style={{
  display: 'flex',
  gap: 12,
  alignItems: 'center',
  flexWrap: 'wrap',
  marginBottom: 20
}}>
  <input
  className="dashboard-date-input"
    type="date"
    value={newDayOff}
    min={new Date().toLocaleDateString('en-CA')}
    onChange={e => setNewDayOff(e.target.value)}
    style={{
      padding: '10px 14px',
      border: '1px solid #d1d5db',
      borderRadius: 8,
      fontSize: 15
    }}
  />

  <button
    type="button"
    className="dashboard-add-day-button"
    onClick={addDayOff}
    disabled={!newDayOff || dayOffLoading}
    style={{
      padding: '11px 20px',
      background: '#2563eb',
      color: 'white',
      border: 'none',
      borderRadius: 8,
      cursor: 'pointer',
      opacity: !newDayOff || dayOffLoading ? 0.5 : 1
    }}
  >
    Add Day Off
  </button>
</div>
{dayOffMessage && (
  <p style={{
    marginTop: 12,
    color: dayOffMessage === 'Day off added successfully!'
      ? '#16a34a'
      : '#dc2626',
    fontWeight: 500
  }}>
    {dayOffMessage}
  </p>
)}
    {daysOff.length === 0 ? (
      <p>No days off scheduled.</p>
    ) : (
      <ul>
        {daysOff.map(day => (
          <li
            key={day.id}
            style={{
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}
          >
            <span className="dashboard-day-date">
              📅 {day.dayOff}
            </span>

            <button
            className="dashboard-delete-day-button"
              type="button"
              onClick={() => deleteDayOff(day.id)}
              style={{
                padding: '6px 12px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer'
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    )}
  </section>
)}
{profile && (
  <section className="dashboard-reviews" style={{
      marginTop: 40,
      padding: 24,
      background: "#fff",
      borderRadius: 16,
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
    }}
  >
    <h2>⭐ My Reviews</h2>

    {reviewsLoading ? (
      <p>Loading reviews...</p>
    ) : reviewsError ? (
      <p style={{ color: "#dc2626" }}>{reviewsError}</p>
    ) : reviews.length === 0 ? (
      <p>No reviews yet.</p>
    ) : (
      <>
        <h3 className="dashboard-average-rating">
          ★{" "}
          {(
            reviews.reduce((sum, review) => sum + review.rating, 0) /
            reviews.length
          ).toFixed(1)}
          {" "}({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
        </h3>

        {reviews.map((review) => (
          <div
            key={review.id}
            className="dashboard-review-card"
          >
            <div className="dashboard-review-stars">
              {"★".repeat(review.rating)}
              <span>
                {"★".repeat(5 - review.rating)}
              </span>
            </div>

            <p className="dashboard-review-comment">
              {review.comment}
            </p>
          </div>
        ))}
      </>
    )}
  </section>
)}

  <section className="dashboard-bookings-section">
    <div className="dashboard-bookings-toolbar">
      <h2 style={{ margin: 0 }}>
        My Bookings (
        {bookings.filter(booking =>
          (bookingFilter === 'ALL' || booking.status === bookingFilter) &&
          (
            String(booking.id).includes(bookingSearch.trim().replace(/^#/, '')) ||
            (booking.customerName || '')
              .toLowerCase()
              .includes(bookingSearch.trim().toLowerCase())
          )
        ).length}
        )
      </h2>
     <input
       type="text"
       className="dashboard-booking-search"
       placeholder="🔍 Search by ID or client name..."
       value={bookingSearch}
       onChange={e => setBookingSearch(e.target.value)}
     />
      {bookingSearch && (
        <button
          type="button"
          onClick={() => setBookingSearch('')}
          className="dashboard-search-clear"
        >
          ✕ Clear
        </button>
      )}
<select
  className="dashboard-booking-filter"
  value={bookingFilter}
  onChange={e => setBookingFilter(e.target.value)}
>
  <option value="ALL">All Bookings</option>
  <option value="CONFIRMED">Active</option>
  <option value="COMPLETED">Completed</option>
  <option value="CANCELLED">Cancelled</option>
</select>
<select
  className="dashboard-booking-sort"
  value={bookingSort}
  onChange={e => setBookingSort(e.target.value)}
>
  <option value="newest">Newest First</option>
  <option value="oldest">Oldest First</option>
</select>
</div>
    {bookingsLoading && <p>Loading bookings...</p>}

    {bookingsError && (
      <p style={{ color: 'red' }}>{bookingsError}</p>
    )}

    {!bookingsLoading && !bookingsError && bookings.length === 0 && (
      <p>No bookings yet.</p>
    )}

{!bookingsLoading &&
  !bookingsError &&
  bookings.length > 0 &&
  bookings.filter(booking =>
    (bookingFilter === 'ALL' || booking.status === bookingFilter) &&
    (
      String(booking.id).includes(bookingSearch.trim().replace(/^#/, '')) ||
      (booking.customerName || '')
        .toLowerCase()
        .includes(bookingSearch.trim().toLowerCase())
    )
  ).length === 0 && (
    <p style={{
      padding: 24,
      background: '#fff',
      borderRadius: 12,
      color: '#64748b',
      textAlign: 'center'
    }}>
      No bookings found for this filter.
    </p>
  )}

    {bookings
      .filter(booking =>
        (bookingFilter === 'ALL' || booking.status === bookingFilter) &&
        (
          String(booking.id).includes(bookingSearch.trim().replace(/^#/, '')) ||
          (booking.customerName || '')
            .toLowerCase()
            .includes(bookingSearch.trim().toLowerCase())
        )
      )
      .sort((a, b) => {
        const dateA = new Date(`${a.bookingDate}T${a.bookingTime}`)
        const dateB = new Date(`${b.bookingDate}T${b.bookingTime}`)

        return bookingSort === 'newest'
          ? dateB - dateA
          : dateA - dateB
      })
      .map(booking => (
      <div
        key={booking.id}
        className="dashboard-booking-card"
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap'
        }}>
          <h3 className="dashboard-booking-title">
            Booking <span>#{booking.id}</span>
          </h3>

          <span className={`dashboard-booking-status status-${booking.status.toLowerCase()}`}>
            <span className="dashboard-booking-status-dot" />
            {booking.status}
          </span>
        </div>
        <p className="dashboard-booking-date">
          <span>📅 {booking.bookingDate}</span>
          <span>🕒 {booking.bookingTime?.slice(0, 5)}</span>
        </p>
        <p className="dashboard-booking-client">
          👤 <strong>Client:</strong> {booking.customerName}
        </p>
        <button
          type="button"
          onClick={() =>
            setExpandedBookingId(previous =>
              previous === booking.id ? null : booking.id
            )
          }
      className="dashboard-booking-details-button"
          style={{
            padding: '8px 14px',
            background: '#eff6ff',
            color: '#2563eb',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600,
            marginBottom: 12
          }}
        >
          {expandedBookingId === booking.id ? 'Hide Details' : 'View Details'}
        </button>
{expandedBookingId === booking.id && (
  <div className="dashboard-booking-expanded">
        <p>
          <strong>Email:</strong>{' '}
          <a
            href={`mailto:${booking.customerEmail}`}
            style={{
              color: '#2563eb',
              textDecoration: 'underline',
              fontWeight: 600
            }}
          >
            {booking.customerEmail}
          </a>
        </p>


        {booking.description && (
          <p><strong>Description:</strong> {booking.description}</p>
        )}
      </div>
    )}
    {booking.status === 'CONFIRMED' && (
      <button
        type="button"
        onClick={() => cancelBooking(booking.id)}
        className="dashboard-cancel-button"
      >
    Cancel Booking
  </button>
)}

{booking.status === 'CONFIRMED' &&
  new Date(new Date(`${booking.bookingDate}T${booking.bookingTime}`).getTime() + 60 * 60 * 1000) <= new Date() && (
    <button
      type="button"
      onClick={() => completeBooking(booking.id)}
      className="dashboard-complete-button"
    >
      Mark as Completed
    </button>
  )}

</div>
    ))}
  </section>
    </div>
  )
}

export default ProfessionalDashboard
