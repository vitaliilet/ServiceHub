
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all')
  const [specialists, setSpecialists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

const [reviewBookingId, setReviewBookingId] = useState(null);
const [reviewRating, setReviewRating] = useState(5);
const [reviewComment, setReviewComment] = useState("");
const [reviewLoading, setReviewLoading] = useState(false);
const [reviewedBookingIds, setReviewedBookingIds] = useState([]);
const [reviewsByBooking, setReviewsByBooking] = useState({});
useEffect(() => {
  fetch("/api/specialists")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load specialists");
      }
      return response.json();
    })
    .then((data) => setSpecialists(data))
    .catch((error) => console.error(error));
}, []);

  useEffect(() => {
    fetch("/api/bookings/my", {
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Please sign in to view bookings.");
        }
        return response.json();
      })
      .then(setBookings)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);




useEffect(() => {
  fetch("/api/reviews/my", {
    credentials: "include"
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load your reviews");
      }
      return response.json();
    })
    .then((reviews) => {
      const ids = reviews.map(
        (review) => Number(review.bookingId)
      );

      const reviewsMap = {};

      reviews.forEach((review) => {
        reviewsMap[Number(review.bookingId)] = review;
      });

      setReviewedBookingIds(ids);
      setReviewsByBooking(reviewsMap);
    })
    .catch((error) => console.error(error));
}, []);


async function handleCancel(id) {
  const confirmed = window.confirm(
    'Are you sure you want to cancel this booking?'
  )

  if (!confirmed) return

  try {
    const csrfResponse = await fetch('/api/auth/csrf', {
      credentials: 'include'
    })

    if (!csrfResponse.ok) {
      throw new Error('Failed to get security token.')
    }

    const csrf = await csrfResponse.json()

    const response = await fetch(`/api/bookings/${id}/cancel`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        [csrf.headerName]: csrf.token
      }
    })

    if (!response.ok) {
      throw new Error('Failed to cancel booking.')
    }

    setBookings(previous =>
      previous.map(booking =>
        booking.id === id
          ? { ...booking, status: 'CANCELLED' }
          : booking
      )
    )
  } catch (error) {
    alert(error.message)
  }
}

async function handleSubmitReview() {
  if (!reviewComment.trim()) {
    alert("Please write a comment.");
    return;
  }

  setReviewLoading(true);

  try {
    const csrfResponse = await fetch("/api/auth/csrf", {
      credentials: "include"
    });

    if (!csrfResponse.ok) {
      throw new Error("Failed to get security token.");
    }

    const csrf = await csrfResponse.json();

    const response = await fetch("/api/reviews", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        [csrf.headerName]: csrf.token
      },
      body: JSON.stringify({
        bookingId: reviewBookingId,
        rating: reviewRating,
        comment: reviewComment.trim()
      })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || "Failed to submit review.");
    }

const savedReview = await response.json();

setReviewsByBooking((previous) => ({
  ...previous,
  [Number(savedReview.bookingId)]: savedReview
}));

    alert("Review submitted successfully!");
setReviewedBookingIds((previous) => [
  ...previous,
  Number(reviewBookingId)
]);
    setReviewBookingId(null);
    setReviewComment("");
    setReviewRating(5);

  } catch (error) {
    alert(error.message);
  } finally {
    setReviewLoading(false);
  }
}

  return (
    <div className="my-bookings-page" style={{ maxWidth: 900, margin: "60px auto", padding: 20 }}>
      <Link to="/" className="sh-return-link">← Back to Home</Link>

      <h1>My Bookings</h1>
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {['all', 'upcoming', 'cancelled', 'completed'].map((item) => (
          <button
            key={item}
            className={filter === item ? "booking-filter-active" : ""}
            type="button"
            onClick={() => setFilter(item)}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: filter === item ? '#2563eb' : '#e5e7eb',
              color: filter === item ? 'white' : '#374151',
              fontWeight: 600,
            }}
          >
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>
      <p>Manage your appointments in one place.</p>

      {loading && <p>Loading bookings...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        filter === 'completed'
          ? !bookings.some(booking => booking.status === 'COMPLETED')
          : filter === 'cancelled'
            ? !bookings.some(booking => booking.status === 'CANCELLED')
            : filter === 'upcoming'
              ? !bookings.some(booking =>
                  booking.status === 'CONFIRMED' &&
                  new Date(`${booking.bookingDate}T${booking.bookingTime}`) >= new Date()
                )
              : bookings.length === 0
      ) && (
        <p>
          {filter === 'completed'
            ? 'No completed bookings yet.'
            : filter === 'cancelled'
              ? 'No cancelled bookings yet.'
              : filter === 'upcoming'
                ? 'No upcoming bookings yet.'
                : "You don't have any bookings yet."}
        </p>
      )}


{[...bookings]
  .filter((booking) => {

if (filter === 'completed') {
  return booking.status === 'COMPLETED'
}

    if (filter === 'cancelled') {
      return booking.status === 'CANCELLED'
    }

    if (filter === 'upcoming') {
      const bookingDateTime = new Date(
        `${booking.bookingDate}T${booking.bookingTime}`
      )

      return (
        booking.status === 'CONFIRMED' &&
        bookingDateTime >= new Date()
      )
    }

    return true
  })
  .sort((a, b) => b.id - a.id)
  .map((booking) => {
  const specialist = specialists.find(
    (s) => Number(s.id) === Number(booking.specialistId)
  );

  return (

        <div
          key={booking.id}
          className="my-booking-card"
          style={{
            background: "white",
            padding: 24,
            borderRadius: 12,
            marginTop: 16,
            boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
          }}
        >
<div style={{ display: "flex", alignItems: "center", gap: 24 }}>
{specialist && (
  <img
    src={specialist.imageUrl || `/professionals/${specialist.id}.jpg`}
    alt={specialist.name}
    onError={(e) => {
      e.currentTarget.onerror = null
      e.currentTarget.src = '/default-avatar.svg'
    }}
    style={{
      width: 110,
      height: 110,
      flexShrink: 0,
      borderRadius: 12,
      objectFit: "cover",
      marginBottom: 12
    }}
  />
)}
<div>
          <h3>Booking #{booking.id}</h3>
          <p>Date: {booking.bookingDate}</p>
          <p>Time: {booking.bookingTime?.slice(0, 5)}</p>

<p>
  Status:{" "}
  <span
    style={{
      backgroundColor: ["CONFIRMED", "COMPLETED"].includes(booking.status)
        ? "#dcfce7"
        : "#fee2e2",
      color: ["CONFIRMED", "COMPLETED"].includes(booking.status)
        ? "#166534"
        : "#dc2626",
      padding: "5px 12px",
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 700
    }}
  >
    {booking.status}
  </span>
</p>


<p>
  Specialist: {specialist?.name || "Unknown specialist"}
</p>
<p>
  Service: {specialist?.service || "Not specified"}
</p>

{specialist && (

<div style={{
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  marginTop: 10,
  alignItems: "center"
}}>
  <Link
    to={`/professionals/${specialist.id}`}
    style={{
      display: "inline-block",
      padding: "10px 18px",
      backgroundColor: "#2563eb",
      color: "white",
      borderRadius: 8,
      textDecoration: "none",
      fontWeight: 600,
      fontSize: 14
    }}
  >
    View Specialist
  </Link>

  {booking.status === "CONFIRMED" && (
    <button
      type="button"
      onClick={() => handleCancel(booking.id)}
      style={{
        background: "#fee2e2",
        color: "#dc2626",
        border: "none",
        borderRadius: 8,
        padding: "10px 16px",
        fontWeight: 600,
        cursor: "pointer"
      }}
    >
      Cancel Booking
    </button>
  )}

{booking.status === "COMPLETED" &&
  !reviewedBookingIds.includes(Number(booking.id)) && (
  <button
    type="button"
    onClick={() => {
      setReviewBookingId(booking.id);
      setReviewRating(5);
      setReviewComment("");
    }}
    style={{
      backgroundColor: "#f59e0b",
      color: "white",
      border: "none",
      borderRadius: 8,
      padding: "10px 16px",
      fontWeight: 600,
      cursor: "pointer"
    }}
  >
    ⭐ Write Review
  </button>
)}

{booking.status === "COMPLETED" &&
  reviewedBookingIds.includes(Number(booking.id)) && (
    <span
      style={{
        color: "#16a34a",
        fontWeight: 600,
        padding: "10px 12px"
      }}
    >
      ✓ Reviewed
    </span>
)}

{booking.status === "COMPLETED" &&
  reviewsByBooking[Number(booking.id)] && (
    <div

className="my-booking-review"
style={{
  marginTop: 16,
  padding: 16,
  backgroundColor: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  width: "100%",
  boxSizing: "border-box",
  flexBasis: "100%"
}}

    >
      <h4 style={{ margin: "0 0 10px" }}>
        Your Review
      </h4>

      <div
        style={{
          color: "#f59e0b",
          fontSize: 22,
          marginBottom: 8
        }}
      >
        {"★".repeat(reviewsByBooking[Number(booking.id)].rating)}
        <span style={{ color: "#d1d5db" }}>
          {"★".repeat(
            5 - reviewsByBooking[Number(booking.id)].rating
          )}
        </span>
      </div>

      <p style={{ margin: 0, lineHeight: 1.6 }}>
        {reviewsByBooking[Number(booking.id)].comment}
      </p>
    </div>
  )}

{booking.status === "COMPLETED" &&
  reviewBookingId === booking.id && (
    <div
      className="my-booking-review-form"
      style={{
        marginTop: 16,
        padding: 20,
        backgroundColor: "#f8fafc",
        borderRadius: 10,
        width: "100%"
      }}
    >
      <h3>Leave a Review</h3>

      <p>Your Rating</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setReviewRating(star)}
            style={{
              fontSize: 30,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: star <= reviewRating ? "#f59e0b" : "#d1d5db"
            }}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        placeholder="Share your experience with this specialist..."
        value={reviewComment}
        onChange={(e) => setReviewComment(e.target.value)}
        maxLength={2000}
        rows={4}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 8,
          border: "1px solid #d1d5db",
          boxSizing: "border-box",
          resize: "vertical"
        }}
      />

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button
          type="button"
          onClick={handleSubmitReview}
          disabled={reviewLoading}
          style={{
            padding: "10px 18px",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer"
          }}
        >
          Submit Review
        </button>

        <button
          type="button"
          onClick={() => setReviewBookingId(null)}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            cursor: "pointer"
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )}

</div>

)}

</div>
</div>
        </div>
          );
        })}
    </div>
  );
}
