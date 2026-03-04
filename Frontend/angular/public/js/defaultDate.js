document.addEventListener('DOMContentLoaded', () => {
  const now = new Date();

  const dateInput = document.getElementById('date');
  dateInput.value = now.toISOString().slice(0, 10);

  const timeInput = document.getElementById('time');
  timeInput.value = now.toTimeString().slice(0,5);
});