import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Global Scroll Fade Observer
  const globalFadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      } else if (entry.boundingClientRect.top > 0) {
        entry.target.classList.remove('in-view');
      }
    });
  }, { root: null, rootMargin: '-10% 0px -10% 0px', threshold: 0.15 });

  // Will observe later after DOM is fully ready if needed, 
  // but we can just select them now
  document.querySelectorAll('.fade-up, .expertise-card').forEach(el => {
    globalFadeObserver.observe(el);
  });

  // Sticky Nav Logic
  const nav = document.getElementById('main-nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 80) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    });
  }

  // Timeline Scroll Animation
  const observerOptions = {
    root: null,
    rootMargin: '-30% 0px -30% 0px',
    threshold: 0.6 
  };

  const timelineObserver = new IntersectionObserver((entries) => {
    // Only animate on scroll for desktop
    if (window.innerWidth <= 768) return; 
    
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      } else if (entry.boundingClientRect.top > 0) {
        // Only collapse if scrolled back up above it
        entry.target.classList.remove('in-view');
      }
    });
  }, observerOptions);

  const steps = document.querySelectorAll('.timeline-step');
  steps.forEach(step => {
    timelineObserver.observe(step);
    
    // Tap to expand for mobile
    step.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        steps.forEach(s => {
          if (s !== step) s.classList.remove('in-view');
        });
        step.classList.toggle('in-view');
      }
    });
  });

  // Custom Cursor Logic
  const cursor = document.getElementById('project-cursor');
  const projectCards = document.querySelectorAll('.project-card');

  if (cursor && projectCards.length > 0) {
    let mouseX = 0;
    let mouseY = 0;
    
    let cursorX = 0;
    let cursorY = 0;
    
    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    const renderCursor = () => {
      cursorX += (mouseX - cursorX) * 0.2;
      cursorY += (mouseY - cursorY) * 0.2;
      
      cursor.style.left = `${cursorX}px`;
      cursor.style.top = `${cursorY}px`;
      
      requestAnimationFrame(renderCursor);
    };
    requestAnimationFrame(renderCursor);

    projectCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        cursor.classList.add('active');
      });
      card.addEventListener('mouseleave', () => {
        cursor.classList.remove('active');
      });
    });
  }

  // Testimonial Carousel Logic
  const track = document.getElementById('testimonial-track');
  const prevBtn = document.querySelector('.prev-btn');
  const nextBtn = document.querySelector('.next-btn');

  if (track && prevBtn && nextBtn) {
    let isTransitioning = false;

    const getCardWidth = () => {
      const card = track.firstElementChild;
      const style = window.getComputedStyle(card);
      return card.offsetWidth + parseFloat(style.marginLeft) + parseFloat(style.marginRight);
    };

    const updateActiveCard = () => {
      const currentCards = Array.from(track.children);
      currentCards.forEach(c => c.classList.remove('active'));
      // The 3rd card (index 2) is always the center one in our 5-card setup
      if(currentCards[2]) currentCards[2].classList.add('active');
    };
    
    updateActiveCard();

    const moveNext = () => {
      if (isTransitioning) return;
      isTransitioning = true;
      const shift = getCardWidth();
      track.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
      track.style.transform = `translateX(-${shift}px)`;

      const currentCards = Array.from(track.children);
      currentCards.forEach(c => c.classList.remove('active'));
      if(currentCards[3]) currentCards[3].classList.add('active'); 
    };

    const movePrev = () => {
      if (isTransitioning) return;
      isTransitioning = true;
      const shift = getCardWidth();
      track.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
      track.style.transform = `translateX(${shift}px)`;

      const currentCards = Array.from(track.children);
      currentCards.forEach(c => c.classList.remove('active'));
      if(currentCards[1]) currentCards[1].classList.add('active'); 
    };

    track.addEventListener('transitionend', (e) => {
      if (e.propertyName !== 'transform') return;
      
      track.style.transition = 'none';
      if (track.style.transform.includes('-')) {
        track.appendChild(track.firstElementChild);
      } else if (track.style.transform !== 'translateX(0px)' && track.style.transform !== '') {
        track.insertBefore(track.lastElementChild, track.firstElementChild);
      }
      track.style.transform = 'translateX(0)';
      updateActiveCard();
      void track.offsetWidth; // force reflow
      isTransitioning = false;
    });

    nextBtn.addEventListener('click', moveNext);
    prevBtn.addEventListener('click', movePrev);

    let isDragging = false;
    let startPos = 0;
    let dragDiff = 0;
    
    track.addEventListener('dragstart', e => e.preventDefault());

    track.addEventListener('pointerdown', (e) => {
      if (isTransitioning) return;
      isDragging = true;
      startPos = e.clientX;
      dragDiff = 0;
      track.style.transition = 'none';
    });

    window.addEventListener('pointermove', (e) => {
      if (!isDragging || isTransitioning) return;
      dragDiff = e.clientX - startPos;
      track.style.transform = `translateX(${dragDiff}px)`;
    });

    window.addEventListener('pointerup', (e) => {
      if (!isDragging) return;
      isDragging = false;
      
      if (dragDiff > 100) {
        movePrev();
      } else if (dragDiff < -100) {
        moveNext();
      } else {
        track.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
        track.style.transform = `translateX(0px)`;
      }
    });

    track.addEventListener('click', (e) => {
      if (Math.abs(dragDiff) > 10) return; // Ignore click if it was a drag
      const card = e.target.closest('.testimonial-card');
      if (!card || isTransitioning) return;
      const currentCards = Array.from(track.children);
      const index = currentCards.indexOf(card);
      
      if (index > 2) {
        moveNext();
      } else if (index < 2) {
        movePrev();
      }
    });
  }

});
