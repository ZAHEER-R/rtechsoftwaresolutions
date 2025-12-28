document.addEventListener('DOMContentLoaded', function () {
	// Mobile nav toggle (right slide panel) with X/☰ icon
	const navToggle = document.querySelector('.nav-toggle');
	const navList = document.querySelector('.nav-list');
	const headerEl = document.querySelector('header');
	const PANEL_OPEN_CLASS = 'open';
	if (navToggle) {
		navToggle.addEventListener('click', () => {
			const isOpen = navList.classList.toggle(PANEL_OPEN_CLASS);
			navToggle.textContent = isOpen ? '✕' : '☰';
			// lock body scroll when menu is open on mobile
			document.body.style.overflow = isOpen ? 'hidden' : '';
		});
		// make sure escape closes the menu
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && navList.classList.contains(PANEL_OPEN_CLASS)) {
				navList.classList.remove(PANEL_OPEN_CLASS);
				navToggle.textContent = '☰';
				document.body.style.overflow = '';
			}
		});
	}

	// Smooth scroll for nav links
	document.querySelectorAll('.nav-list a, .btn[href^="#"]').forEach(link => {
		link.addEventListener('click', function (e) {
			const href = this.getAttribute('href');
			if (!href || !href.startsWith('#')) return;
			e.preventDefault();
			const target = document.querySelector(href);
			if (target) {
				target.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
			// close mobile nav
			if (navList.classList.contains(PANEL_OPEN_CLASS)) {
				navList.classList.remove(PANEL_OPEN_CLASS);
				if (navToggle) navToggle.textContent = '☰';
				// restore scrolling
				document.body.style.overflow = '';
			}
		});
	});

	// IntersectionObserver reveal for elements with animation classes or .reveal
	const revealTargets = document.querySelectorAll('.reveal, .project-card, .policy-block, .team-card, [class*="anim-"]');
	if ('IntersectionObserver' in window) {
		const io = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				const el = entry.target;
				const children = el.querySelectorAll('[class*="anim-"]');
				if (entry.isIntersecting) {
					// add in-view to trigger CSS keyframe animations
					el.classList.add('in-view');
					// stagger children animations if present
					if (children.length) {
						children.forEach((ch, i) => ch.style.animationDelay = `${i * 120}ms`);
					}
				} else {
					// Only remove animations when element is fully out of viewport
					const rect = entry.boundingClientRect;
					const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
					const fullyOut = rect.top > viewportHeight || rect.bottom < 0;
					if (fullyOut) {
						el.classList.remove('in-view');
						if (children.length) {
							children.forEach(ch => ch.style.animationDelay = '');
							// force reflow to ensure animation restarts properly next time
							void el.offsetWidth;
						}
					} else {
						// still partially visible — keep .in-view to avoid jitter
					}
				}
			});
		}, { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.15 });

		revealTargets.forEach(el => io.observe(el));
	} else {
		revealTargets.forEach(el => el.classList.add('in-view'));
	}

	// Back to top button
	const back = document.getElementById('backToTop');
	const toggleBack = () => {
		if (window.scrollY > 360) back.classList.add('show'); else back.classList.remove('show');
	};
	window.addEventListener('scroll', toggleBack);
	toggleBack();
	back.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

	// Contact form handler: POSTs to a Google Apps Script web app URL placed in the form's `data-action` attribute
	// Use your deployed web app URL (deployment id: AKfycbzMAg-Cx8hrcqeFVkHqlvFt3GKFuB1vtXM3ZH4EUG1z-c4lotZshBBY7Wy4nM0Ke-dG)
	const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzMAg-Cx8hrcqeFVkHqlvFt3GKFuB1vtXM3ZH4EUG1z-c4lotZshBBY7Wy4nM0Ke-dG/exec';

	// Modal for showing submission results (replaces alert())
	const formModal = document.getElementById('formModal');
	const formModalBody = formModal ? document.getElementById('formModalBody') : null;
	const modalCloseBtn = formModal ? formModal.querySelector('.modal-close') : null;
	function showFormModal(message, success = true){
		if (!formModal) { alert(message || 'Thank you for reaching out to R‑Tech Software Solutions. Our team will get back to you shortly.'); return; }
		// default success message if none provided
		const msg = message || 'Thank you for reaching out to R‑Tech Software Solutions. Our team will get back to you shortly.';
		formModalBody.textContent = msg;
		formModal.classList.add('open');
		formModal.setAttribute('aria-hidden', 'false');
		const modalBox = formModal.querySelector('.form-modal');
		if(modalBox){ modalBox.classList.toggle('success', !!success); modalBox.classList.toggle('error', !success); }
		// focus close button for keyboard users
		if (modalCloseBtn) modalCloseBtn.focus();
		// store last focused element to restore focus when modal closes
		showFormModal._lastFocus = document.activeElement;
		// add escape handler while modal is open
		document.addEventListener('keydown', _formModalEscHandler);
	}
	function closeFormModal(){
		if (!formModal) return;
		formModal.classList.remove('open');
		formModal.setAttribute('aria-hidden', 'true');
		const modalBox = formModal.querySelector('.form-modal');
		if(modalBox){ modalBox.classList.remove('success'); modalBox.classList.remove('error'); }
		// restore focus to last focused element (usually the submit button)
		try { if (showFormModal._lastFocus && typeof showFormModal._lastFocus.focus === 'function') showFormModal._lastFocus.focus(); } catch(e){/*ignore*/}
		document.removeEventListener('keydown', _formModalEscHandler);
	}
	modalCloseBtn && modalCloseBtn.addEventListener('click', closeFormModal);
	formModal && formModal.addEventListener('click', (e)=>{ if (e.target === formModal) closeFormModal(); });
	function _formModalEscHandler(e){ if (e.key === 'Escape' && formModal && formModal.classList.contains('open')) closeFormModal(); }

	const form = document.getElementById('contactForm');
	// ensure form uses centralized WEB_APP_URL (keeps HTML simple)
	if (form) form.dataset.action = form.dataset.action || WEB_APP_URL;
	if (form) {
		form.addEventListener('submit', function (e) {
			e.preventDefault();
			const action = form.getAttribute('data-action') || form.dataset.action || form.getAttribute('action');
			if (!action) {
				showFormModal('Form submission URL not set. Please add your Google Apps Script web app URL to the form\'s data-action attribute.', false);
				return;
			}

			// collect form data
			const fd = new FormData(form);
			const params = new URLSearchParams();
			for (const [k, v] of fd.entries()) params.append(k, v);

			const submitBtn = form.querySelector('button[type="submit"]');
			const originalLabel = submitBtn ? submitBtn.textContent : null;
			if (submitBtn) {
				submitBtn.disabled = true;
				submitBtn.textContent = 'Sending...';
			}

			fetch(action, {
				method: 'POST',
				headers: { 'Accept': 'application/json' },
				body: params
			}).then(async (res) => {
				let data;
				try { data = await res.json(); } catch (err) { data = null; }
				console.log('Form submit response', res.status, data);
				if (res.ok && (!data || data.status === 'success')) {
					// show a friendly success message (use server message if provided)
					const successMsg = (data && data.message) ? data.message : 'Thanks — message sent.';
					showFormModal(successMsg, true);
					form.reset();
				} else {
					const errMsg = (data && data.message) ? data.message : 'Submission failed. Please try again later.';
					console.error('Form post failed', res.status, data);
					showFormModal(errMsg, false);
				}
			}).catch(err => {
				console.error('Form post error', err);
				showFormModal('Submission failed (network). Please check your connection.', false);
			}).finally(() => {
				if (submitBtn) {
					submitBtn.disabled = false;
					submitBtn.textContent = originalLabel;
				}
			});
		});
	}

	// Splash screen hide after 2s
	const splash = document.getElementById('splash');
	if (splash) {
		setTimeout(() => {
			splash.style.transition = 'opacity 420ms ease';
			splash.style.opacity = '0';
			setTimeout(() => splash.remove(), 520);
		}, 2000);
	}

	// Cookie consent popup - show on first visit unless localStorage set
	(function cookieConsent(){
		const key = 'rtech_cookie_pref';
		const stored = localStorage.getItem(key);
		const popup = document.getElementById('cookieConsent');
		const acceptBtn = document.getElementById('cookieAccept');
		const declineBtn = document.getElementById('cookieDecline');
		if (!popup) return;
		if (stored) {
			// already chosen
			popup.classList.add('hidden');
			return;
		}
		// show by default (it's visible in DOM)
		acceptBtn && acceptBtn.addEventListener('click', () => {
			localStorage.setItem(key, 'accepted');
			popup.classList.add('hidden');
		});
		declineBtn && declineBtn.addEventListener('click', () => {
			localStorage.setItem(key, 'declined');
			popup.classList.add('hidden');
		});
	})();

	// PDF modal open/close (lazy-load iframe)
	(function pdfModal(){
		const openBtns = document.querySelectorAll('.view-pdf');
		const overlay = document.getElementById('pdfModal');
		const iframe = document.getElementById('pdfFrame');
		const closeBtn = overlay ? overlay.querySelector('.pdf-close') : null;
		if (!overlay) return;

		const downloadLink = overlay.querySelector('#pdfDownload');
		openBtns.forEach(btn => btn.addEventListener('click', (e)=>{
			e.preventDefault();
			const src = btn.getAttribute('data-pdf-src') || btn.dataset.pdfSrc;
			if (iframe && src) {
				// lazy-load
				iframe.setAttribute('data-src', src);
				iframe.src = src;
				// set download link href and filename
				if (downloadLink) {
					downloadLink.href = src;
					// try set a reasonable filename
					const filename = (src.split('/').pop() || 'document.pdf').split('?')[0];
					downloadLink.setAttribute('download', filename);
				}
			}
			overlay.classList.add('open');
			overlay.setAttribute('aria-hidden', 'false');
			// lock scroll
			document.body.style.overflow = 'hidden';
		}));

		function closeModal(){
			overlay.classList.remove('open');
			overlay.setAttribute('aria-hidden', 'true');
			// clear src to stop PDF
			if (iframe) {
				iframe.src = '';
				iframe.removeAttribute('data-src');
			}
			if (downloadLink) {
				downloadLink.removeAttribute('href');
				downloadLink.removeAttribute('download');
			}
			// restore scroll
			document.body.style.overflow = '';
		}

		closeBtn && closeBtn.addEventListener('click', closeModal);
		// close when clicking outside modal content
		overlay.addEventListener('click', (ev)=>{
			if (ev.target === overlay) closeModal();
		});
		// also close on Escape (reuse existing listener)
		document.addEventListener('keydown', (e)=>{
			if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
		});
	})();

	// Carousel functionality
	(function initCarousel(){
		const carousel = document.querySelector('.carousel');
		if (!carousel) return;
		const slides = carousel.querySelectorAll('.slide');
		const dotsWrap = carousel.querySelector('.carousel-dots');
		const prev = carousel.querySelector('.carousel-prev');
		const next = carousel.querySelector('.carousel-next');
		let idx = 0; let playing = true; const delay = 5000; let timer;

		// build dots
		slides.forEach((s,i) => {
			const btn = document.createElement('button');
			btn.addEventListener('click', ()=> goTo(i));
			if(i===0) btn.classList.add('active');
			dotsWrap.appendChild(btn);
		});

		const dots = Array.from(dotsWrap.children);

		function update(){
			const width = carousel.clientWidth;
			const elSlides = carousel.querySelector('.slides');
			elSlides.style.transform = `translateX(${-idx*100}%)`;
			slides.forEach(s=> s.classList.remove('flip'));
			slides[idx].classList.add('flip');
			dots.forEach((d,i)=> d.classList.toggle('active', i===idx));
		}
		function goTo(i){ idx = (i+slides.length)%slides.length; update(); resetTimer(); }
		prev.addEventListener('click', ()=> goTo(idx-1));
		next.addEventListener('click', ()=> goTo(idx+1));

		function resetTimer(){ clearInterval(timer); if(playing) timer = setInterval(()=> goTo(idx+1), delay); }
		carousel.addEventListener('mouseenter', ()=> { playing=false; clearInterval(timer); });
		carousel.addEventListener('mouseleave', ()=> { playing=true; resetTimer(); });

		update(); resetTimer();
	})();

	// Active nav link on scroll
	const sections = Array.from(document.querySelectorAll('main section[id]'));
	const navLinks = Array.from(document.querySelectorAll('.nav-list a'));
	const onScroll = () => {
		const y = window.scrollY + 120;
		let currentId = '';
		sections.forEach(section => {
			if (section.offsetTop <= y) currentId = section.id;
		});
		navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + currentId));
	};
	window.addEventListener('scroll', onScroll);
	onScroll();

});
