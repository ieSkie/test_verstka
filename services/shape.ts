// Запасной вариант для браузеров без CSS clip-path: shape().
// В современных браузерах контур задаётся прямо в style.css (без мигания при загрузке),
// а этот код просто не запускается.
//
// Фигурный фон формы записи — контур «Vector 25» из Figma.
// В макете это многоугольник со скошенными углами, у каждой вершины свой радиус скругления.
// Блок тянется (ширина экрана, ошибки под полями), поэтому контур не картинкой,
// а пересчитывается под размер блока и подставляется в clip-path.

type Point = [x: number, y: number, radius: number];

// Координаты и радиусы взяты из Figma. Вырезы привязаны к углам, чтобы не искажаться при растяжении.
function desktopPoints(w: number, h: number): Point[] {
  return [
    [0, 0, 30],
    [w - 68.34, 0, 50], // скос справа сверху
    [w, 68.28, 50],
    [w, h, 50],
    [106.68, h, 50], // ступенька слева снизу
    [38.34, h - 68.28, 50],
    [38.34, h - 161.33, 30],
    [0, h - 199.67, 50],
  ];
}

function mobilePoints(w: number, h: number): Point[] {
  return [
    [68.28, 0, 30], // скос слева сверху
    [w, 0, 20],
    [w, h - 106.68, 30], // ступенька справа снизу
    [w - 68.28, h - 38.34, 30],
    [w - 188.33, h - 38.34, 15],
    [w - 226.67, h, 30],
    [0, h, 15],
    [0, 68.34, 30],
  ];
}

/** SVG-путь многоугольника со скруглёнными вершинами (как corner radius у вектора в Figma). */
function roundedPath(points: Point[], dx = 0, dy = 0): string {
  const n = points.length;
  const f = (v: number) => +v.toFixed(2);
  let d = "";

  points.forEach(([x, y, r], i) => {
    const [px, py] = points[(i - 1 + n) % n];
    const [nx, ny] = points[(i + 1) % n];
    const inLen = Math.hypot(x - px, y - py);
    const outLen = Math.hypot(nx - x, ny - y);
    const ux = (x - px) / inLen,
      uy = (y - py) / inLen; // направление входящего ребра
    const vx = (nx - x) / outLen,
      vy = (ny - y) / outLen; // направление исходящего ребра

    // Поворот в вершине → насколько отступить от неё, чтобы вписать дугу радиуса r
    const turn = Math.acos(Math.max(-1, Math.min(1, ux * vx + uy * vy)));
    const tan = Math.tan(turn / 2);
    const cut = Math.min(r * tan, inLen / 2, outLen / 2);
    const radius = tan ? cut / tan : 0;
    const sweep = ux * vy - uy * vx > 0 ? 1 : 0;

    const ax = x - ux * cut + dx,
      ay = y - uy * cut + dy;
    const bx = x + vx * cut + dx,
      by = y + vy * cut + dy;
    d += `${i ? "L" : "M"} ${f(ax)} ${f(ay)} A ${f(radius)} ${f(radius)} 0 0 ${sweep} ${f(bx)} ${f(by)} `;
  });
  return d + "Z";
}

const PHOTO_OVERFLOW = 31; // маска фото в Figma на 31 px выше блока — голова выходит наружу

export function initBookingShape() {
  if (CSS.supports("clip-path", "shape(from 0 0, line to 1px 1px)")) return;

  const block = document.querySelector<HTMLElement>(".booking");
  const photo = block?.querySelector<HTMLElement>(".booking__photo");
  if (!block || !photo) return;

  const mobile = window.matchMedia("(max-width: 767px)");

  const update = () => {
    const w = block.offsetWidth;
    const h = block.offsetHeight;
    const points = mobile.matches ? mobilePoints : desktopPoints;
    block.style.setProperty(
      "--booking-shape",
      `path("${roundedPath(points(w, h))}")`,
    );

    // Фото режем тем же контуром (вытянутым вверх), в системе координат самого фото
    if (photo.offsetParent) {
      const extended = points(w, h + PHOTO_OVERFLOW);
      const path = roundedPath(
        extended,
        -photo.offsetLeft,
        -photo.offsetTop - PHOTO_OVERFLOW,
      );
      block.style.setProperty("--booking-photo-shape", `path("${path}")`);
    }
  };

  // Пересчёт при любом изменении размера: ширина окна, ошибки валидации, экран успеха
  new ResizeObserver(update).observe(block);
  mobile.addEventListener("change", update);
  update();
}
