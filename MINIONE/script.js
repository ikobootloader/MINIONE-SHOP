const menuToggle = document.getElementById('menuToggle');
const navMobile = document.getElementById('navMobile');

menuToggle.addEventListener('click', () => {
  navMobile.classList.toggle('open');
});
