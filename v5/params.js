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

// 4. tworzy listę z paramterami
function generateFormList(listId, dataArray) {
      const list = document.getElementById(listId);
      if (!list) {
        console.error("Nie znaleziono listy o id:", listId);
        return;
      }

      dataArray.forEach(([labelText, link, inputType, inputId]) => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item bg-light border rounded mb-2';

        const label = document.createElement('label');
        label.setAttribute('for', inputId);
        label.className = 'form-label fw-bold d-block';

        if (link) {
          const linkEl = document.createElement('a');
          linkEl.href = link;
          linkEl.target = '_blank';
          linkEl.rel = 'noopener noreferrer';
          linkEl.innerText = labelText;
          label.appendChild(linkEl);
        } else {
          label.innerText = labelText;
        }

        listItem.appendChild(label);

        let inputElement;
        if (inputType === 'textarea') {
          inputElement = document.createElement('textarea');
          inputElement.className = 'form-control';
          inputElement.setAttribute('rows', 4);
          inputElement.style.resize = 'both';
        } else if (inputType.startsWith('<') && inputType.endsWith('>')) {
          inputElement = document.createElement('div');
          inputElement.innerHTML = inputType;
          const customEl = inputElement.firstElementChild;
          if (customEl) {
            customEl.id = inputId;
            customEl.classList.add('form-control');
            inputElement = customEl;
          }
        } else {
          inputElement = document.createElement('input');
          inputElement.type = inputType;
          inputElement.className = 'form-control';
        }

        inputElement.id = inputId;
        inputElement.name = inputId;

        listItem.appendChild(inputElement);
        list.appendChild(listItem);
      });
    }

    // 5. tworzy kafelki z parametrami
    function generateFormGrid(containerId, dataArray) {
      const container = document.getElementById(containerId);
      if (!container) {
        console.error("Nie znaleziono kontenera o id:", containerId);
        return;
      }

      container.classList.add('row', 'g-3');

      dataArray.forEach(([labelText, link, inputType, inputId]) => {
        const col = document.createElement('div');
        col.className = 'col-sm-12 col-md-6 col-lg-4';

        const formGroup = document.createElement('div');
        formGroup.className = 'form-group d-flex flex-column h-100 border rounded p-3 bg-light';

        const label = document.createElement('label');
        label.setAttribute('for', inputId);
        label.className = 'form-label';

        if (link) {
          const linkEl = document.createElement('a');
          linkEl.href = link;
          linkEl.target = '_blank';
          linkEl.rel = 'noopener noreferrer';
          linkEl.innerText = labelText;
          label.appendChild(linkEl);
        } else {
          label.innerText = labelText;
        }

        formGroup.appendChild(label);

        let inputElement;
        if (inputType === 'textarea') {
          inputElement = document.createElement('textarea');
          inputElement.className = 'form-control';
          inputElement.setAttribute('rows', 4);
          inputElement.style.resize = 'both';
        } else if (inputType.startsWith('<') && inputType.endsWith('>')) {
          inputElement = document.createElement('div');
          inputElement.innerHTML = inputType;
          const customEl = inputElement.firstElementChild;
          if (customEl) {
            customEl.id = inputId;
            customEl.classList.add('form-control');
            inputElement = customEl;
          }
        } else {
          inputElement = document.createElement('input');
          inputElement.type = inputType;
          inputElement.className = 'form-control';
        }

        inputElement.id = inputId;
        inputElement.name = inputId;

        formGroup.appendChild(inputElement);
        col.appendChild(formGroup);
        container.appendChild(col);
      });
    }