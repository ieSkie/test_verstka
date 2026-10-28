import {
  formatPhone,
  phoneDigits,
  validateConsent,
  validateName,
  validatePhone,
} from "./validation";
import { initBookingShape } from "./shape";
/* =========================================================
   Лента услуг: стрелки «назад / вперёд» на десктопе
   ========================================================= */
function initSlider() {
  const track = document.querySelector<HTMLElement>("[data-slider-track]");
  const nav = document.querySelector<HTMLElement>("[data-slider-nav]");
  const prev = document.querySelector<HTMLButtonElement>("[data-slider-prev]");
  const next = document.querySelector<HTMLButtonElement>("[data-slider-next]");
  if (!track || !nav || !prev || !next) return;

  nav.hidden = false; // без JS стрелок нет, лента просто скроллится

  const step = () => {
    const card = track.querySelector<HTMLElement>(".card");
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return card ? card.offsetWidth + gap : track.clientWidth;
  };

  const update = () => {
    const max = track.scrollWidth - track.clientWidth - 1;
    prev.disabled = track.scrollLeft <= 1;
    next.disabled = track.scrollLeft >= max;
  };

  prev.addEventListener("click", () =>
    track.scrollBy({ left: -step(), behavior: "smooth" }),
  );
  next.addEventListener("click", () =>
    track.scrollBy({ left: step(), behavior: "smooth" }),
  );
  track.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
}

/* =========================================================
   Форма записи
   ========================================================= */
function initForm() {
  const form = document.querySelector<HTMLFormElement>("[data-booking-form]");
  const success = document.querySelector<HTMLElement>("[data-success]");
  if (!form || !success) return;

  const name = form.elements.namedItem("name") as HTMLInputElement;
  const phone = form.elements.namedItem("phone") as HTMLInputElement;
  const consent = form.elements.namedItem("consent") as HTMLInputElement;
  const service = form.elements.namedItem("service") as HTMLInputElement;
  const submit = form.querySelector<HTMLButtonElement>("[data-submit]")!;
  const chip = form.querySelector<HTMLElement>("[data-service-chip]")!;
  const chipName = form.querySelector<HTMLElement>("[data-service-name]")!;

  // Поле → его валидатор. Ошибку показываем после первого blur, дальше — сразу при вводе.
  const rules = new Map<HTMLInputElement, () => string>([
    [name, () => validateName(name.value)],
    [phone, () => validatePhone(phone.value)],
    [consent, () => validateConsent(consent.checked)],
  ]);
  const touched = new Set<HTMLInputElement>();

  const check = (input: HTMLInputElement) => {
    const message = rules.get(input)!();
    const error = document.getElementById(
      input.getAttribute("aria-describedby")!,
    )!;
    error.textContent = message;
    input.setAttribute("aria-invalid", String(Boolean(message)));
    return !message;
  };

  for (const input of rules.keys()) {
    input.addEventListener("blur", () => {
      if (input === phone && phoneDigits(phone.value).length <= 1)
        phone.value = "";
      if (input.value || input.type === "checkbox") touched.add(input);
      if (touched.has(input)) check(input);
    });
    input.addEventListener(
      input.type === "checkbox" ? "change" : "input",
      () => {
        if (touched.has(input)) check(input);
      },
    );
  }

  // Маска телефона: +7 (999) 123-45-67
  phone.addEventListener("focus", () => {
    if (!phone.value) phone.value = "+7 ";
    phone.dataset.prev = phone.value;
  });
  phone.addEventListener("input", (e) => {
    const event = e as InputEvent;
    let digits = phoneDigits(phone.value);
    // Backspace по скобке или дефису не удаляет цифру — удаляем её сами, иначе курсор «застревает»
    if (
      event.inputType === "deleteContentBackward" &&
      digits === phoneDigits(phone.dataset.prev ?? "")
    ) {
      digits = digits.slice(0, -1);
    }
    phone.value = formatPhone(digits);
    phone.dataset.prev = phone.value;
  });

  // Кнопка «Консультация» в карточке подставляет услугу в форму
  const setService = (value: string) => {
    service.value = value;
    chipName.textContent = value;
    chip.hidden = !value;
  };
  document
    .querySelectorAll<HTMLAnchorElement>("[data-service]")
    .forEach((link) => {
      link.addEventListener("click", () => {
        setService(link.dataset.service ?? "");
        if (form.hidden) resetForm();
        // фокус после плавного скролла, чтобы клавиатура на мобилке не дёргала страницу
        setTimeout(() => name.focus({ preventScroll: true }), 400);
      });
    });
  form
    .querySelector("[data-service-reset]")!
    .addEventListener("click", () => setService(""));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (submit.getAttribute("aria-busy") === "true") return;

    rules.forEach((_, input) => touched.add(input));
    const results = [...rules.keys()].map(check);
    const firstInvalid = [...rules.keys()][results.indexOf(false)];
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    submit.setAttribute("aria-busy", "true");
    submit.textContent = "Отправляем…";
    await fakeRequest({
      name: name.value.trim(),
      phone: phone.value,
      service: service.value,
    });

    const about = service.value ? ` по услуге «${service.value}»` : "";
    success.querySelector("[data-success-text]")!.textContent =
      `Спасибо! Администратор перезвонит на номер ${phone.value} и запишет вас на консультацию${about}.`;
    form.hidden = true;
    success.hidden = false;
    success.focus();
  });

  const resetForm = () => {
    form.reset();
    setService("");
    touched.clear();
    rules.forEach((_, input) => {
      input.removeAttribute("aria-invalid");
      document.getElementById(
        input.getAttribute("aria-describedby")!,
      )!.textContent = "";
    });
    submit.removeAttribute("aria-busy");
    submit.textContent = "Записаться на прием";
    success.hidden = true;
    form.hidden = false;
  };

  success
    .querySelector("[data-success-reset]")!
    .addEventListener("click", () => {
      resetForm();
      name.focus();
    });
}

// Демо-отправка: CRM подключать не нужно по условию задания
function fakeRequest(data: Record<string, string>) {
  console.info("Заявка (демо):", data);
  return new Promise((resolve) => setTimeout(resolve, 900));
}

initSlider();
initForm();
initBookingShape();
