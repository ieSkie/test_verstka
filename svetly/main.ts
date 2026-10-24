// Единственный JS на странице — мобильное меню.
// Всё остальное (hover, focus-visible, раскладка) сделано на CSS.

const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]')
const menu = document.querySelector<HTMLElement>('#mobile-nav')

if (toggle && menu) {
  const mobile = window.matchMedia('(max-width: 767px)')

  const setOpen = (open: boolean) => {
    toggle.setAttribute('aria-expanded', String(open))
    toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню')
    menu.hidden = !open
  }

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true')
  })

  // Клик по пункту: закрываем меню, браузер сам переходит по якорю.
  menu.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) setOpen(false)
  })

  // Esc закрывает меню и возвращает фокус на кнопку.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) {
      setOpen(false)
      toggle.focus()
    }
  })

  // Расширили окно до десктопа — открытое меню не должно «зависнуть».
  mobile.addEventListener('change', () => {
    if (!mobile.matches) setOpen(false)
  })
}
