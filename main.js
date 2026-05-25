import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // Add loaded class to body to trigger fade-in and prevent FOUC
  setTimeout(() => document.body.classList.add('loaded'), 50);

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
  }, { root: null, rootMargin: '0px 0px -5% 0px', threshold: 0.05 });

  // Will observe later after DOM is fully ready if needed, 
  // but we can just select them now
  document.querySelectorAll('.fade-up, .expertise-card').forEach(el => {
    globalFadeObserver.observe(el);
  });

  // Sticky Nav Logic
  const nav = document.getElementById('main-nav');
  const heroLogo = document.querySelector('.hero-logo');
  if (nav) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 80) {
        nav.classList.add('scrolled');
        if (heroLogo) heroLogo.classList.add('fade-out');
      } else {
        nav.classList.remove('scrolled');
        if (heroLogo) heroLogo.classList.remove('fade-out');
      }
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
      title: "Skyline Corporate Hub",
      category: "Commercial — Office",
      type: "Commercial",
      location: "Central Business District",
      year: "2022",
      size: "350,000 sq. ft.",
      image: "/projects/skyline-01.jpg",
      description: "A forward-thinking real estate developer specializing in premium commercial spaces sought to create a multi-storied office complex that redefines modern work environments. Their vision included innovative design, sustainability, and high-end facilities tailored to the needs of dynamic businesses.",
      metadata: [
        { key: "Client", value: "Confidential" },
        { key: "Type", value: "Commercial" },
        { key: "Year", value: "2022" },
        { key: "Size", value: "350,000 sq. ft." },
        { key: "Floors", value: "20" },
        { key: "Location", value: "Central Business District" },
        { key: "Services", value: "Architecture, Interior" },
        { key: "Status", value: "Complete" }
      ],
      gallery: [
        "/projects/skyline-01.jpg", "/projects/skyline-02.jpg", "/projects/skyline-03.jpg", "/projects/skyline-04.jpg", "/projects/skyline-05.jpg",
        "/projects/skyline-01.jpg", "/projects/skyline-02.jpg", "/projects/skyline-03.jpg", "/projects/skyline-04.jpg", "/projects/skyline-05.jpg"
      ]
    },
    {
      id: 2,
      title: "Zenith Residential Towers",
      category: "Residential — Multi-Family",
      type: "Residential",
      location: "Waterfront District",
      year: "2024",
      size: "420,000 sq. ft.",
      image: "/projects/zenith-01.jpg",
      description: "Located in the heart of the waterfront district, Zenith Residential Towers offers an unparalleled living experience. The project focuses on maximizing natural light and providing expansive views, all while maintaining a minimal environmental footprint.",
      metadata: [
        { key: "Client", value: "Zenith Holdings" },
        { key: "Type", value: "Residential" },
        { key: "Year", value: "2024" },
        { key: "Size", value: "420,000 sq. ft." },
        { key: "Floors", value: "35" },
        { key: "Location", value: "Waterfront District" },
        { key: "Services", value: "Architecture, Planning" },
        { key: "Status", value: "In Progress" }
      ],
      gallery: [
        "/projects/zenith-01.jpg", "/projects/zenith-02.jpg", "/projects/zenith-03.jpg", "/projects/zenith-04.jpg", "/projects/zenith-05.jpg",
        "/projects/zenith-01.jpg", "/projects/zenith-02.jpg", "/projects/zenith-03.jpg", "/projects/zenith-04.jpg", "/projects/zenith-05.jpg"
      ]
    },
    {
      id: 3,
      title: "Horizon Tech Park",
      category: "Industrial — Logistics",
      type: "Others",
      location: "Westside Corridor",
      year: "2023",
      size: "600,000 sq. ft.",
      image: "/projects/horizon-01.jpg",
      description: "Designed for the future of logistics and technology, Horizon Tech Park integrates highly efficient warehousing with cutting-edge office environments. The layout promotes seamless workflow and incorporates extensive green spaces.",
      metadata: [
        { key: "Client", value: "Global Logistics Ltd" },
        { key: "Type", value: "Industrial" },
        { key: "Year", value: "2023" },
        { key: "Size", value: "600,000 sq. ft." },
        { key: "Location", value: "Westside Corridor" },
        { key: "Services", value: "Architecture, Masterplanning" },
        { key: "Status", value: "Complete" }
      ],
      gallery: [
        "/projects/horizon-01.jpg", "/projects/horizon-02.jpg", "/projects/horizon-03.jpg", "/projects/horizon-04.jpg", "/projects/horizon-05.jpg",
        "/projects/horizon-01.jpg", "/projects/horizon-02.jpg", "/projects/horizon-03.jpg", "/projects/horizon-04.jpg", "/projects/horizon-05.jpg"
      ]
    }
  ];

  const projectsGrid = document.getElementById('projects-grid');
  
  if (projectsGrid) {
    const renderProjects = (filterType = 'All') => {
      // Clear grid
      projectsGrid.innerHTML = '';
      
      const filtered = filterType === 'All' 
        ? projectsData 
        : projectsData.filter(p => p.type === filterType);
        
      filtered.forEach((project, index) => {
        const delayClass = `delay-${(index % 8) + 1}`; 
        
        const cardHTML = `
          <div class="project-card fade-up ${delayClass}" onclick="window.location.href='/project.html?id=${project.id}'">
            <div class="project-info">
              <div>
                <h3 class="project-title">${project.title}</h3>
                <span class="project-category-pill">${project.category}</span>
              </div>
              <ul class="project-meta">
                <li><i data-lucide="map-pin"></i> ${project.location}</li>
                <li><i data-lucide="calendar"></i> ${project.year}</li>
                <li><i data-lucide="maximize"></i> ${project.size}</li>
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
    renderProjects('All');

    // Filter Logic
    const filterPills = document.querySelectorAll('.filter-pill');
    if (filterPills.length > 0) {
      filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
          filterPills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          const type = pill.dataset.filter;
          renderProjects(type);
        });
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
        name: "Sarah Williams",
        role: "Senior Architect",
        qualifications: "M.Arch, AIA",
        expertise: "Commercial & Civic Design",
        imageUrl: "/team/team_member_1.png"
      },
      {
        id: 2,
        name: "David Chen",
        role: "Urban Planner",
        qualifications: "MUP, AICP",
        expertise: "Masterplanning & Sustainability",
        imageUrl: "/team/team_member_2.png"
      },
      {
        id: 3,
        name: "Elena Rodriguez",
        role: "Interior Designer",
        qualifications: "B.F.A. Interior Design",
        expertise: "Hospitality & Retail",
        imageUrl: "/team/team_member_3.png"
      },
      {
        id: 4,
        name: "Marcus Johnson",
        role: "Project Manager",
        qualifications: "PMP, B.S. Construction",
        expertise: "Delivery & Risk Management",
        imageUrl: "/team/team_member_4.png"
      },
      {
        id: 5,
        name: "Aisha Patel",
        role: "Structural Engineer",
        qualifications: "M.S. Structural Engineering, PE",
        expertise: "Industrial & Mixed-Use",
        imageUrl: "/team/team_member_5.png"
      },
      {
        id: 6,
        name: "Tomoko Sato",
        role: "Sustainability Consultant",
        qualifications: "LEED AP BD+C",
        expertise: "Green Building & Efficiency",
        imageUrl: "/team/team_member_6.png"
      },
      {
        id: 7,
        name: "James Nguyen",
        role: "Architectural Technologist",
        qualifications: "B.A.Sc. Architectural Science",
        expertise: "BIM & Digital Modeling",
        imageUrl: "/team/team_member_7.png"
      },
      {
        id: 8,
        name: "Chloe Bennett",
        role: "Landscape Architect",
        qualifications: "MLA, ASLA",
        expertise: "Urban Realm & Masterplanning",
        imageUrl: "/team/team_member_8.png"
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
                <span class="meta-item"><i data-lucide="graduation-cap"></i> ${member.qualifications}</span>
                <span class="meta-item"><i data-lucide="briefcase"></i> ${member.expertise}</span>
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
    if (metaList && project.metadata) {
      project.metadata.forEach(item => {
        let icon = 'info';
        if (item.key === 'Client') icon = 'user';
        if (item.key === 'Type') icon = 'briefcase';
        if (item.key === 'Year') icon = 'calendar';
        if (item.key === 'Size') icon = 'maximize';
        if (item.key === 'Floors') icon = 'layers';
        if (item.key === 'Location') icon = 'map-pin';
        if (item.key === 'Services') icon = 'wrench';
        if (item.key === 'Status') icon = 'check-circle';
        
        const li = document.createElement('li');
        li.innerHTML = `<span class="metadata-label"><i data-lucide="${icon}"></i> ${item.key}</span> <span class="metadata-value">${item.value}</span>`;
        metaList.appendChild(li);
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
  });

  // --- Mobile Menu Logic ---
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
  const mobileMenuIcon = document.getElementById('mobile-menu-icon');

  if (mobileMenuBtn && mobileMenuOverlay && mobileMenuIcon) {
    mobileMenuBtn.addEventListener('click', () => {
      const isActive = mobileMenuOverlay.classList.contains('active');
      
      if (isActive) {
        mobileMenuOverlay.classList.remove('active');
        document.body.classList.remove('no-scroll');
        mobileMenuIcon.setAttribute('data-lucide', 'menu');
      } else {
        mobileMenuOverlay.classList.add('active');
        document.body.classList.add('no-scroll');
        mobileMenuIcon.setAttribute('data-lucide', 'x');
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
        mobileMenuIcon.setAttribute('data-lucide', 'menu');
        if (typeof lucide !== 'undefined') {
          lucide.createIcons({ root: mobileMenuBtn });
        }
      });
    });
  }

});
