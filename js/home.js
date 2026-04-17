// ============================================================
// HOME — static landing page interactions
// ============================================================

function toggleHomeMenu() {
  document.getElementById('homeMenuDropdown').classList.toggle('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('homeMenuBtn');
  if (menuBtn) menuBtn.addEventListener('click', toggleHomeMenu);
  document.querySelectorAll('#homeMenuDropdown a').forEach(anchor => {
    anchor.addEventListener('click', () =>
      document.getElementById('homeMenuDropdown').classList.add('hidden')
    );
  });
});
