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
    },

    initSDKVersion: async () => {
        const versionEl = document.getElementById('sdk-version');
        if (!versionEl) return;

        try {
            // Fetch package JSON from PyPI
            const response = await fetch('https://pypi.org/pypi/iints-sdk-python35/json');
            if (response.ok) {
                const data = await response.json();
                const latestVersion = data.info.version;
                // Update the text, keeping the context in parentheses if present, or just the version
                versionEl.textContent = `v${latestVersion} (Global Registry Update)`;
            }
        } catch (error) {
            console.warn('Failed to fetch SDK version from PyPI:', error);
            // Fallback is already in HTML, so no action needed on error
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

        if (toggle && nav) {
            toggle.addEventListener('click', () => {
                nav.classList.toggle('is-active');
            });
        }
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
        // Create Lightbox Element
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        const img = document.createElement('img');
        lightbox.appendChild(img);
        document.body.appendChild(lightbox);

        // Close logic
        lightbox.addEventListener('click', () => {
            lightbox.classList.remove('active');
        });

        // Event Delegation: robustly handle clicks on any zoomable image
        document.addEventListener('click', (e) => {
            // Check if the clicked element is an image that should be zoomable
            if (e.target.tagName === 'IMG' && (
                e.target.closest('.gallery-item') ||
                e.target.classList.contains('hero-image') ||
                e.target.closest('.feature-card') ||
                e.target.closest('.story-hero')
            )) {
                e.preventDefault(); // Prevent default link behavior if wrapped
                img.src = e.target.src;
                lightbox.classList.add('active');
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

            local_path: '../js/blog-posts.json'
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
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});