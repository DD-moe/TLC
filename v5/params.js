// 1. Tworzy grid z przyciskami na podstawie danych: [ [tekst, link], ... ]
function createButtonGrid(dataArray) {
  const container = document.createElement('div');
  container.className = 'container my-3';

  const row = document.createElement('div');
  row.className = 'row';

  dataArray.forEach(([text, url]) => {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-2';

    const button = document.createElement('button');
    button.className = 'btn btn-primary w-100';
    button.textContent = text;
    button.addEventListener('click', () => {
      window.open(url, '_blank');
    });

    col.appendChild(button);
    row.appendChild(col);
  });

  container.appendChild(row);
  document.body.appendChild(container);
}

// 2. Zapisuje dane inputów do localStorage pod wskazanym kluczem
function saveInputsToLocalStorage(storageKey) {
  const inputs = document.querySelectorAll('input[id]');
  const data = {};

  inputs.forEach(input => {
    data[input.id] = input.value;
  });

  localStorage.setItem(storageKey, JSON.stringify(data));
}

// 3. Reaguje na zmiany w localStorage i uruchamia odpowiednią funkcję, jeśli key pasuje
function handleStorageChange(event, watchList) {
  if (!event || !event.key) return;

  watchList.forEach(([watchedKey, callback]) => {
    if (event.key === watchedKey && typeof callback === 'function') {
      callback(event);
    }
  });
}

// Automatyczne przypisanie nasłuchiwania zmian w localStorage
window.addEventListener('storage', (e) => {
  if (typeof window.__watchList !== 'undefined') {
    handleStorageChange(e, window.__watchList);
  }
});
