// Инициализация Аккордеонов
initAccordions();

document.addEventListener('click', function (e) {
  if (e.target.closest('[data-accordion-opener]')) {
    const accordion = e.target.closest('[data-accordion]');
    const accordionItem = e.target.closest('.accordion-item');

    // Если не активен
    if (!accordion.classList.contains('_init')) return;

    if (accordion.dataset.oneAccordion !== undefined) {
      const isOpen = accordionItem.classList.contains('_open');

      accordion
        .querySelectorAll('.accordion-item._open')
        .forEach(accoItem => accoItem.classList.remove('_open'));

      if (isOpen) accordionItem.classList.remove('_open');
      else accordionItem.classList.add('_open');
    } else {
      accordionItem.classList.toggle('_open');
    }
  }
});

window.addEventListener('resize', initAccordions);

function initAccordions() {
  const accordions = document.querySelectorAll('[data-accordion]');

  accordions.forEach(accordion => {
    if (accordion.dataset.accordion === '') {
      accordion.classList.add('_init');
      initAccordionButtons(accordion, 0);
    } else {
      if (window.matchMedia(accordion.dataset.accordion).matches) {
        accordion.classList.add('_init');
        initAccordionButtons(accordion, 0);
      } else {
        accordion.classList.remove('_init');
        initAccordionButtons(accordion, -1);
      }
    }
  });

  function initAccordionButtons(accordion, index) {
    accordion
      .querySelectorAll('[data-accordion-opener]')
      .forEach(accoBtn => (accoBtn.tabIndex = index));
  }
}
