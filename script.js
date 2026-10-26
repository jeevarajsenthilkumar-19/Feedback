
<script>
(() => {
  'use strict';

  const faces = {
    1: '😞',
    2: '🙁',
    3: '😐',
    4: '🙂',
    5: '😄'
  };

  const ratingLabels = {
    1: 'Terrible',
    2: 'Bad',
    3: 'Okay',
    4: 'Good',
    5: 'Excellent'
  };

  let selectedRating = 0;
  let loadingGallery = false;
  let galleryInitialized = false;
  let lastGalleryKey = '';

  const form = document.getElementById('feedbackForm');
  const submitButton = document.getElementById('submitButton');
  const formMessage = document.getElementById('formMessage');
  const gallery = document.getElementById('reviewGallery');
  const galleryStatus = document.getElementById('galleryStatus');
  const thankYou = document.getElementById('thankYou');

  // Select one of the five emoji ratings.
  document.querySelectorAll('.face').forEach(button => {
    button.addEventListener('click', () => {
      selectedRating = Number(button.dataset.rating);

      document.querySelectorAll('.face').forEach(face => {
        const active = face === button;

        face.classList.toggle('selected', active);
        face.setAttribute('aria-pressed', String(active));
      });

      formMessage.textContent =
        'You selected ' + faces[selectedRating] + ' ' +
        ratingLabels[selectedRating] + '.';
    });
  });

  // Submit feedback to Google Apps Script.
  form.addEventListener('submit', event => {
    event.preventDefault();

    if (!selectedRating) {
      formMessage.textContent =
        'Please select one of the five faces.';
      return;
    }

    const comment = document.getElementById('comment')
      .value.trim();

    if (!comment) {
      formMessage.textContent =
        'Please enter your feedback.';
      document.getElementById('comment').focus();
      return;
    }

    const data = {
      rating: selectedRating,
      name: document.getElementById('customerName')
        .value.trim(),
      comment: comment,
      contactRequested: document.getElementById(
        'contactRequested'
      ).checked
    };

    submitButton.disabled = true;
    formMessage.textContent = 'Saving your feedback...';

    google.script.run
      .withSuccessHandler(result => {
        submitButton.disabled = false;

        if (!result || !result.success) {
          formMessage.textContent =
            'We could not save your review. Please try again.';
          return;
        }

        // Reset form and ratings after a successful save.
        form.reset();
        selectedRating = 0;

        document.querySelectorAll('.face').forEach(face => {
          face.classList.remove('selected');
          face.setAttribute('aria-pressed', 'false');
        });

        formMessage.textContent = '';

        // Display the thank-you screen.
        thankYou.hidden = false;
        thankYou.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });

        // Reload reviews immediately after submission.
        loadReviews(true);
      })
      .withFailureHandler(error => {
        submitButton.disabled = false;

        formMessage.textContent =
          error && error.message
            ? error.message
            : 'Something went wrong. Please try again.';

        console.error('Review submission failed:', error);
      })
      .submitReview(data);
  });

  // Return from thank-you screen to the form.
  document.getElementById('backButton')
    .addEventListener('click', () => {
      thankYou.hidden = true;

      document.getElementById('feedbackForm')
        .scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
    });

  // Create text elements safely without inserting HTML from users.
  function makeElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (text !== undefined) {
      element.textContent = text;
    }

    return element;
  }

  function formatDate(value) {
    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  // Build one sticky-note review card.
  // No photos or avatar images are used here.
  function createReviewCard(review) {
    const card = makeElement('article', 'review-card');

    // Exactly one large push pin per card.
    card.appendChild(
      makeElement('div', 'review-pin', '📌')
    );

    const meta = makeElement('div', 'review-meta');

    meta.appendChild(
      makeElement(
        'div',
        'review-name',
        review.name || 'Anonymous customer'
      )
    );

    // Show the selected emoji beside the customer's name.
    meta.appendChild(
      makeElement(
        'span',
        'review-mood',
        faces[review.rating] || '💛'
      )
    );

    card.appendChild(meta);

    const rating = Math.max(
      1,
      Math.min(5, Number(review.rating) || 1)
    );

    const stars = makeElement('div', 'review-stars');

    stars.setAttribute(
      'aria-label',
      rating + ' out of 5 stars'
    );

    stars.textContent =
      '★'.repeat(rating) +
      '☆'.repeat(5 - rating);

    card.appendChild(stars);

    // textContent prevents submitted comments becoming HTML.
    card.appendChild(
      makeElement(
        'p',
        'review-comment',
        review.comment || ''
      )
    );

    card.appendChild(
      makeElement(
        'div',
        'review-date',
        formatDate(review.timestamp)
      )
    );

    return card;
  }

  // Fetch reviews from the Google Sheets backend.
  function loadReviews(force) {
    if (loadingGallery) {
      return;
    }

    loadingGallery = true;

    google.script.run
      .withSuccessHandler(reviews => {
        loadingGallery = false;

        if (!Array.isArray(reviews)) {
          galleryStatus.textContent =
            'Could not read the review list.';
          return;
        }

        // Backend already sorts newest first.
        const key = JSON.stringify(reviews);

        if (!force && key === lastGalleryKey) {
          galleryStatus.textContent =
            'Gallery is up to date · ' +
            new Date().toLocaleTimeString();
          return;
        }

        lastGalleryKey = key;

        const fragment = document.createDocumentFragment();

        reviews.forEach(review => {
          fragment.appendChild(
            createReviewCard(review)
          );
        });

        if (reviews.length === 0) {
          fragment.appendChild(
            makeElement(
              'p',
              'muted',
              'No reviews yet. Be the first to leave a note! 💛'
            )
          );
        }

        gallery.replaceChildren(fragment);
        galleryInitialized = true;

        galleryStatus.textContent =
          reviews.length +
          ' latest reviews · Updated ' +
          new Date().toLocaleTimeString();
      })
      .withFailureHandler(error => {
        loadingGallery = false;

        galleryStatus.textContent = galleryInitialized
          ? 'Could not refresh reviews. Showing the last loaded reviews.'
          : 'Could not load reviews. Please refresh the page.';

        console.error('Gallery loading failed:', error);
      })
      .getReviews();
  }

  // Load once immediately, then poll every 15 seconds.
  loadReviews(true);

  window.setInterval(() => {
    loadReviews(false);
  }, 15000);
})();
</script>
