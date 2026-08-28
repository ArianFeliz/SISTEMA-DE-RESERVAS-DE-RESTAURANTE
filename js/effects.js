const marquee = document.querySelector(".marquee");
const prefiereMenosMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (marquee && !prefiereMenosMovimiento) {
  marquee.addEventListener("pointermove", (e) => {
    const rect = marquee.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    marquee.style.setProperty("--mx", `${x}%`);
    marquee.style.setProperty("--my", `${y}%`);
  });
}
