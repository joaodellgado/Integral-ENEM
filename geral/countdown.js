(function () {
  const DAY1_START = new Date(2026, 10, 7, 0, 0, 0);
  const DAY1_END = new Date(2026, 10, 8, 0, 0, 0);
  const DAY2_START = new Date(2026, 10, 15, 0, 0, 0);
  const DAY2_END = new Date(2026, 10, 16, 0, 0, 0);

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function boot() {
    const root = document.getElementById("enemCountdown");
    if (!root) return;

    const titleEl = document.getElementById("enemCountdownTitle");
    const subEl = document.getElementById("enemCountdownSub");
    const timerEl = document.getElementById("enemCountdownTimer");
    const daysEl = document.getElementById("cdDays");
    const hoursEl = document.getElementById("cdHours");
    const minutesEl = document.getElementById("cdMinutes");

    function renderTimer(target) {
      const diff = Math.max(0, target - new Date());
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);

      timerEl.hidden = false;
      daysEl.textContent = pad(days);
      hoursEl.textContent = pad(hours);
      minutesEl.textContent = pad(minutes);

      return days;
    }

    function tick() {
      const now = new Date();
      root.classList.remove("is-exam-day", "is-done");

      if (now < DAY1_START) {
        const days = renderTimer(DAY1_START);
        titleEl.textContent = `Faltam ${days} dia${days === 1 ? "" : "s"} para o 1º dia de prova`;
        subEl.textContent = "7 e 15 de novembro de 2026";
      } else if (now < DAY1_END) {
        timerEl.hidden = true;
        root.classList.add("is-exam-day");
        titleEl.textContent = "Hoje é o 1º dia de prova! 💪";
        subEl.textContent = "Boa prova! O 2º dia é em 15 de novembro";
      } else if (now < DAY2_START) {
        const days = renderTimer(DAY2_START);
        titleEl.textContent = `Faltam ${days} dia${days === 1 ? "" : "s"} para o 2º dia de prova`;
        subEl.textContent = "Você já passou pelo 1º dia — continue firme! 🎯";
      } else if (now < DAY2_END) {
        timerEl.hidden = true;
        root.classList.add("is-exam-day");
        titleEl.textContent = "Hoje é o 2º dia de prova! 💪";
        subEl.textContent = "Você está quase lá. Boa prova!";
      } else {
        timerEl.hidden = true;
        root.classList.add("is-done");
        titleEl.textContent = "ENEM 2026 concluído! 🎓";
        subEl.textContent = "Parabéns pela jornada até aqui!";
      }
    }

    tick();
    setInterval(tick, 30000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
