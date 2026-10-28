// Чистые функции без DOM — их легко проверить отдельно.

const NAME_PATTERN = /^[A-Za-zА-Яа-яЁё]+(?:[\s'-][A-Za-zА-Яа-яЁё]+)*$/

export function validateName(raw: string): string {
  const value = raw.trim().replace(/\s+/g, ' ')
  if (!value) return 'Введите ФИО'
  if (value.length < 2) return 'Слишком короткое имя'
  if (!NAME_PATTERN.test(value)) return 'Только буквы, пробелы и дефис'
  return ''
}

/**
 * Цифры номера с кодом страны: «7» + до 10 цифр.
 * «+7» — фиксированный префикс. Если вставили полный номер «8 999…» или «7 999…»,
 * лишнюю первую цифру срезаем. Одиночную 8 не трогаем: это может быть код города (812).
 */
export function phoneDigits(raw: string): string {
  const value = raw.trim()
  if (!value) return ''
  let national = (value.startsWith('+7') ? value.slice(2) : value).replace(/\D/g, '')
  if (national.length >= 11 && /^[78]/.test(national)) national = national.slice(1)
  return '7' + national.slice(0, 10)
}

/** «79991234567» → «+7 (999) 123-45-67», частичный ввод форматируется по мере набора. */
export function formatPhone(digits: string): string {
  if (!digits) return ''
  const d = digits.slice(1)
  let out = '+7'
  if (d.length > 0) out += ' (' + d.slice(0, 3)
  if (d.length >= 3) out += ')'
  if (d.length > 3) out += ' ' + d.slice(3, 6)
  if (d.length > 6) out += '-' + d.slice(6, 8)
  if (d.length > 8) out += '-' + d.slice(8, 10)
  return out
}

export function validatePhone(raw: string): string {
  const digits = phoneDigits(raw)
  if (digits.length <= 1) return 'Введите номер телефона'
  if (digits.length < 11) return 'Номер должен содержать 10 цифр после +7'
  return ''
}

export function validateConsent(checked: boolean): string {
  return checked ? '' : 'Нужно согласие на обработку персональных данных'
}
