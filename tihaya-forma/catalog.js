for (const gallery of document.querySelectorAll('.catalog-gallery')) {
  const track = gallery.querySelector('.catalog-gallery-track');
  const slides = Array.from(track.querySelectorAll('figure'));
  const dots = Array.from(gallery.querySelectorAll('.catalog-gallery-dots button'));
  const previous = gallery.querySelector('.previous');
  const next = gallery.querySelector('.next');

  function visibleIndex() {
    return Math.min(slides.length - 1, Math.round(track.scrollLeft / track.clientWidth));
  }

  function updateDots() {
    const active = visibleIndex();
    dots.forEach((dot, index) => {
      if (index === active) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }

  function showSlide(index) {
    const target = (index + slides.length) % slides.length;
    track.scrollTo({ left: slides[target].offsetLeft });
    updateDots();
  }

  previous.addEventListener('click', () => showSlide(visibleIndex() - 1));
  next.addEventListener('click', () => showSlide(visibleIndex() + 1));
  dots.forEach((dot, index) => dot.addEventListener('click', () => showSlide(index)));
  track.addEventListener('scroll', updateDots, { passive: true });
  track.addEventListener('keydown', event => {
    if (event.target !== track) return;
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    showSlide(visibleIndex() + (event.key === 'ArrowLeft' ? -1 : 1));
  });

  previous.hidden = false;
  next.hidden = false;
  gallery.querySelector('.catalog-gallery-dots').hidden = false;
  updateDots();
}
