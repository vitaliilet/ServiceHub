
import { useEffect, useState } from 'react'
import './BookingForm.css'
const allTimes = Array.from(
  { length: 24 },
  (_, hour) => `${String(hour).padStart(2, '0')}:00`
)

function BookingForm({ specialist, onClose }) {
  const [date, setDate] = useState('')
  const [daysOff, setDaysOff] = useState([])
  const [time, setTime] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [bookedTimes, setBookedTimes] = useState([])
  const [timesLoading, setTimesLoading] = useState(false)
  const [timesError, setTimesError] = useState('')

  const loadDaysOff = async (specialistId) => {
    try {
      const response = await fetch(
        `/api/bookings/days-off?specialistId=${specialistId}`,
        { credentials: 'include' }
      )

      if (!response.ok) {
        throw new Error('Failed to load days off')
      }

      const data = await response.json()
      setDaysOff(data)
    } catch (error) {
      console.error('Error loading days off:', error)
    }
  }

  useEffect(() => {
    if (specialist?.id) {
      loadDaysOff(specialist.id)
    } else {
      setDaysOff([])
    }
  }, [specialist?.id])

  useEffect(() => {
    if (!date) {
      setBookedTimes([])
      setTimesError('')
      return
    }
    const controller = new AbortController()

    async function loadBookedTimes() {
      setTimesLoading(true)
      setTimesError('')
      setBookedTimes([])

      try {
        const response = await fetch(
          `/api/bookings/availability?specialistId=${specialist.id}&date=${date}`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error('Failed to load available times.')
        }

        const data = await response.json()
        console.log('Booked times from backend:', data)
        if (!controller.signal.aborted) {
          setBookedTimes(data)
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setTimesError(error.message)
        }
      } finally {
        if (!controller.signal.aborted) {
          setTimesLoading(false)
        }
      }
    }

    loadBookedTimes()

    return () => controller.abort()
  }, [date, specialist.id])
  const today = new Date()
  const minDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-')

  async function handleSubmit(event) {
    event.preventDefault()
    if (loading) return
    setMessage('')
    if (bookedTimes.includes(time)) {
      setMessage('This time slot is already booked. Please choose another time.')
      return
    }
if (daysOff.includes(date)) {
  setMessage('This specialist is unavailable on the selected date.')
  return
}
    const day = new Date(`${date}T12:00:00`).getDay()

    if (day === 0 || day === 6) {
      setMessage('Please choose Monday to Friday.')
      return
    }

    setLoading(true)


try {
  const csrfResponse = await fetch('/api/auth/csrf', {
    credentials: 'include'
  });

  if (!csrfResponse.ok) {
    throw new Error('Failed to get security token.');
  }

  const csrf = await csrfResponse.json();

  const response = await fetch('/api/bookings', {


method: 'POST',
credentials: 'include',
headers: {
  'Content-Type': 'application/json',
  [csrf.headerName]: csrf.token
},

        body: JSON.stringify({
          specialistId: specialist.id,
          customerName: name,
          customerEmail: email,
          bookingDate: date,
          bookingTime: time,
          description
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Booking failed.')
      }

      setSuccess(true)
      setMessage('Your appointment has been confirmed!')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="booking-overlay" onClick={onClose}>
      <div
        className="booking-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Book an appointment"
        onClick={event => event.stopPropagation()}
      >
        <button
          type="button"
          className="booking-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        {success ? (
          <div className="booking-success">
            <h2>Booking Confirmed!</h2>
            <p>{message}</p>
            <p>
              {specialist.name} — {date} at {time}
            </p>
            <button type="button" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            <h2>Book an Appointment</h2>
            <p className="booking-subtitle">
              Schedule a service with {specialist.name}
            </p>

            <form onSubmit={handleSubmit}>
              <label htmlFor="booking-date">Preferred Date</label>
              <input
                id="booking-date"
                type="date"
                min={minDate}
                value={date}
                onChange={event => {
                  setDate(event.target.value)
                  setTime('')
                }}
                required
              />

              <label htmlFor="booking-time">Available Time</label>
              {date && daysOff.includes(date) && (
                <p style={{
                  color: '#dc2626',
                  background: '#fef2f2',
                  padding: '12px 16px',
                  borderRadius: 8,
                  marginTop: 12,
                  marginBottom: 12
                }}>
                  📅 This specialist is unavailable on the selected date.
                  Please choose another date.
                </p>
              )}
              {timesLoading && (
                <p>Loading available times...</p>
              )}

              {timesError && (
                <p className="booking-error">
                  {timesError}
                </p>
              )}
              <select
                id="booking-time"
                value={time}
                onChange={event => setTime(event.target.value)}
                disabled={
                  !date ||
                  timesLoading ||
                  Boolean(timesError) ||
                  daysOff.includes(date)
                }
                required
              >
                <option value="">Select a time</option>

                {allTimes
                    .filter(() => !daysOff.includes(date))
                  .filter(slot => {
                    const hour = Number(slot.split(':')[0])

                    const start = specialist.workStartHour ?? 8
                    const end = specialist.workEndHour ?? 17

                    return hour >= start && hour < end
                  })

                  .filter(slot => {
                    const now = new Date()

                    const today =
                      now.getFullYear() + '-' +
                      String(now.getMonth() + 1).padStart(2, '0') + '-' +
                      String(now.getDate()).padStart(2, '0')

                    if (date !== today) return true

                    const currentTime =
                      String(now.getHours()).padStart(2, '0') + ':' +
                      String(now.getMinutes()).padStart(2, '0')

                    return slot > currentTime
                  })
                  .map(slot => (
                  <option
                    key={slot}
                    value={slot}
                    disabled={bookedTimes.includes(slot)}
                  >
                    {slot}
                    {bookedTimes.includes(slot) ? ' — Booked' : ''}
                  </option>
                ))}
              </select>

              <label htmlFor="booking-name">Your Name</label>
              <input
                id="booking-name"
                type="text"
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="Enter your full name"
                required
              />

              <label htmlFor="booking-email">Email Address</label>
              <input
                id="booking-email"
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />

              <label htmlFor="booking-description">
                Describe Your Project
              </label>
              <textarea
                id="booking-description"
                value={description}
                onChange={event => setDescription(event.target.value)}
                placeholder="Tell us what you need help with..."
                rows={3}
              />

              {message && (
                <p className="booking-error">{message}</p>
              )}

              <button
                type="submit"
                className="booking-submit"
                disabled={loading || timesLoading || Boolean(timesError) || !date || !time || bookedTimes.includes(time) || daysOff.includes(date)}
              >
                {loading ? 'Booking...' : 'Confirm Booking'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default BookingForm
