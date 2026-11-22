import { useEffect, useState } from 'react'
import './App.css'
import { Link } from 'react-router-dom'
import NotificationBell from './NotificationBell.jsx'
import { MessageCircle } from './MessageIcon.jsx'
const categories = [
  { icon: '⚡', name: 'Electrician' },
  { icon: '🔧', name: 'Plumber' },
  { icon: '🧹', name: 'Cleaning' },
  { icon: '📷', name: 'Photography' },
  { icon: '📚', name: 'Tutoring' },
  { icon: '💻', name: 'IT Services' },
]

function App() {
  const [specialists, setSpecialists] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [city, setCity] = useState('All')
  const [sort, setSort] = useState('default')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const [favoriteIds, setFavoriteIds] = useState([])
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [reviewsBySpecialist, setReviewsBySpecialist] = useState({})
const handleLogout = async () => {
  try {
    const csrfResponse = await fetch('/api/auth/csrf', {
      credentials: 'include'
    })

    if (!csrfResponse.ok) {
      throw new Error('Failed to get CSRF token')
    }

    const csrf = await csrfResponse.json()

    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        [csrf.headerName]: csrf.token
      }
    })

    if (!response.ok) {
      throw new Error('Logout failed')
    }

    setUser(null)
  } catch (error) {
    console.error('Logout error:', error)
    alert('Could not sign out. Please try again.')
  }
}
useEffect(() => {
  fetch('/api/auth/me', {
    credentials: 'include'
  })
    .then(response => {
      if (!response.ok) return null
      return response.json()
    })
    .then(data => setUser(data))
    .catch(() => setUser(null))
}, [])
  useEffect(() => {if(!['CLIENT','PROFESSIONAL'].includes(user?.role)){setFavoriteIds([]);return}fetch('/api/workspace/favorites',{credentials:'include'}).then(r=>r.ok?r.json():[]).then(rows=>setFavoriteIds(rows.map(x=>x.specialistId))).catch(()=>{})},[user]);

const toggleFavorite = async (id) => {
  try {
    const saved = favoriteIds.includes(id)

    const csrfResponse = await fetch('/api/auth/csrf', {
      credentials: 'include',
      cache: 'no-store'
    })

    if (!csrfResponse.ok) {
      throw new Error('Could not get CSRF token')
    }

    const csrf = await csrfResponse.json()

    const cookieToken = document.cookie
      .split('; ')
      .find(part => part.startsWith('XSRF-TOKEN='))
      ?.slice('XSRF-TOKEN='.length)

    const token = cookieToken
      ? decodeURIComponent(cookieToken)
      : csrf.token

    const response = await fetch(
      `/api/workspace/favorites/${id}`,
      {
        method: saved ? 'DELETE' : 'POST',
        credentials: 'include',
        headers: {
          [csrf.headerName]: token
        }
      }
    )

    if (!response.ok) {
      throw new Error(
        `Could not update favorites (HTTP ${response.status})`
      )
    }

    setFavoriteIds(old =>
      saved
        ? old.filter(item => item !== id)
        : [...old, id]
    )
  } catch (error) {
    console.error('Favorite update failed:', error)
    alert(error.message)
  }
}

  useEffect(() => {
    fetch('/api/specialists')
      .then(response => {
        if (!response.ok) throw new Error('Failed to load')
        return response.json()
      })
      .then(data => setSpecialists(data))
      .catch(() => setError('Could not load professionals.'))
      .finally(() => setLoading(false))
  }, [])

useEffect(() => {
  if (specialists.length === 0) return

  Promise.all(
    specialists.map(async (person) => {
      const response = await fetch(
        `/api/reviews/specialist/${person.id}`
      )

      if (!response.ok) {
        throw new Error('Failed to load reviews')
      }

      const reviews = await response.json()

      const average = reviews.length > 0
        ? reviews.reduce(
            (sum, review) => sum + review.rating, 0
          ) / reviews.length
        : 0

      return {
        specialistId: person.id,
        rating: average,
        reviewCount: reviews.length
      }
    })
  )
    .then(results => {
      const ratings = {}

      results.forEach(item => {
        ratings[item.specialistId] = {
          rating: item.rating,
          reviewCount: item.reviewCount
        }
      })

      setReviewsBySpecialist(ratings)
    })
    .catch(error => console.error(error))
}, [specialists])

  const filtered = specialists
    .filter(person => {
      const matchesSearch =
        `${person.name} ${person.city} ${person.service}`
          .toLowerCase()
          .includes(search.toLowerCase())

      const matchesCategory =
        category === 'All' ||
        person.service.toLowerCase() === category.toLowerCase()

      const matchesCity =
        city === 'All' || person.city === city

      const matchesFavorites = !favoritesOnly || favoriteIds.includes(person.id)
      return matchesSearch && matchesCategory && matchesCity && matchesFavorites
    })
    .sort((a, b) => {
      if (sort === 'low') return a.price - b.price
      if (sort === 'high') return b.price - a.price

if (sort === 'rating') {
  const ratingA = reviewsBySpecialist[a.id]?.rating ?? 0
  const ratingB = reviewsBySpecialist[b.id]?.rating ?? 0

  return ratingB - ratingA
}

      return 0
    })

  return (
    <div className="app">
      <header className="navbar">
        <a href="#" className="logo">
          Service<span>Hub</span>
        </a>

        <button className="sh-mobile-menu-toggle" type="button"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="sh-main-navigation"
          onClick={() => setMobileMenuOpen(open => !open)}>
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
        <nav id="sh-main-navigation" className={mobileMenuOpen ? 'sh-nav-open' : ''}>
          <a href="#categories" onClick={() => setMobileMenuOpen(false)}>Services</a>
          <a href="#professionals" onClick={() => setMobileMenuOpen(false)}>Find Professionals</a>
          <a href="#about" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
        </nav>

        <div className="sh-header-actions">
          {user ? (
            <>
              <span className="sh-header-greeting">Hi, {user.name}</span>
              {user.role === 'PROFESSIONAL' && (
                <Link className="sh-header-button sh-header-profile" to="/professional/dashboard">Profile</Link>
              )}
              {user.role === 'CLIENT' && (
                <Link className="sh-header-button sh-header-profile" to="/profile">Profile</Link>
              )}
              <Link className="sh-header-button sh-header-bookings" to="/my-bookings">My Bookings</Link>
              {user?.role === "ADMIN" && <Link className="sh-header-button sh-header-profile" to="/admin">Admin</Link>}
              <Link to="/messages" className="sh-chat-header-button" aria-label="Open messages" title="Messages"><MessageCircle /></Link>
              <NotificationBell />
              <button className="sh-header-button sh-header-logout" type="button" onClick={handleLogout}>
                Log Out
              </button>
            </>
          ) : (
            <Link to="/login" className="sh-header-button">Sign In</Link>
          )}
        </div>
      </header>

      <section className="hero">
        <div className="hero-content">
          <div className="eyebrow">
            YOUR TRUSTED SERVICE MARKETPLACE
          </div>

          <h1>
            Find the right expert.
            <br />
            <span>Get the job done.</span>
          </h1>

          <p>
            Connect with skilled local professionals
            for your home, business, and everyday needs.
          </p>

          <div className="hero-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search services, professionals or cities..."
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
            <a href="#professionals">Search</a>
          </div>

          <div className="hero-tags">
            <span>Popular:</span>
            {['Electrician', 'Plumber', 'Cleaning'].map(item => (
              <button
                key={item}
                onClick={() => {
                  setSearch(item)
                  setCategory('All')
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="categories" className="container categories-section">
        <div className="section-heading">
          <div>
            <span className="section-label">OUR SERVICES</span>
            <h2>Explore popular categories</h2>
            <p>Whatever you need, find the right professional.</p>
          </div>
        </div>

        <div className="category-grid">
          {categories.map(item => (
            <button
              className={`category-card ${
                category === item.name ? 'active' : ''
              }`}
              key={item.name}
              onClick={() => {
                setCategory(
                  category === item.name ? 'All' : item.name
                )
                setSearch('')
                document
                  .getElementById('professionals')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <span className="category-icon">{item.icon}</span>
              <strong>{item.name}</strong>
              <span>Explore →</span>
            </button>
          ))}
        </div>
      </section>

      <main id="professionals" className="container professionals-section">
        <div className="section-heading">
          <div>
            <span className="section-label">TOP PROFESSIONALS</span>
            <h2>Find your perfect match</h2>
            <p>Discover professionals ready to help.</p>
          </div>
          <span className="results-count">
            {filtered.length} {filtered.length === 1
              ? 'professional'
              : 'professionals'}
          </span>
        </div>

        <div className="filter-bar">
          <button
            className={category === 'All' ? 'selected' : ''}
            onClick={() => setCategory('All')}
          >
            All Services
          </button>

          <select
            value={category}
            onChange={event => setCategory(event.target.value)}
          >
            <option value="All">All Categories</option>
            {categories.map(item => (
              <option key={item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
<select
  value={city}
  onChange={event => setCity(event.target.value)}
>
  <option value="All">All Cities</option>

  {[...new Set(specialists.map(person => person.city))]
    .sort()
    .map(item => (
      <option key={item} value={item}>
        {item}
      </option>
    ))}
</select>
          <select
            value={sort}
            onChange={event => setSort(event.target.value)}
          >
            <option value="default">Recommended</option>
            <option value="low">Price: Low to High</option>
            <option value="high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
          {['CLIENT', 'PROFESSIONAL'].includes(user?.role) && (
            <button
              type="button"
              className={`sh-favorites-filter ${favoritesOnly ? 'selected' : ''}`}
              onClick={() => setFavoritesOnly(current => !current)}
              aria-pressed={favoritesOnly}
            >
              {favoritesOnly ? '♥ Favorites' : '♡ Favorites'}
              {favoriteIds.length > 0 && <span className="sh-favorites-count">{favoriteIds.length}</span>}
            </button>
          )}
        </div>

        {error && <p className="error">{error}</p>}
        {loading && <p className="empty">Loading professionals...</p>}

        <div className="cards">
          {filtered.map(person => (
            <article className="card" key={person.id}>
              <div className="card-top">


<div className="avatar">

<img
  src={person.imageUrl || `/professionals/${person.id}.jpg`}
  alt={person.name}
  loading="lazy"
  onError={event => {
    event.currentTarget.onerror = null
    event.currentTarget.src = '/default-avatar.svg'
  }}
/>

</div>


                {['CLIENT','PROFESSIONAL'].includes(user?.role)&&<button type="button" className="sh-favorite-button" onClick={()=>toggleFavorite(person.id)} title="Save professional">{favoriteIds.includes(person.id)?'♥ Saved':'♡ Save'}</button>}
              </div>


<div className="card-body">
  <h3>{person.name}</h3>
  <span className="card-service sh-card-service-under-name">{person.service}</span>

  <p className="location">📍 {person.city}</p>

  <div className="professional-stats">

<span className="rating">
  {reviewsBySpecialist[person.id] ? (
    reviewsBySpecialist[person.id].reviewCount > 0 ? (
      <>
        ★ {reviewsBySpecialist[person.id].rating.toFixed(1)}
        <small>
          {" "}({reviewsBySpecialist[person.id].reviewCount}{" "}
          {reviewsBySpecialist[person.id].reviewCount === 1
            ? "review"
            : "reviews"})
        </small>
      </>
    ) : (
      <small>☆ No reviews yet</small>
    )
  ) : (
    <small>Loading rating...</small>
  )}
</span>



<span
  className={`experience experience-badge ${
    Number(person.experience) >= 10
      ? "experience-gold"
      : Number(person.experience) >= 6
      ? "experience-purple"
      : Number(person.experience) >= 3
      ? "experience-green"
      : "experience-gray"
  }`}
>
  {person.experience} years experience
</span>

  </div>

  <p className="card-description">
    {person.description}
  </p>
</div>


              <div className="card-footer">
                <div className="price">
                  <strong>${person.price}</strong>
                  <span>Starting price</span>
                </div>

<Link
  to={`/professionals/${person.id}`}
  className="view-profile-btn"
>
  View Profile
</Link>

              </div>
            </article>
          ))}
        </div>

        {!loading && !error && filtered.length === 0 && (
          <div className="empty">
            <h3>No professionals found</h3>
            <p>Try another service or search term.</p>
            <button
              onClick={() => {
                setSearch('')
                setCategory('All')
              }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </main>

      <section id="about" className="about">
        <div className="container">
          <span className="section-label">SIMPLE & EASY</span>
          <h2>How ServiceHub Works</h2>

          <div className="steps">
            <div>
              <span>01</span>
              <h3>Find a Professional</h3>
              <p>Browse services and discover skilled experts.</p>
            </div>
            <div>
              <span>02</span>
              <h3>Choose Your Expert</h3>
              <p>Compare profiles and find the right match.</p>
            </div>
            <div>
              <span>03</span>
              <h3>Book a Service</h3>
              <p>Schedule your appointment with ease.</p>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="container footer-inner">
          <div className="logo">Service<span>Hub</span></div>
          <p>© 2026 ServiceHub. Portfolio demonstration project.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
