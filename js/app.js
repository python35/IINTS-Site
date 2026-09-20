// Renamed from PRODUCTS to PROJECT_COMPONENTS and translated to English
const app = {
    init: () => {
        app.initNav();
        app.loadBlog();
        app.initLightbox();
        app.initYearsCounter();
        app.initCopyrightYear(); // Call the new function
        app.initHeroCarousel();
        app.initPostReader(); // New reader logic
        app.initSDKVersion(); // Auto-update SDK version
        app.initSpecsCarousel(); // Hardware specifications carousel
        app.initHardwareGallery(); // Hardware gallery carousel
        app.initFolderPreview(); // Interactive 3D folder previews
        app.initTextStream(); // Interactive vertical text stream
        app.initTextStreamPinned(); // Sticky pinned text stream sequence
        app.initTextFillAnimation(); // Obsidian UI text fill animation
        app.initRadialQnA(); // Interactive Clinical Radial Q&A
        app.initEmailCopy(); // Copy email to clipboard in footer
    },

    initSDKVersion: async () => {
        const versionEl = document.getElementById('sdk-version') || document.getElementById('sdk-version-badge');
        if (!versionEl) return;

        try {
            // Fetch package JSON from PyPI
            const response = await fetch('https://pypi.org/pypi/iints-sdk-python35/json');
            if (response.ok) {
                const data = await response.json();
                const latestVersion = data.info.version;
                versionEl.textContent = `v${latestVersion}`;
            }
        } catch (error) {
            console.warn('Failed to fetch SDK version from PyPI:', error);
        }
    },


    currentPosts: [], // Store posts for reading

    initHeroCarousel: () => {
        const carousels = document.querySelectorAll('.hero-carousel');
        if (carousels.length === 0) return;

        carousels.forEach(carousel => {
            const slides = carousel.querySelectorAll('.carousel-slide');
            const dots = carousel.querySelectorAll('.dot');
            let currentSlide = 0;
            let slideInterval;

            const showSlide = (index) => {
                slides.forEach(s => {
                    s.classList.remove('active');
                    // Pause videos in hidden slides
                    const v = s.querySelector('video');
                    if (v) v.pause();
                });
                dots.forEach(d => d.classList.remove('active'));

                slides[index].classList.add('active');
                if (dots[index]) dots[index].classList.add('active');

                // Play video in active slide
                const activeVideo = slides[index].querySelector('video');
                if (activeVideo) activeVideo.play();

                currentSlide = index;
            };

            const nextSlide = () => {
                let next = (currentSlide + 1) % slides.length;
                showSlide(next);
            };

            const startAutoPlay = () => {
                stopAutoPlay();
                slideInterval = setInterval(nextSlide, 5000);
            };

            const stopAutoPlay = () => {
                if (slideInterval) clearInterval(slideInterval);
            };

            if (dots.length > 0) {
                dots.forEach(dot => {
                    dot.addEventListener('click', () => {
                        const index = parseInt(dot.getAttribute('data-index'));
                        showSlide(index);
                        startAutoPlay();
                    });
                });
            }

            carousel.addEventListener('mouseenter', stopAutoPlay);
            carousel.addEventListener('mouseleave', startAutoPlay);

            showSlide(0); // Ensure first slide starts correctly
            startAutoPlay();
        });
    },

    initNav: () => {
        const toggle = document.querySelector('.nav-toggle');
        const nav = document.querySelector('.global-nav');

        if (!toggle || !nav) return;

        // Create overlay element for backdrop blur on mobile
        const overlay = document.createElement('div');
        overlay.className = 'nav-overlay';
        document.body.appendChild(overlay);

        const openNav = () => {
            nav.classList.add('is-active');
            overlay.classList.add('is-visible');
            document.body.style.overflow = 'hidden';
        };

        const closeNav = () => {
            nav.classList.remove('is-active');
            overlay.classList.remove('is-visible');
            document.body.style.overflow = '';
        };

        toggle.addEventListener('click', () => {
            nav.classList.contains('is-active') ? closeNav() : openNav();
        });

        // Close when tapping outside
        overlay.addEventListener('click', closeNav);

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && nav.classList.contains('is-active')) closeNav();
        });

        // Close when a nav link is clicked (smooth UX)
        nav.querySelectorAll('.nav-link:not(.logo)').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) closeNav();
            });
        });
    },

    initYearsCounter: () => {
        const diagnosisDate = new Date('2012-03-07');
        const now = new Date();
        let years = now.getFullYear() - diagnosisDate.getFullYear();
        const m = now.getMonth() - diagnosisDate.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < diagnosisDate.getDate())) {
            years--;
        }

        document.querySelectorAll('.years-count').forEach(el => {
            el.textContent = years;
        });
    },

    initCountdown: function () {
        const countdownDate = new Date("March 27, 2026 00:00:00").getTime();
        const timer = setInterval(function () {
            const now = new Date().getTime();
            const distance = countdownDate - now;

            if (distance < 0) {
                clearInterval(timer);
                const dayEl = document.getElementById("days");
                if (dayEl && dayEl.parentElement) dayEl.parentElement.style.display = "none";
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

            const dayEl = document.getElementById("days");
            const hourEl = document.getElementById("hours");

            if (dayEl) dayEl.innerText = days;
            if (hourEl) hourEl.innerText = hours;
        }, 1000);
    },

    initCopyrightYear: function () {
        const yearSpans = document.querySelectorAll('.current-year');
        yearSpans.forEach(span => {
            span.textContent = new Date().getFullYear();
        });
    },



    initLightbox: () => {
        // Create Lightbox Container with controls
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.innerHTML = `
            <button class="lightbox-close" aria-label="Close image">&times;</button>
            <button class="lightbox-btn prev" aria-label="Previous image">&#10094;</button>
            <div class="lightbox-img-wrap">
                <img src="" alt="Enlarged view">
            </div>
            <button class="lightbox-btn next" aria-label="Next image">&#10095;</button>
            <div class="lightbox-counter"></div>
        `;
        document.body.appendChild(lightbox);

        const img = lightbox.querySelector('img');
        const prevBtn = lightbox.querySelector('.lightbox-btn.prev');
        const nextBtn = lightbox.querySelector('.lightbox-btn.next');
        const closeBtn = lightbox.querySelector('.lightbox-close');
        const counter = lightbox.querySelector('.lightbox-counter');

        let galleryImages = [];
        let currentIndex = 0;

        const updateGalleryList = () => {
            const items = Array.from(document.querySelectorAll('.gallery-item img'));
            if (items.length > 0) {
                galleryImages = items.map(el => ({
                    src: el.src,
                    alt: el.alt || 'Prototype photo'
                }));
            } else {
                galleryImages = [];
            }
        };

        const showLightboxImage = (index) => {
            if (galleryImages.length === 0) return;
            if (index < 0) index = galleryImages.length - 1;
            if (index >= galleryImages.length) index = 0;
            currentIndex = index;

            img.src = galleryImages[currentIndex].src;
            img.alt = galleryImages[currentIndex].alt;
            if (counter) {
                counter.textContent = `${currentIndex + 1} / ${galleryImages.length}`;
            }
        };

        const openLightbox = (src) => {
            updateGalleryList();
            const foundIndex = galleryImages.findIndex(item => item.src === src);
            currentIndex = foundIndex !== -1 ? foundIndex : 0;
            showLightboxImage(currentIndex);
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        const closeLightbox = () => {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        };

        closeBtn.addEventListener('click', closeLightbox);

        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showLightboxImage(currentIndex - 1);
        });

        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showLightboxImage(currentIndex + 1);
        });

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox || e.target.classList.contains('lightbox-img-wrap')) {
                closeLightbox();
            }
        });

        // Keyboard Arrow Key Navigation (← and →) + Escape
        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('active')) return;
            if (e.key === 'ArrowLeft') {
                showLightboxImage(currentIndex - 1);
            } else if (e.key === 'ArrowRight') {
                showLightboxImage(currentIndex + 1);
            } else if (e.key === 'Escape') {
                closeLightbox();
            }
        });

        // Touch swipe support for mobile lightbox
        let touchStartX = 0;
        let touchEndX = 0;
        lightbox.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        lightbox.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            if (touchStartX - touchEndX > 50) {
                showLightboxImage(currentIndex + 1);
            } else if (touchEndX - touchStartX > 50) {
                showLightboxImage(currentIndex - 1);
            }
        }, { passive: true });

        // Event Delegation: handle clicks on any zoomable image or gallery item
        document.addEventListener('click', (e) => {
            const galleryItem = e.target.closest('.gallery-item');
            if (galleryItem) {
                const targetImg = galleryItem.querySelector('img');
                if (targetImg) {
                    e.preventDefault();
                    openLightbox(targetImg.src);
                    return;
                }
            }

            if (e.target.tagName === 'IMG' && (
                e.target.classList.contains('hero-image') ||
                e.target.closest('.feature-card') ||
                e.target.closest('.story-hero')
            )) {
                e.preventDefault();
                openLightbox(e.target.src);
            }
        });
    },

    loadBlog: async () => {
        const container = document.getElementById('blog-container');
        if (!container) return;

        // --- BLOG CONFIGURATION ---
        // Choose your mode: 'contentful', 'sheets', or 'local'
        const BLOG_CONFIG = {
            mode: 'contentful',

            // If using 'contentful':
            contentful: {
                space_id: 'yy41p8fx3jlq',
                access_token: '3L4YzwsaBYQTQfa5E0vfLL1YORQooQZNR1y2j79YdGE',
                content_type: 'blogPost'
            },

            // If using 'sheets':
            sheets: {
                id: ''
            },

            // Dynamic pathing for both Local & GitHub Pages
            local_path: window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html')
                ? 'js/blog-posts.json'
                : '../js/blog-posts.json'
        };
        // --------------------------

        try {
            let posts = [];

            if (BLOG_CONFIG.mode === 'contentful' && BLOG_CONFIG.contentful.space_id) {
                const { space_id, access_token, content_type } = BLOG_CONFIG.contentful;
                const url = `https://cdn.contentful.com/spaces/${space_id}/environments/master/entries?access_token=${access_token}&content_type=${content_type}`;
                const response = await fetch(url);
                const data = await response.json();

                posts = data.items.map(item => {
                    const f = item.fields;

                    // Robust Content Extraction (supports 'body' or 'content')
                    let bodyHtml = '';
                    const richTextField = f.body || f.content;

                    if (richTextField && richTextField.nodeType === 'document') {
                        bodyHtml = richTextField.content.map(node => {
                            if (node.nodeType === 'paragraph') {
                                return `<p>${node.content.map(c => c.value || '').join('')}</p>`;
                            }
                            if (node.nodeType === 'embedded-asset-block') {
                                const assetId = node.data.target.sys.id;
                                const asset = data.includes?.Asset?.find(a => a.sys.id === assetId);
                                if (asset) {
                                    let url = asset.fields.file.url;
                                    if (url.startsWith('//')) url = 'https:' + url;
                                    return `<img src="${url}" alt="${asset.fields.title || ''}" style="width:100%; border-radius:12px; margin: 2rem 0; box-shadow: var(--shadow-soft);">`;
                                }
                            }
                            return '';
                        }).join('');
                    } else if (typeof richTextField === 'string') {
                        bodyHtml = `<p>${richTextField}</p>`;
                    } else {
                        bodyHtml = '<p>No content available.</p>';
                    }

                    // Robust Image extraction (Thumbnail or Image)
                    const assetLink = f.thumbnail || f.image;
                    const assetId = assetLink?.sys?.id;
                    const asset = data.includes?.Asset?.find(a => a.sys.id === assetId);
                    const imageUrl = asset ? asset.fields.file.url : '';

                    return {
                        title: f.title || 'Untitled Research',
                        date: f.publishDate ? new Date(f.publishDate).toLocaleDateString() : new Date(item.sys.createdAt).toLocaleDateString(),
                        category: f.category || 'Update',
                        summary: f.excerpt || f.summary || (bodyHtml.replace(/<[^>]*>/g, '').substring(0, 150) + '...'),
                        content: bodyHtml,
                        image: imageUrl ? (imageUrl.startsWith('//') ? 'https:' + imageUrl : imageUrl) : ''
                    };
                });
            }
            else if (BLOG_CONFIG.mode === 'sheets' && BLOG_CONFIG.sheets.id) {
                const url = `https://docs.google.com/spreadsheets/d/${BLOG_CONFIG.sheets.id}/gviz/tq?tqx=out:json`;
                const response = await fetch(url);
                const text = await response.text();
                const json = JSON.parse(text.substring(47).slice(0, -2));

                posts = json.table.rows.map(row => ({
                    title: row.c[0] ? row.c[0].v : '',
                    date: row.c[1] ? row.c[1].v : '',
                    category: row.c[2] ? row.c[2].v : '',
                    summary: row.c[3] ? row.c[3].v : '',
                    content: row.c[4] ? row.c[4].v : '',
                    image: row.c[5] ? row.c[5].v : ''
                })).reverse();
            }
            else {
                const response = await fetch(BLOG_CONFIG.local_path);
                posts = await response.json();
            }

            app.currentPosts = posts; // Store globally
            app.renderPosts(posts, container);

        } catch (error) {
            console.error('Error loading blog:', error);
            container.innerHTML = '<p>Could not load blog posts. Check your config or connection.</p>';
        }
    },

    initPostReader: () => {
        const reader = document.getElementById('post-reader');
        if (!reader) return;

        const closeBtns = [
            document.querySelector('.post-reader-close'),
            document.querySelector('.close-reader-btn')
        ];

        const closeReader = () => {
            reader.classList.remove('is-active');
            document.body.style.overflow = ''; // Restore scroll
        };

        closeBtns.forEach(btn => {
            if (btn) btn.addEventListener('click', closeReader);
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeReader();
        });
    },

    openReader: (index) => {
        const post = app.currentPosts[index];
        if (!post) return;

        const reader = document.getElementById('post-reader');
        const title = document.getElementById('post-title');
        const cat = document.getElementById('post-category');
        const meta = document.getElementById('post-meta');
        const body = document.getElementById('post-body');
        const img = document.getElementById('post-image');

        title.textContent = post.title;
        cat.textContent = post.category;
        meta.textContent = post.date;
        body.innerHTML = post.content || '<p>No content available.</p>';

        if (post.image) {
            let imgSrc = post.image;
            if (!imgSrc.startsWith('http') && !imgSrc.startsWith('//')) {
                imgSrc = `../img/${imgSrc}`;
            }
            img.src = imgSrc;
            img.style.display = 'block';
        } else {
            img.style.display = 'none';
        }

        reader.classList.add('is-active');
        reader.scrollTop = 0;
        document.body.style.overflow = 'hidden'; // Stop background scroll
    },

    renderPosts: (posts, container) => {
        if (!posts || posts.length === 0) {
            container.innerHTML = '<p>No posts yet.</p>';
            return;
        }

        const html = posts.map((post, index) => {
            // Determine image path (handle full URLs from CMS vs local paths)
            let imgSrc = post.image || '../img/placeholder.jpg';
            if (imgSrc && !imgSrc.startsWith('http') && !imgSrc.startsWith('//')) {
                imgSrc = `../img/${imgSrc}`;
            }

            return `
                <article onclick="app.openReader(${index})" style="background: #fff; padding: 2rem; border-radius: 12px; border: 1px solid #eee; margin-bottom: 2rem; text-align: left; display: flex; gap: 2rem; align-items: start; cursor: pointer; transition: transform 0.3s ease, box-shadow 0.3s ease;" class="blog-card-hover">
                    <div style="flex: 1;">
                        <span class="badge badge-green" style="font-size: 0.7rem; margin-bottom: 0.5rem; display: inline-block;">${post.category}</span>
                        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; color: #1d1d1f;">${post.title}</h2>
                        <p style="font-size: 0.9rem; color: #aaa; margin-bottom: 1rem;">${post.date}</p>
                        <p style="color: #555; line-height: 1.6; margin-bottom: 1.5rem;">${post.summary}</p>
                        
                        <div style="background: #f0f7ff; border-left: 4px solid var(--clinical-blue); padding: 1rem; border-radius: 0 8px 8px 0; font-size: 0.9rem;">
                            <p style="margin: 0; color: #333;">
                                <strong>Read full research log</strong> <i class="fas fa-arrow-right" style="margin-left: 5px; font-size: 0.8rem;"></i>
                            </p>
                        </div>
                    </div>
                    <div style="width: 150px; height: 100px; background: #f5f5f7; border-radius: 8px; flex-shrink: 0; overflow: hidden;">
                        <img src="${imgSrc}" alt="${post.title}" width="150" height="100" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                </article>
                `;
        }).join('');

        container.innerHTML = html;
    },

    initSpecsCarousel: () => {
        const wrapper = document.querySelector('.specs-carousel-wrapper');
        if (!wrapper) return;

        const slides = wrapper.querySelectorAll('.specs-slide');
        const tabBtns = wrapper.querySelectorAll('.specs-tab-btn');
        const prevBtn = wrapper.querySelector('.specs-nav-btn.prev');
        const nextBtn = wrapper.querySelector('.specs-nav-btn.next');
        const counterEl = wrapper.querySelector('.specs-counter');

        if (slides.length === 0) return;

        let currentIndex = 0;

        const showSlide = (index) => {
            if (index < 0) index = slides.length - 1;
            if (index >= slides.length) index = 0;
            currentIndex = index;

            slides.forEach((slide, idx) => {
                slide.classList.toggle('active', idx === currentIndex);
            });

            tabBtns.forEach((btn, idx) => {
                btn.classList.toggle('active', idx === currentIndex);
            });

            if (counterEl) {
                counterEl.textContent = `${currentIndex + 1} / ${slides.length}`;
            }
        };

        tabBtns.forEach((btn, idx) => {
            btn.addEventListener('click', () => showSlide(idx));
        });

        if (prevBtn) {
            prevBtn.addEventListener('click', () => showSlide(currentIndex - 1));
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => showSlide(currentIndex + 1));
        }

        showSlide(0);
    },

    initHardwareGallery: () => {
        const carousel = document.querySelector('.hw-gallery-carousel');
        if (!carousel) return;

        const slides = carousel.querySelectorAll('.hw-carousel-slide');
        const dots = carousel.parentElement.querySelectorAll('.hw-carousel-dot');
        const prevBtn = carousel.querySelector('.hw-carousel-btn.prev');
        const nextBtn = carousel.querySelector('.hw-carousel-btn.next');

        if (slides.length === 0) return;

        let currentIndex = 0;

        const showSlide = (index) => {
            if (index < 0) index = slides.length - 1;
            if (index >= slides.length) index = 0;
            currentIndex = index;

            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === currentIndex);
            });

            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentIndex);
            });
        };

        if (prevBtn) {
            prevBtn.addEventListener('click', () => showSlide(currentIndex - 1));
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => showSlide(currentIndex + 1));
        }

        dots.forEach((dot, i) => {
            dot.addEventListener('click', () => showSlide(i));
        });

        // Touch swipe support for mobile
        let touchStartX = 0;
        let touchEndX = 0;

        carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        carousel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            if (touchStartX - touchEndX > 50) {
                showSlide(currentIndex + 1);
            } else if (touchEndX - touchStartX > 50) {
                showSlide(currentIndex - 1);
            }
        }, { passive: true });

        showSlide(0);
    },

    // 3D Folder Preview Interactive Logic
    initFolderPreview: () => {
        const folders = document.querySelectorAll('.folder-preview');
        if (!folders.length) return;

        folders.forEach(folder => {
            const thumbs = folder.querySelectorAll('.folder-preview__thumb');
            const count = thumbs.length;

            // Automatically calculate circular arc coordinates if not manually set via CSS
            if (count > 0 && !folder.classList.contains('folder-preview--cards')) {
                const isLg = folder.classList.contains('folder-preview--lg');
                const isSm = folder.classList.contains('folder-preview--sm');
                const defaultRadius = isLg ? 115 : (isSm ? 65 : 90);
                const radius = parseFloat(folder.dataset.radius) || defaultRadius;

                thumbs.forEach((thumb, i) => {
                    // Staggered arc across the top semi-circle
                    const startAngle = Math.PI / count;
                    const angle = (startAngle / 2) + (startAngle * i);
                    const x = Math.round(radius * Math.cos(angle) * -1); // mirror so left-to-right
                    const y = Math.round(-radius * Math.sin(angle));
                    const delay = ((count - i - 1) * 0.04).toFixed(2);

                    thumb.style.setProperty('--pop-x', `${x}px`);
                    thumb.style.setProperty('--pop-y', `${y}px`);
                    thumb.style.transitionDelay = `${delay}s`;
                });
            }

            // Click / Tap Toggle (great for mobile & touchscreens)
            folder.addEventListener('click', (e) => {
                // If clicking an inner interactive link inside a thumbnail, don't prevent navigation
                if (e.target.closest('a') && !e.target.closest('.folder-preview__wrapper')) return;

                const isOpen = folder.classList.contains('is-open');
                folders.forEach(f => f.classList.remove('is-open'));
                if (!isOpen) {
                    folder.classList.add('is-open');
                }
            });

            // Keyboard Accessibility (Enter / Space to toggle)
            folder.setAttribute('tabindex', '0');
            folder.setAttribute('role', 'button');
            folder.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    folder.classList.toggle('is-open');
                }
            });
        });

        // Close folders when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.folder-preview')) {
                folders.forEach(f => f.classList.remove('is-open'));
            }
        });
    },

    // Obsidian Text Stream Component (Vertical Scroll Momentum)
    initTextStream: () => {
        const streams = document.querySelectorAll('.obsidian-text-stream');
        if (!streams.length) return;

        // Check reduced motion preference
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        streams.forEach(stream => {
            // On desktop, pinned sections use initTextStreamPinned; on mobile, pinned sections use the compact momentum stream
            const pinnedSec = stream.closest('.text-stream-pinned-section');
            if (pinnedSec && window.innerWidth > 768) return;

            const viewport = stream.querySelector('.obsidian-text-stream__viewport');
            const track = stream.querySelector('.obsidian-text-stream__track');
            const initialCopy = stream.querySelector('.obsidian-text-stream__copy');
            if (!viewport || !track || !initialCopy) return;

            let items = [];
            if (stream.dataset.items) {
                try {
                    items = JSON.parse(stream.dataset.items);
                } catch (e) {
                    console.warn('Invalid JSON in data-items:', stream.dataset.items);
                }
            }

            if (items.length > 0) {
                initialCopy.innerHTML = items.map(text => `<div class="obsidian-text-stream__item">${text}</div>`).join('');
            }

            let copyCount = 2;
            let distance = 0;
            let currentY = 0;
            let currentVelocity = 0.6;
            let targetVelocity = 0.6;
            let lastScrollDirection = 1;
            let scrollTimeout = null;
            const baseSpeed = 0.6;
            const maxBoost = 12;

            function wrap(min, max, v) {
                const range = max - min;
                return ((((v - min) % range) + range) % range) + min;
            }

            function setupCopies() {
                distance = initialCopy.offsetHeight;
                const containerHeight = viewport.offsetHeight;
                if (!distance || !containerHeight) return;

                const neededCount = Math.max(2, Math.ceil(containerHeight / distance) + 2);
                if (neededCount !== copyCount) {
                    copyCount = neededCount;
                    // Remove old copies except initialCopy
                    const existingCopies = track.querySelectorAll('.obsidian-text-stream__copy');
                    existingCopies.forEach((c, idx) => {
                        if (idx > 0) c.remove();
                    });

                    // Add new copies
                    for (let i = 1; i < copyCount; i++) {
                        const clone = initialCopy.cloneNode(true);
                        clone.setAttribute('aria-hidden', 'true');
                        track.appendChild(clone);
                    }
                }

                currentY = wrap(-distance, 0, currentY);
                track.style.transform = `translateY(${currentY}px)`;
            }

            const applyScrollMotion = (delta) => {
                if (!delta) return;
                const direction = delta > 0 ? -1 : 1;
                const boost = Math.min(maxBoost, baseSpeed + Math.pow(Math.abs(delta), 1.2) * 0.08);
                lastScrollDirection = direction;
                targetVelocity = direction * boost;

                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    targetVelocity = lastScrollDirection * baseSpeed;
                }, 120);
            };

            let lastScrollY = window.scrollY;
            const handleScroll = () => {
                const next = window.scrollY;
                applyScrollMotion(next - lastScrollY);
                lastScrollY = next;
            };

            const handleWheel = (e) => {
                applyScrollMotion(e.deltaY);
            };

            window.addEventListener('scroll', handleScroll, { passive: true });
            window.addEventListener('wheel', handleWheel, { passive: true });

            setupCopies();

            if (window.ResizeObserver) {
                const ro = new ResizeObserver(setupCopies);
                ro.observe(initialCopy);
                ro.observe(viewport);
            }
            window.addEventListener('resize', setupCopies);

            let lastTime = performance.now();

            function tick(now) {
                const deltaTime = now - lastTime;
                lastTime = now;
                const frameFactor = Math.min(deltaTime / (1000 / 60), 3);

                if (distance > 0) {
                    currentVelocity += (targetVelocity - currentVelocity) * 0.14;
                    currentY += currentVelocity * frameFactor;
                    currentY = wrap(-distance, 0, currentY);
                    track.style.transform = `translateY(${currentY}px)`;
                }

                requestAnimationFrame(tick);
            }

            requestAnimationFrame(tick);
        });
    },

    // Sticky Pinned Text Stream Sequence (Homepage Scroll Exploration)
    initTextStreamPinned: () => {
        const pinnedSections = document.querySelectorAll('.text-stream-pinned-section');
        if (!pinnedSections.length) return;

        pinnedSections.forEach(section => {
            const viewport = section.querySelector('.obsidian-text-stream__viewport');
            const track = section.querySelector('.obsidian-text-stream__track');
            const progressBar = section.querySelector('.text-stream-progress-bar');
            const hintEl = section.querySelector('.text-stream-scroll-lock-hint');
            if (!viewport || !track) return;

            // On mobile (<= 768px), do not pin or lock scroll; handled by compact stream
            if (window.innerWidth <= 768) return;

            // Ensure single copy of items exists
            const copies = track.querySelectorAll('.obsidian-text-stream__copy');
            if (copies.length > 1) {
                copies.forEach((c, idx) => {
                    if (idx > 0) c.remove();
                });
            }

            const items = Array.from(track.querySelectorAll('.obsidian-text-stream__item'));
            if (!items.length) return;

            let ticking = false;

            const updatePinned = () => {
                const rect = section.getBoundingClientRect();
                const windowH = window.innerHeight;
                const totalScroll = section.offsetHeight - windowH;
                if (totalScroll <= 0) {
                    ticking = false;
                    return;
                }

                // Progress: 0 when top of section meets top of viewport, 1 when pinned scroll finishes
                const rawProgress = -rect.top / totalScroll;
                const progress = Math.min(Math.max(rawProgress, 0), 1);

                // Update progress bar
                if (progressBar) {
                    progressBar.style.height = `${(progress * 100).toFixed(1)}%`;
                }

                // Update scroll lock hint indicator
                if (hintEl) {
                    if (progress >= 0.94) {
                        hintEl.classList.add('unlocked');
                        hintEl.innerHTML = '<span class="hint-text">Continue scrolling</span> <i class="fas fa-arrow-down"></i>';
                    } else {
                        hintEl.classList.remove('unlocked');
                        hintEl.innerHTML = '<span class="hint-text">Scroll to explore</span> <i class="fas fa-chevron-down"></i>';
                    }
                }

                // Center each item smoothly within viewport as user scrolls
                const vCenter = viewport.offsetHeight / 2;
                const firstItem = items[0];
                const lastItem = items[items.length - 1];

                const firstCenter = firstItem.offsetTop + (firstItem.offsetHeight / 2);
                const lastCenter = lastItem.offsetTop + (lastItem.offsetHeight / 2);

                const startY = vCenter - firstCenter;
                const endY = vCenter - lastCenter;

                const currentY = startY + (endY - startY) * progress;
                track.style.transform = `translateY(${currentY.toFixed(2)}px)`;

                // Focus styling: scale up and boost opacity of the currently active principle
                const activeProgressIdx = progress * (items.length - 1);
                items.forEach((item, idx) => {
                    const dist = Math.abs(idx - activeProgressIdx);
                    if (dist < 0.45) {
                        item.style.opacity = '1';
                        item.style.transform = 'scale(1.02)';
                    } else {
                        const op = Math.max(0.28, 1 - dist * 0.42);
                        item.style.opacity = op.toFixed(2);
                        item.style.transform = 'scale(1)';
                    }
                });

                ticking = false;
            };

            const onScroll = () => {
                if (!ticking) {
                    requestAnimationFrame(updatePinned);
                    ticking = true;
                }
            };

            window.addEventListener('scroll', onScroll, { passive: true });
            window.addEventListener('resize', onScroll, { passive: true });
            updatePinned();
        });
    },

    // Text Fill Animation (Obsidian UI Native Port for Hardware)
    initTextFillAnimation: () => {
        const sections = document.querySelectorAll('.obsidian-text-fill');
        if (!sections.length) return;

        sections.forEach(section => {
            const heading = section.querySelector('.tfa-heading');
            if (!heading) return;

            // Preserve whitespace and split characters within inline-block words
            const rawText = heading.textContent.trim();
            const words = rawText.split(/\s+/);
            
            heading.innerHTML = '';
            const allChars = [];

            words.forEach((word, wordIdx) => {
                const wordSpan = document.createElement('span');
                wordSpan.className = 'tfa-word';
                wordSpan.style.display = 'inline-block';
                wordSpan.style.whiteSpace = 'nowrap';

                for (let i = 0; i < word.length; i++) {
                    const charSpan = document.createElement('span');
                    charSpan.className = 'split-char';
                    charSpan.textContent = word[i];
                    wordSpan.appendChild(charSpan);
                    allChars.push(charSpan);
                }

                heading.appendChild(wordSpan);

                // Add space after word if not the last
                if (wordIdx < words.length - 1) {
                    heading.appendChild(document.createTextNode(' '));
                }
            });

            section._chars = allChars;
        });

        let ticking = false;
        const updateFill = () => {
            const windowH = window.innerHeight;

            sections.forEach(section => {
                if (!section._chars || !section._chars.length) return;
                const rect = section.getBoundingClientRect();
                const totalScroll = section.offsetHeight - windowH;
                if (totalScroll <= 0) return;

                const rawProgress = -rect.top / totalScroll;
                const progress = Math.min(Math.max(rawProgress, 0), 1);

                // Continuous smooth light wave spanning ~8 characters (no harsh/strakke letter snaps)
                const fillProgress = Math.min(Math.max((progress - 0.04) / 0.90, 0), 1);
                const totalChars = section._chars.length;
                const waveWidth = 8;
                const floatPos = fillProgress * (totalChars + waveWidth);

                for (let i = 0; i < totalChars; i++) {
                    const charEl = section._chars[i];
                    const dist = floatPos - i;

                    if (dist >= waveWidth) {
                        charEl.style.opacity = '1';
                        charEl.style.color = '#ffffff';
                    } else if (dist <= 0) {
                        charEl.style.opacity = '0.2';
                        charEl.style.color = 'rgba(255, 255, 255, 0.7)';
                    } else {
                        const t = dist / waveWidth;
                        const s = t * t * (3 - 2 * t);

                        charEl.style.opacity = (0.2 + 0.8 * s).toFixed(3);

                        if (s < 0.5) {
                            const f = s / 0.5;
                            const r = Math.round(180 - (180 - 100) * f);
                            const g = Math.round(200 - (200 - 190) * f);
                            const b = Math.round(220 + (255 - 220) * f);
                            charEl.style.color = `rgb(${r}, ${g}, ${b})`;
                        } else {
                            const f = (s - 0.5) / 0.5;
                            const r = Math.round(100 + (255 - 100) * f);
                            const g = Math.round(190 + (255 - 190) * f);
                            const b = 255;
                            charEl.style.color = `rgb(${r}, ${g}, ${b})`;
                        }
                    }
                }
            });

            ticking = false;
        };

        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(updateFill);
                ticking = true;
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        updateFill();
    },

    // Interactive Clinical Radial Q&A
    initRadialQnA: () => {
        const grid = document.getElementById('qna-radial-grid');
        const wrapper = document.getElementById('qna-radial-wrapper');
        const hubBtn = document.getElementById('qna-hub-btn');
        const satellites = document.querySelectorAll('.qna-satellite-btn');

        const placeholderEl = document.getElementById('qna-placeholder');
        const contentEl = document.getElementById('qna-card-content');
        const topicEl = document.getElementById('qna-topic-pill');
        const indicatorEl = document.getElementById('qna-index-indicator');
        const titleEl = document.getElementById('qna-card-title');
        const bodyEl = document.getElementById('qna-card-body');

        if (!wrapper || !satellites.length) return;

        const qnaData = [
            {
                topic: 'Safety & Clinical Scope',
                question: 'Is IINTS approved for clinical use on humans?',
                answer: 'No. IINTS and IINTS-AF are independent, non-commercial scientific and educational research prototypes. They are strictly not intended for diagnosis, treatment, or insulin administration in humans.'
            },
            {
                topic: 'Mission & Purpose',
                question: 'Why build an insulin pump when commercial pumps already exist?',
                answer: 'IINTS does not replace commercial medical devices. It was born from a patient\'s fundamental question: what actually happens behind the scenes of an insulin pump? Building the technology from scratch demystifies how mechanics, electronics, and software work together.'
            },
            {
                topic: 'Digital Twin & Simulation',
                question: 'What is IINTS-AF and what is a Digital Twin?',
                answer: 'IINTS-AF is an open-source software research framework. It uses mathematical Digital Twins to model human glucose-insulin dynamics in simulation, enabling algorithmic evaluation without exposing patients to untested code.'
            },
            {
                topic: 'AI Safety & Guardrails',
                question: 'How do you safely evaluate AI and machine learning?',
                answer: 'AI models operate strictly within offline simulation sandboxes and are governed by deterministic rule-based safety supervisors. No experimental AI autonomously delivers insulin on physical hardware.'
            },
            {
                topic: 'Hardware Architecture',
                question: 'Can I inspect and build the hardware demonstrator?',
                answer: 'Yes. Schematics, CAD models, and RP2040 firmware are open source. The physical demonstrator reveals leadscrew displacement and stepper control to help researchers and makers understand pump mechanics.'
            },
            {
                topic: 'Open Science & Reproducibility',
                question: 'How does IINTS handle reproducibility and open science?',
                answer: 'All simulations log parameter configurations, seed manifests, and boundary conditions. Results, algorithms, and documentation are published openly to foster collaborative scientific verification.'
            }
        ];

        const selectTopic = (index) => {
            if (index < 0 || index >= qnaData.length) return;
            const data = qnaData[index];

            // If the radial menu is collapsed when a topic is selected, open it
            if (wrapper.classList.contains('is-collapsed')) {
                wrapper.classList.remove('is-collapsed');
                if (grid) grid.classList.remove('is-collapsed');
                if (hubBtn) {
                    hubBtn.setAttribute('aria-expanded', 'true');
                    hubBtn.setAttribute('title', 'Close Radial Menu');
                }
            }

            satellites.forEach((btn, i) => {
                btn.classList.toggle('active', i === index);
            });

            // Hide placeholder if visible
            if (placeholderEl && placeholderEl.style.display !== 'none') {
                placeholderEl.style.display = 'none';
            }
            if (contentEl && contentEl.style.display === 'none') {
                contentEl.style.display = 'block';
            }

            if (contentEl) {
                // Fluid reveal animation with forced layout reflow for consistent replay
                contentEl.classList.remove('is-revealed');
                void contentEl.offsetWidth;

                if (titleEl) titleEl.textContent = data.question;
                if (bodyEl) bodyEl.textContent = data.answer;
                if (topicEl) topicEl.textContent = data.topic;
                if (indicatorEl) indicatorEl.textContent = `0${index + 1} / 0${qnaData.length}`;

                requestAnimationFrame(() => {
                    contentEl.classList.add('is-revealed');
                });
            }
        };

        satellites.forEach((btn, i) => {
            btn.addEventListener('click', () => {
                selectTopic(i);
            });
        });

        // Center hub toggle: collapsed by default, clicks toggle expand/collapse
        if (hubBtn) {
            hubBtn.addEventListener('click', () => {
                const isNowCollapsed = wrapper.classList.toggle('is-collapsed');
                if (grid) {
                    grid.classList.toggle('is-collapsed', isNowCollapsed);
                }
                hubBtn.setAttribute('aria-expanded', !isNowCollapsed);
                hubBtn.setAttribute('title', isNowCollapsed ? 'Open Radial Menu' : 'Close Radial Menu');
            });
        }
    },

    // Footer Email Clipboard Copy
    initEmailCopy: () => {
        const emailLinks = document.querySelectorAll('a[href^="mailto:rune.bobbaers@gmail.com"]');
        if (!emailLinks.length) return;

        emailLinks.forEach(link => {
            link.setAttribute('title', 'Click to copy rune.bobbaers@gmail.com');
            link.style.cursor = 'pointer';

            link.addEventListener('click', (e) => {
                e.preventDefault();
                const email = 'rune.bobbaers@gmail.com';

                navigator.clipboard.writeText(email).then(() => {
                    const originalHTML = link.innerHTML;
                    link.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Copied!';

                    setTimeout(() => {
                        link.innerHTML = originalHTML;
                    }, 2200);
                }).catch(err => {
                    console.warn('Clipboard copy failed:', err);
                    window.location.href = link.href;
                });
            });
        });
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});