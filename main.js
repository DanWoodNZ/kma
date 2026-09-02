import './style.css';
import { inject } from '@vercel/analytics';

// Initialize Vercel Web Analytics
inject();

document.addEventListener('DOMContentLoaded', () => {
  // --- Full Screen Preloader (Lottie) ---
  const loaderContainer = document.getElementById('lottie-container');
  let lottieAnimation = null;
  const preloaderSkipped = document.body.classList.contains('preloader-skipped');

  if (loaderContainer && typeof lottie !== 'undefined' && !preloaderSkipped) {
    lottieAnimation = lottie.loadAnimation({
      container: loaderContainer,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: '/kma-loader.json'
    });
  }

  // Loader timing variables - initialize as true if preloader is skipped to bypass checks
  let minTimeElapsed = preloaderSkipped;
  let pageLoaded = preloaderSkipped;
  let videoLoaded = preloaderSkipped;
  let loaderDismissed = preloaderSkipped;

  function checkAndHideLoader() {
    if (loaderDismissed) return;

    // Hide only if all conditions met: min time elapsed AND page fully loaded AND hero video ready
    if (minTimeElapsed && pageLoaded && videoLoaded) {
      loaderDismissed = true;

      // Save session flag so the loader is skipped on subsequent visits in the same session
      try {
        sessionStorage.setItem('kma-preloader-shown', 'true');
      } catch (e) {
        console.warn('sessionStorage is not accessible', e);
      }

      const loader = document.getElementById('site-loader');
      const lottieContainer = document.getElementById('lottie-container');

      // Stage 1: Fade out the Lottie player container first
      if (lottieContainer) {
        lottieContainer.classList.add('fade-out');
      }

      // Stage 2: After the Lottie player finishes fading out, fade out the background overlay
      setTimeout(() => {
        if (loader) {
          loader.classList.add('fade-out');
        }

        // Remove 'loading' and add 'loading-reveal' to trigger logo & nav entry animations
        document.body.classList.add('loading-reveal');
        document.body.classList.remove('loading');

        // Destroy the animation after it fades out to save CPU
        setTimeout(() => {
          if (lottieAnimation) {
            lottieAnimation.destroy();
          }
        }, 1000);

        // Clean up: Remove loading-reveal class after transition is fully complete
        // so that normal scroll transitions behave normally afterwards
        setTimeout(() => {
          document.body.classList.remove('loading-reveal');
        }, 3000);
      }, 800);
    }
  }

  // 1. Min 4s Timer
  setTimeout(() => {
    minTimeElapsed = true;
    checkAndHideLoader();
  }, 4000);

  // 2. Page Window Load Event
  window.addEventListener('load', () => {
    pageLoaded = true;
    checkAndHideLoader();
  });
  // Fallback if load fires before listener is registered
  if (document.readyState === 'complete') {
    pageLoaded = true;
  }

  // 3. Hero Video load check
  const heroVideo = document.querySelector('.hero-bg-video');
  if (heroVideo) {
    if (heroVideo.readyState >= 3) { // HAVE_FUTURE_DATA or higher
      videoLoaded = true;
      checkAndHideLoader();
    } else {
      heroVideo.addEventListener('canplaythrough', () => {
        videoLoaded = true;
        checkAndHideLoader();
      });
      // Safety fallbacks
      heroVideo.addEventListener('error', () => {
        videoLoaded = true;
        checkAndHideLoader();
      });
    }
  } else {
    videoLoaded = true;
  }

  // 4. Global safety timeout (force hide preloader after 8s so user is never stuck)
  setTimeout(() => {
    if (!loaderDismissed) {
      minTimeElapsed = true;
      pageLoaded = true;
      videoLoaded = true;
      checkAndHideLoader();
    }
  }, 8000);

  // Add loaded class to body to trigger fade-in and prevent FOUC
  setTimeout(() => document.body.classList.add('loaded'), 50);

  // Initialize Lucide Icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Global Scroll Fade Observer
  const globalFadeObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { root: null, rootMargin: '0px 0px 100px 0px', threshold: 0.05 });

  // Will observe later after DOM is fully ready if needed, 
  // but we can just select them now
  document.querySelectorAll('.fade-up, .expertise-card').forEach(el => {
    globalFadeObserver.observe(el);
  });

  // Sticky Nav Logic and Back to Top
  const nav = document.getElementById('main-nav');
  const heroLogo = document.querySelector('.hero-logo');
  let lastScrollY = window.scrollY;

  const backToTopBtn = document.createElement('button');
  backToTopBtn.innerHTML = '<i data-lucide="arrow-up"></i>';
  backToTopBtn.className = 'back-to-top hidden';
  backToTopBtn.setAttribute('aria-label', 'Back to top');
  document.body.appendChild(backToTopBtn);

  if (window.lucide) {
    window.lucide.createIcons();
  }

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  if (nav) {
    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 80) {
        nav.classList.add('scrolled');
        if (heroLogo) heroLogo.classList.add('fade-out');
      } else {
        nav.classList.remove('scrolled');
        if (heroLogo) heroLogo.classList.remove('fade-out');
      }

      // Hide on scroll down, show on scroll up (only active after hero section approx 500px)
      if (currentScrollY > 500) {
        if (currentScrollY > lastScrollY) {
          nav.classList.add('nav-hidden');
        } else {
          nav.classList.remove('nav-hidden');
        }
      } else {
         nav.classList.remove('nav-hidden');
      }

      if (currentScrollY > 500) {
        backToTopBtn.classList.remove('hidden');
      } else {
        backToTopBtn.classList.add('hidden');
      }

      lastScrollY = currentScrollY;
    });
  }

  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -20% 0px',
    threshold: 0.4
  };

  const timelineObserver = new IntersectionObserver((entries) => {
    // Only animate on scroll for desktop
    if (window.innerWidth <= 768) return;

    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      } else if (entry.boundingClientRect.top > (window.innerHeight / 2)) {
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

  if (cursor) {
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
  const viewport = document.getElementById('carousel-viewport');
  const prevBtn = document.querySelector('.prev-btn');
  const nextBtn = document.querySelector('.next-btn');

  if (viewport && prevBtn && nextBtn) {
    const cards = Array.from(viewport.querySelectorAll('.testimonial-card'));

    // 1. Intersection Observer for active class
    const observerOptions = {
      root: viewport,
      rootMargin: '0px -45% 0px -45%', // Only trigger in the middle 10% of the viewport
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          cards.forEach(c => c.classList.remove('active'));
          entry.target.classList.add('active');
        }
      });
    }, observerOptions);

    cards.forEach(card => observer.observe(card));

    // 2. Button controls
    const getScrollAmount = () => {
      const card = cards[0];
      const style = window.getComputedStyle(viewport);
      const gap = parseFloat(style.gap) || 0;
      return card.offsetWidth + gap;
    };

    nextBtn.addEventListener('click', () => {
      viewport.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
    });

    prevBtn.addEventListener('click', () => {
      viewport.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
    });

    // 3. Mouse Drag to Scroll
    let isDown = false;
    let startX;
    let scrollLeft;
    let isDragging = false;

    viewport.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      isDown = true;
      isDragging = false;
      viewport.style.scrollSnapType = 'none'; // disable snap during drag
      viewport.style.scrollBehavior = 'auto'; // instant scroll for dragging
      viewport.style.cursor = 'grabbing';
      startX = e.pageX - viewport.offsetLeft;
      scrollLeft = viewport.scrollLeft;
    });

    window.addEventListener('pointerup', (e) => {
      if (e.pointerType !== 'mouse') return;
      if (!isDown) return;
      isDown = false;
      viewport.style.scrollSnapType = 'x mandatory'; // re-enable snap
      viewport.style.scrollBehavior = 'smooth';
      viewport.style.cursor = '';
      // Tiny nudge to trigger CSS snap re-evaluation
      viewport.scrollBy(1, 0);
      viewport.scrollBy(-1, 0);

      // Reset isDragging after click events would have fired
      setTimeout(() => isDragging = false, 50);
    });

    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - viewport.offsetLeft;
      const walk = (startX - x) * 1.5; // Drag speed multiplier
      if (Math.abs(walk) > 10) isDragging = true;
      viewport.scrollLeft = scrollLeft + walk;
    });

    // 4. Click to focus
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (isDragging) {
          e.preventDefault();
          return;
        }
        if (!card.classList.contains('active')) {
          card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      });
    });

    // Initial centering of the 3rd item
    setTimeout(() => {
      if (cards[2]) {
        viewport.style.scrollBehavior = 'auto';
        cards[2].scrollIntoView({ inline: 'center', block: 'nearest' });
        viewport.style.scrollBehavior = 'smooth';
      }
    }, 100);
  }

  // --- Projects Data & Rendering Logic ---
  const projectsData = [
    {
      id: 1,
      title: "Eden Park (West Stand)",
      sector: "Sport & Recreation",
      completion: "2026",
      value: "$8m",
      delivery: "ECI Fixed Price",
      services: "Project Management, Engineer to Contract",
      status: "Current",
      client: "Eden Park Trust",
      image: "/projects/eden-park-west-stand-1.jpg",
      description: "Eden Park is setting a new benchmark for the live event experience in New Zealand with the creation of the Coca-Cola Field Club – a permanent field-level hospitality beneath the goalposts.\n\nDelivered October 2026, the Coca-Cola Field Club provides fans, guests and event organisers a new way to experience sport, entertainment and events at New Zealand’s national stadium.\n\nThis inspirational project was delivered in 9 weeks with KMA providing Project Management and Engineer to the Contract services.",
      gallery: [
        "/projects/eden-park-west-stand-1.jpg", "/projects/eden-park-west-stand-2.jpg", "/projects/eden-park-west-stand-3.jpg"
      ]
    },
    {
      id: 2,
      title: "Northern Specialist Centre",
      sector: "Health",
      completion: "2025",
      value: "$8m",
      delivery: "Fixed Price",
      services: "Project Management",
      status: "Complete",
      client: "Beyond Radiology",
      image: "/projects/northern-specialist-centre-2.jpg",
      description: "KMA was engaged as Project Manager to deliver 6 tenancies for Beyond Radiology at their flagship Northern Specialist Centre clinic. Working with Beyond Radiology and Acept, KMA was able to deliver the project ahead of progamme and on budget.",
      gallery: [
        "/projects/northern-specialist-centre-2.jpg", "/projects/northern-specialist-centre-1.webp"
      ]
    },
    {
      id: 3,
      title: "Exchange",
      sector: "Commercial",
      completion: "2027",
      value: "Confidential",
      delivery: "ECI Fixed Price",
      services: "Project Management, Engineer to Contract",
      status: "Current",
      client: "Quattro",
      image: "/projects/exchange-1.jpg",
      description: "Rising from the historic site of Auckland’s original stock exchange, and located in the heart of Midtown, Exchange by Alberts offers a distinctive blend of heritage and ambition. A nod to its past and a bold move toward the future, Exchange is where business meets legacy. More than a workplace—it’s a stage for ideas, influence, and impact.\n\nKMA were appointed by Quattro to provide Project Management and Engineer to the Contract services for the refurbishment of this midtown classic.",
      gallery: [
        "/projects/exchange-1.jpg", "/projects/exchange-2.jpg", "/projects/exchange-3.jpg"
      ]
    },
    {
      id: 4,
      title: "Bledisloe House",
      sector: "Commercial",
      completion: "2027",
      value: "$70m",
      delivery: "Design & Build",
      services: "Project Management, Engineer to Contract",
      status: "Current",
      client: "MRCB / Quattro",
      image: "/projects/bledisloe-house-1.jpg",
      description: "Set to welcome tenants from 2027, the Bledisloe House redevelopment will deliver the curated office environments Quattro Alberts has become known for, including:\n\n- Premium grade commercial office spaces from Levels 2 to 9\n- Dedicated and expansive wellness centre for members\n- Range of meeting, collaboration and venue spaces on Level 1\n- New food destination for Midtown, incorporating a mix of premium eat-street style dining options\n- Myers Lane connection to the Te Waihorotiu Station\n\nLocated directly outside Te Waihorotiu Station, the flagship stop on Auckland’s City Rail Link, Bledisloe House will benefit from significantly improved rapid transit connectivity once the rail project is complete.\n\nKMA provides Project Management and Engineer to the Contract Services for MRCB and Quattro.",
      gallery: [
        "/projects/bledisloe-house-1.jpg", "/projects/bledisloe-house-2.jpg", "/projects/bledisloe-house-3.jpg"
      ]
    },
    {
      id: 5,
      title: "The Stables - Parkview",
      sector: "Residential",
      completion: "2027",
      value: "$155m",
      delivery: "Design & Build",
      services: "Project Management, Engineer to Contract",
      status: "Current",
      client: "Gleneagle",
      image: "/projects/the-stables-parkview-1.jpeg",
      description: "The Stables is the first release within Parkview - a new, design-led precinct beside Cornwall Park. Named for the original raceway stables that once stood here, the building reflects that same sense of structure and permanence - robust, refined and made to last.\n\nDesigned by Paul Brown & Associates, KMA is providing Development Management and Project Management services for the precinct. With design progressing, works are scheduled to commence in 2026.",
      gallery: [
        "/projects/the-stables-parkview-1.jpeg", "/projects/the-stables-parkview-2.jpeg", "/projects/the-stables-parkview-3.jpeg"
      ]
    },
    {
      id: 6,
      title: "5 Albert Street",
      sector: "Mixed Use",
      completion: "2031",
      value: "Confidential",
      delivery: "Design & Build",
      services: "Development Management, Project Management, Advisory",
      status: "Current",
      client: "M&L Group",
      image: "/projects/5-albert-street-1.jpg",
      description: "The development of 5 Albert Street is a world class mixed use precinct at the home of the former food alley site.\n\nThe Resource Consent allows for the following:\n37 level above ground office building with a total of 34,414m2 NLA\n• Office tower maximum height of 167 metres above ground to maximum RL 177.47m\n• 7 level podium inc 10,404m2 of entry lobby, foyers, end of trip, retail\n• Two levels of basement inc 52 car spaces\n• Retention of exterior façades and upgrades of historic Yates, Berry and Hopkins buildings\n• Covered pedestrian laneway 8m in width inc. vehicle access connecting Federal and Albert Streets\n• Roof terraces to Yates and Berry buildings\n\nKMA has been engaged since 2020 to provide Development Management and Project Management services to M&L Group.",
      gallery: [
        "/projects/5-albert-street-1.jpg", "/projects/5-albert-street-2.jpg", "/projects/5-albert-street-3.jpg"
      ]
    },
    {
      id: 7,
      title: "Hilton",
      sector: "Tourism & Leisure",
      completion: "2025",
      value: "$10m",
      delivery: "Fixed Price",
      services: "Project Management, Engineer to Contract",
      status: "Complete",
      client: "M&L Group",
      image: "/projects/hilton-1.jpg",
      description: "KMA was engaged in 2022 to assist M&L Group across a wide range of workstreams for the Hilton on Princes Wharf. This included a full reclad of the East & West facades, upgrade of the existing pool deck and refurbishment of major hotel infrastructure.",
      gallery: [
        "/projects/hilton-1.jpg", "/projects/hilton-2.jpg", "/projects/hilton-3.jpg"
      ]
    },
    /*
    {
      id: 8,
      title: "Symphony Centre",
      sector: "Mixed Use",
      completion: "2031",
      value: "Confidential",
      delivery: "Design & Build",
      services: "Project Management",
      status: "Current",
      client: "MRCB",
      image: "/projects/symphony-centre-1.webp",
      description: "Positioned at the heart of midtown’s changing urbanscape will be a magnificent structure nestled between a station and a square - The Symphony Centre development.\n\nLocated at the corner of Wellesley Street and Mayoral Drive, this mixed-use development will encompass residential, commercial, retail, and hospitality to create a dynamic cultural and lifestyle precinct that will reinvigorate Auckland’s Aotea Arts Quarter.\n\nPart of a major inner city regeneration project, The Symphony Centre will include the refurbishment of heritage-listed Bledisloe House and the activation of connecting laneways to form The Lanes.\n\nKMA has been engaged to provide Project Management services for this exciting, city shaping Development.",
      gallery: [
        "/projects/symphony-centre-1.webp", "/projects/symphony-centre-2.webp", "/projects/symphony-centre-3.webp"
      ]
    },
    */
    {
      id: 9,
      title: "Takanini Industrial",
      sector: "Industrial",
      completion: "2028",
      value: "Confidential",
      delivery: "Design & Build",
      services: "Project Management, Engineer to Contract",
      status: "Current",
      client: "Confidential",
      image: "/projects/takanini-industrial.jpg",
      description: "The Takanini project will include the site clearance and construction of a high-bay – high-span refrigerated industrial unit with the associated low-bay delivery functions and support office space.\n\nKMA has been engaged as Bid lead to assist the Client with appointment of Main Contractor.",
      gallery: [
        "/projects/takanini-industrial.jpg"
      ]
    },
    {
      id: 10,
      title: "Ormiston Interventional",
      sector: "Health",
      completion: "2026",
      value: "$2.5m",
      delivery: "Design & Build / Turnkey",
      services: "Project Management, Engineer to Contract",
      status: "Current",
      client: "Canopy Imaging",
      image: "/projects/ormiston-interventional-1.jpg",
      description: "KMA was engaged by Canopy Imaging in 2025 to provide a Design & Build delivery strategy for a 500sqm Interventional Suite at Ormiston Hospital next to their existing tenancy.\n\nWorking with Acept, MA Studio and Edge Interiors, KMA was able to provide a procurement process which enabled the project to be delivered in a fastrack manner.",
      gallery: [
        "/projects/ormiston-interventional-1.jpg", "/projects/ormiston-interventional-2.jpg"
      ]
    }
  ];

  const projectsGrid = document.getElementById('projects-grid');

  if (projectsGrid) {
    // Current filter states
    let currentSectorFilter = 'All';
    let currentStatusFilter = 'All';

    const renderProjects = () => {
      // Clear grid
      projectsGrid.innerHTML = '';

      const isHomepage = projectsGrid.classList.contains('homepage-projects-grid');
      let projectsToRender = [];

      if (isHomepage) {
        // Only show The Stables (5), 5 Albert St (6), Exchange (3) on homepage
        projectsToRender = projectsData.filter(p => [5, 6, 3].includes(p.id));
      } else {
        projectsToRender = projectsData.filter(p => {
          const matchSector = currentSectorFilter === 'All' || p.sector === currentSectorFilter;
          const matchStatus = currentStatusFilter === 'All' || p.status === currentStatusFilter;
          return matchSector && matchStatus;
        });
      }

      projectsToRender.forEach((project, index) => {
        const delayClass = `delay-${(index % 8) + 1}`;

        const cardHTML = `
          <div class="project-card fade-up ${delayClass}" onclick="window.location.href='/project.html?id=${project.id}'">
            <div class="project-info">
              <div>
                <h3 class="project-title">${project.title}</h3>
                <span class="project-category-pill">${project.sector}</span>
              </div>
              <ul class="project-meta">
                <li><i data-lucide="calendar"></i> ${project.completion}</li>
                <li><i data-lucide="circle-dollar-sign"></i> ${project.value}</li>
                <li><i data-lucide="check-circle"></i> ${project.status}</li>
              </ul>
            </div>
            <div class="project-image-wrapper">
              <div class="project-image" style="background-image: url('${project.image}')"></div>
            </div>
          </div>
        `;
        projectsGrid.insertAdjacentHTML('beforeend', cardHTML);
      });

      // Re-initialize icons for newly added elements
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }

      // Re-observe new fade-up elements
      document.querySelectorAll('#projects-grid .fade-up').forEach(el => {
        globalFadeObserver.observe(el);
      });

      // Re-attach custom cursor events for new cards
      const newCards = projectsGrid.querySelectorAll('.project-card');
      if (cursor && newCards.length > 0) {
        newCards.forEach(card => {
          card.addEventListener('mouseenter', () => cursor.classList.add('active'));
          card.addEventListener('mouseleave', () => cursor.classList.remove('active'));
        });
      }
    };

    // Initial render
    renderProjects();

    // Filter Logic
    const filterPills = document.querySelectorAll('.filter-pill');
    if (filterPills.length > 0) {
      filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
          filterPills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          currentSectorFilter = pill.dataset.filter;
          renderProjects();
        });
      });
    }

    const statusToggle = document.getElementById('status-toggle');
    if (statusToggle) {
      statusToggle.addEventListener('change', (e) => {
        currentStatusFilter = e.target.checked ? 'Complete' : 'All';
        renderProjects();
      });
    }
  }

  // --- Team Page Logic ---
  const currentPath = window.location.pathname;
  const isTeamPage = currentPath.endsWith('team.html') || currentPath.endsWith('/team');
  if (isTeamPage) {
    const teamData = [
      {
        id: 1,
        name: "Kyle Mingins",
        role: "Founder & Director",
        description: "Kyle is a highly capable and dedicated property professional with 21+ years of experience in significant projects throughout New Zealand, Australia, and the United Kingdom.\n\nDuring Kyle’s time in the industry he has delivered a variety of major projects for both institutional and private clients across a range of sectors including Commercial, Mixed Use, Residential, Sports & Recreation and Hospitality developments.\n\nAs the founding Director of KMA, Kyle is actively involved in the front end of all KMA projects ensuring that the project foundations are set up to a high standard to ensure successful project outcomes.\n\nKyle brings a consistent and grounded approach to motivate and lead project teams which has proven effective in completing numerous high-profile projects on time and on budget.",
        imageUrl: "/team/team-kyle-mingins.jpg"
      },
      {
        id: 2,
        name: "Mark Sheridan",
        role: "Senior Associate",
        description: "Mark is an experienced project leader with over 15 years of delivering projects in both the UK and New Zealand.\n\nWith nearly a decade’s experience in the main contracting sector, Mark provides extensive technical construction skills as well as having built an industry recognized reputation for project delivery.\n\nMark’s experience in leading major projects is second to none. His experience in project ownership & delivery makes him a favourite for both institutional and private developers.",
        imageUrl: "/team/team-mark-sheridan.jpg"
      },
      {
        id: 3,
        name: "Hirusha Fernando",
        role: "Associate",
        description: "Hirusha is a construction project and development management professional with over 12 years’ experience across New Zealand, Australia and the Asia-Pacific region.\n\nHe has led complex commercial, property and government projects from early definition through to delivery, with experience across clients including Kiwi Property, Precinct Properties, Centuria, Todd Property, the Department of Corrections, Whangarei District Council, MPI and MSD.\n\nHis key strengths are in development management and front-end project leadership, including feasibility, procurement strategy, governance, stakeholder alignment, risk, programme and delivery planning.",
        imageUrl: "/team/team-hirusha-fernando.jpg"
      },
      {
        id: 4,
        name: "Bryce Redman",
        role: "Project Director",
        description: "Bryce brings extensive experience in providing end-to-end development and project management services across a diverse portfolio of commercial, residential, and mixed-use projects throughout New Zealand. His expertise encompasses the full development lifecycle, including site acquisition and due diligence, feasibility assessment, planning and consenting, stakeholder engagement, design management, procurement strategy, construction delivery, and project completion.\n\nHe has a proven track record of successfully leading multidisciplinary teams, managing complex stakeholder relationships, and delivering high-quality developments that achieve both commercial and project objectives.",
        imageUrl: "/team/team-bryce-redman.jpg"
      },
      {
        id: 5,
        name: "Mark Hamilton",
        role: "Project Director",
        description: "Mark is a highly experienced construction professional with 30 + years of experience representing Tier One organisations throughout New Zealand, Australia, Asia Pacific, the United Kingdom and Europe.\n\nMark has represented Morgan Stanley, Macquarie, Google, Goldman Sachs, UBS, Lehman Brothers and others. Mark was the APAC program lead for Google Asia Pacific and brings a wealth of commercial and industrial experience to the KMA team.\n\nMark’s combination of trade background with executive leadership has given Mark a unique experience to deliver successful outcomes",
        imageUrl: "/team/team-mark-hamilton.jpg"
      }
    ];

    const teamGrid = document.getElementById('team-grid');
    if (teamGrid) {
      teamData.forEach((member, index) => {
        const delayClass = `delay-${(index % 4) + 1}`;
        const cardHTML = `
          <div class="team-card fade-up ${delayClass}">
            <div class="team-image-wrapper">
              <div class="team-image" style="background-image: url('${member.imageUrl}')"></div>
            </div>
            <div class="team-info">
              <h3 class="team-name">${member.name}</h3>
              <p class="team-role">${member.role}</p>
              <div class="team-meta">
                <p>${member.description.replace(/\n/g, '<br>')}</p>
              </div>
            </div>
          </div>
        `;
        teamGrid.insertAdjacentHTML('beforeend', cardHTML);
      });

      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }

      document.querySelectorAll('#team-grid .fade-up').forEach(el => {
        globalFadeObserver.observe(el);
      });
    }
  }

  // --- Single Project Page Logic ---
  const isProjectPage = currentPath.endsWith('project.html') || currentPath.endsWith('/project');
  if (isProjectPage) {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = parseInt(urlParams.get('id'), 10) || 1;

    const project = projectsData.find(p => p.id === projectId) || projectsData[0];

    // Hydrate DOM
    const heroBg = document.getElementById('project-hero-bg');
    if (heroBg) heroBg.style.backgroundImage = `url('${project.image}')`;

    const titleEl = document.getElementById('project-title');
    if (titleEl) titleEl.textContent = project.title;

    const sidebarTitleEl = document.getElementById('project-sidebar-title');
    if (sidebarTitleEl) sidebarTitleEl.textContent = project.title;

    const descEl = document.getElementById('project-description');
    if (descEl) descEl.textContent = project.description;

    // Metadata
    const metaList = document.getElementById('project-metadata-list');
    if (metaList && project) {
      const metaItems = [
        { key: 'Client', value: project.client, icon: 'user' },
        { key: 'Sector', value: project.sector, icon: 'briefcase' },
        { key: 'Completion', value: project.completion, icon: 'calendar' },
        { key: 'Value', value: project.value, icon: 'circle-dollar-sign' },
        { key: 'Delivery', value: project.delivery, icon: 'truck' },
        { key: 'Services', value: project.services, icon: 'wrench' },
        { key: 'Status', value: project.status, icon: 'check-circle' }
      ];

      metaItems.forEach(item => {
        if (item.value) {
          const li = document.createElement('li');
          li.innerHTML = `<span class="metadata-label"><i data-lucide="${item.icon}"></i> ${item.key}</span> <span class="metadata-value">${item.value}</span>`;
          metaList.appendChild(li);
        }
      });
    }

    // Masonry Gallery
    const galleryContainer = document.getElementById('project-gallery');
    if (galleryContainer && project.gallery) {
      const initMasonry = () => {
        galleryContainer.innerHTML = '';
        const columns = window.innerWidth <= 768 ? 1 : 2;

        const colElements = [];
        for (let i = 0; i < columns; i++) {
          const col = document.createElement('div');
          col.classList.add('masonry-column');
          galleryContainer.appendChild(col);
          colElements.push(col);
        }

        project.gallery.forEach((imgUrl, index) => {
          const item = document.createElement('div');
          item.classList.add('masonry-item');
          item.classList.add('fade-up', `delay-${(index % 4) + 1}`);
          item.innerHTML = `<img src="${imgUrl}" alt="${project.title} gallery image ${index + 1}" loading="lazy">`;

          item.addEventListener('click', () => openLightbox(index));
          colElements[index % columns].appendChild(item);
        });

        document.querySelectorAll('#project-gallery .fade-up').forEach(el => globalFadeObserver.observe(el));
      };

      initMasonry();

      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(initMasonry, 200);
      });
    }

    // Lightbox Logic
    const lightbox = document.getElementById('lightbox-overlay');
    const lightboxImg = document.getElementById('lightbox-image');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');
    const lightboxCounter = document.getElementById('lightbox-counter');

    let currentImageIndex = 0;

    const updateLightbox = () => {
      lightboxImg.classList.remove('loaded');
      setTimeout(() => {
        lightboxImg.src = project.gallery[currentImageIndex];
        if (lightboxCounter) lightboxCounter.textContent = `${currentImageIndex + 1} / ${project.gallery.length}`;
        lightboxImg.onload = () => lightboxImg.classList.add('loaded');
      }, 150);
    };

    const openLightbox = (index) => {
      currentImageIndex = index;
      lightbox.classList.add('active');
      updateLightbox();
    };

    const closeLightbox = () => {
      lightbox.classList.remove('active');
      setTimeout(() => { lightboxImg.src = ''; }, 300);
    };

    if (lightbox) {
      lightboxClose.addEventListener('click', closeLightbox);

      lightboxNext.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex + 1) % project.gallery.length;
        updateLightbox();
      });

      lightboxPrev.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex - 1 + project.gallery.length) % project.gallery.length;
        updateLightbox();
      });

      document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') lightboxNext.click();
        if (e.key === 'ArrowLeft') lightboxPrev.click();
      });
    }

    // --- Explore Other Projects Section Logic ---
    const exploreGrid = document.getElementById('explore-projects-grid');
    if (exploreGrid) {
      // Find the current project's index in the data array
      const currentIndex = projectsData.findIndex(p => p.id === projectId);
      const index = currentIndex !== -1 ? currentIndex : 0;

      // Determine the next 3 projects in the array, wrapping around if necessary
      const exploreProjects = [];
      for (let i = 1; i <= 3; i++) {
        const nextIndex = (index + i) % projectsData.length;
        exploreProjects.push(projectsData[nextIndex]);
      }

      // Clear container just in case
      exploreGrid.innerHTML = '';

      // Render the projects
      exploreProjects.forEach((project, idx) => {
        const delayClass = `delay-${(idx % 8) + 1}`;
        const cardHTML = `
          <div class="project-card fade-up ${delayClass}" onclick="window.location.href='/project.html?id=${project.id}'">
            <div class="project-info">
              <div>
                <h3 class="project-title">${project.title}</h3>
                <span class="project-category-pill">${project.sector}</span>
              </div>
              <ul class="project-meta">
                <li><i data-lucide="calendar"></i> ${project.completion}</li>
                <li><i data-lucide="circle-dollar-sign"></i> ${project.value}</li>
                <li><i data-lucide="check-circle"></i> ${project.status}</li>
              </ul>
            </div>
            <div class="project-image-wrapper">
              <div class="project-image" style="background-image: url('${project.image}')"></div>
            </div>
          </div>
        `;
        exploreGrid.insertAdjacentHTML('beforeend', cardHTML);
      });

      // Re-observe new fade-up elements
      exploreGrid.querySelectorAll('.fade-up').forEach(el => {
        globalFadeObserver.observe(el);
      });

      // Re-attach custom cursor hover events for new cards
      const newCards = exploreGrid.querySelectorAll('.project-card');
      if (cursor && newCards.length > 0) {
        newCards.forEach(card => {
          card.addEventListener('mouseenter', () => cursor.classList.add('active'));
          card.addEventListener('mouseleave', () => cursor.classList.remove('active'));
        });
      }
    }

    // Re-initialize Lucide for newly injected icons
    if (typeof lucide !== 'undefined') {
      setTimeout(() => lucide.createIcons(), 100);
    }
  }

  // --- Parallax & Scroll Effects ---
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;

    // Homepage video parallax
    const heroVideo = document.querySelector('.hero-bg-video');
    if (heroVideo) {
      heroVideo.style.transform = `translateY(${scrolled * 0.4}px)`;
    }

    // Project Page hero background parallax
    const projectHeroBg = document.getElementById('project-hero-bg');
    if (projectHeroBg) {
      projectHeroBg.style.backgroundPositionY = `calc(50% + ${scrolled * 0.4}px)`;
    }

    // Project Page Title fade and slide
    const projectTitle = document.getElementById('project-title');
    if (projectTitle) {
      const opacity = Math.max(0, 1 - scrolled / 400);
      const translateY = Math.min(50, scrolled * 0.15);
      projectTitle.style.opacity = opacity;
      projectTitle.style.transform = `translateY(${translateY}px)`;
    }

    // Team Page hero background parallax
    const teamHeroBg = document.getElementById('team-hero-bg');
    if (teamHeroBg) {
      teamHeroBg.style.backgroundPositionY = `calc(50% + ${scrolled * 0.4}px)`;
    }

    // Team Page Title fade and slide
    const teamHeroTitle = document.getElementById('team-hero-title');
    if (teamHeroTitle) {
      const opacity = Math.max(0, 1 - scrolled / 400);
      const translateY = Math.min(50, scrolled * 0.15);
      teamHeroTitle.style.opacity = opacity;
      teamHeroTitle.style.transform = `translateY(${translateY}px)`;
    }
  });

  // --- Mobile Menu Logic ---
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
  const mobileMenuIcon = document.getElementById('mobile-menu-icon');

  if (mobileMenuBtn && mobileMenuOverlay) {
    mobileMenuBtn.addEventListener('click', () => {
      const isActive = mobileMenuOverlay.classList.contains('active');

      if (isActive) {
        mobileMenuOverlay.classList.remove('active');
        document.body.classList.remove('no-scroll');
        mobileMenuBtn.innerHTML = '<i data-lucide="menu"></i>';
      } else {
        mobileMenuOverlay.classList.add('active');
        document.body.classList.add('no-scroll');
        mobileMenuBtn.innerHTML = '<i data-lucide="x"></i>';
      }

      if (typeof lucide !== 'undefined') {
        lucide.createIcons({ root: mobileMenuBtn });
      }
    });

    const mobileLinks = mobileMenuOverlay.querySelectorAll('a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenuOverlay.classList.remove('active');
        document.body.classList.remove('no-scroll');
        mobileMenuBtn.innerHTML = '<i data-lucide="menu"></i>';
        if (typeof lucide !== 'undefined') {
          lucide.createIcons({ root: mobileMenuBtn });
        }
      });
    });
  }

  // --- Testimonials Slider Logic ---
  const testimonialsContainers = document.querySelectorAll('.testimonials-container');
  if (testimonialsContainers.length > 0) {
    const testimonialsData = [
      {
        quote: "KMA has contributed significantly on all projects with Ignite, leading and managing the delivery of these key projects in a positive and proactive way, ensuring great outcomes for the client. Their detailed management experience and hands on support to the consultant group creates an environment where all can perform to their best in delivering highly complex projects.",
        clientName: "Jeremy Whelan - Managing Director",
        clientBusiness: "Ignite",
        projectImage: "/projects/exchange-1.jpg" // using placeholder images
      },
      {
        quote: "KMA’s commitment to ensuring the success of the West Stand project was highly valued and Eden Park was grateful for the expertise and support in driving the project forward. We look forward to continued collaboration in the future building on what has already been achieved.",
        clientName: "Nick Sautner - CEO",
        clientBusiness: "Eden Park Trust",
        projectImage: "/projects/eden-park-west-stand-1.jpg" // using placeholder images
      },
      {
        quote: "KMA, as Development Managers on 5 Albert Street have contributed significantly to the initial phase of the Development including project marketing, Council consenting, and Design Management.",
        clientName: "Peter Wall",
        clientBusiness: "MAP Limited",
        projectImage: "/projects/5-albert-street-1.jpg" // using placeholder images
      }
    ];

    testimonialsContainers.forEach(container => {
      let html = `
        <div class="testimonial-slider-wrap">
          <div class="testimonial-slides">
      `;

      testimonialsData.forEach((item, index) => {
        html += `
            <div class="testimonial-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
              <div class="testimonial-card-grid">
                <div class="testimonial-image-col">
                  <div class="testimonial-img-wrapper">
                    <img src="${item.projectImage}" alt="${item.clientBusiness} Project" class="testimonial-img">
                  </div>
                </div>
                <div class="testimonial-content-col">
                  <div class="testimonial-quote-icon">“</div>
                  <blockquote class="testimonial-quote-text">${item.quote}</blockquote>
                  <div class="testimonial-meta-info">
                    <cite class="testimonial-client-name">${item.clientName}</cite>
                    <span class="testimonial-client-business">${item.clientBusiness}</span>
                  </div>
                </div>
              </div>
            </div>
        `;
      });

      html += `
          </div>
          <div class="testimonial-controls">
            <button class="testimonial-control-btn prev-testimonial" aria-label="Previous testimonial">
              <i data-lucide="arrow-left"></i>
            </button>
            <span class="testimonial-indicator">1 / ${testimonialsData.length}</span>
            <button class="testimonial-control-btn next-testimonial" aria-label="Next testimonial">
              <i data-lucide="arrow-right"></i>
            </button>
          </div>
        </div>
      `;

      container.innerHTML = html;

      // Initialize Lucide icons inside this container
      if (typeof lucide !== 'undefined') {
        lucide.createIcons({ root: container });
      }

      let currentIndex = 0;
      const slides = container.querySelectorAll('.testimonial-slide');
      const indicator = container.querySelector('.testimonial-indicator');

      const updateSlider = (newIndex) => {
        slides[currentIndex].classList.remove('active');
        currentIndex = newIndex;
        slides[currentIndex].classList.add('active');
        indicator.textContent = `${currentIndex + 1} / ${testimonialsData.length}`;
      };

      container.querySelector('.prev-testimonial').addEventListener('click', () => {
        const newIndex = (currentIndex - 1 + testimonialsData.length) % testimonialsData.length;
        updateSlider(newIndex);
      });

      container.querySelector('.next-testimonial').addEventListener('click', () => {
        const newIndex = (currentIndex + 1) % testimonialsData.length;
        updateSlider(newIndex);
      });
    });
  }

  // --- Floating Hero Scroll Down Button ---
  const heroScrollBtn = document.getElementById('hero-scroll-btn');
  if (heroScrollBtn) {
    heroScrollBtn.addEventListener('click', () => {
      let targetElement = null;

      if (document.querySelector('.project-main-wrapper')) {
        // Project page next section
        targetElement = document.querySelector('.project-main-wrapper');
      } else if (document.getElementById('about')) {
        // Home page next section
        targetElement = document.getElementById('about');
      } else if (document.querySelector('.history-founder-section')) {
        // Team page next section
        targetElement = document.querySelector('.history-founder-section');
      }

      if (targetElement) {
        // Measure the height of the navbar in its scrolled (compact) state to prevent landing misalignments
        const nav = document.getElementById('main-nav');
        let navHeight = 80;
        if (nav) {
          const wasScrolled = nav.classList.contains('scrolled');
          if (!wasScrolled) {
            nav.classList.add('scrolled');
          }
          navHeight = nav.offsetHeight;
          if (!wasScrolled) {
            nav.classList.remove('scrolled');
          }
        }

        const yPosition = targetElement.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({
          top: yPosition,
          behavior: 'smooth'
        });
      }
    });
  }

});
