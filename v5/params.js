//################################# - funkcje do obsługi merged inputs    

    // Tworzy grid z przyciskami na podstawie danych przyciski służą do otwierania w nowych tabs stron z narzędziami: [ [tekst, link], ... ]
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

    // tworzy listę z paramterami
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
        } else if (inputType === 'checkbox') {
            inputElement = document.createElement('input');
            inputElement.type = 'checkbox';
            inputElement.className = 'form-check-input';
            inputElement.id = inputId;
            inputElement.name = inputId;

            const wrapper = document.createElement('div');
            wrapper.className = 'form-check';

            label.className = 'form-check-label ms-2';
            label.prepend(inputElement);

            wrapper.appendChild(label);
            listItem.innerHTML = ''; // wyczyść, by nie dodawać podwójnie
            listItem.appendChild(wrapper);
          } else {
            inputElement = document.createElement('input');
            inputElement.type = inputType;
            inputElement.className = 'form-control';
            inputElement.id = inputId;
            inputElement.name = inputId;

            listItem.appendChild(label);
            listItem.appendChild(inputElement);
        }


        inputElement.id = inputId;
        inputElement.name = inputId;

        listItem.appendChild(inputElement);
        list.appendChild(listItem);
      });
    }

    // tworzy kafelki z parametrami
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
        } else if (inputType === 'checkbox') {
          inputElement = document.createElement('input');
          inputElement.type = 'checkbox';
          inputElement.className = 'form-check-input';
          inputElement.id = inputId;
          inputElement.name = inputId;

          const wrapper = document.createElement('div');
          wrapper.className = 'form-check';

          label.className = 'form-check-label ms-2';
          label.prepend(inputElement);

          wrapper.appendChild(label);
          listItem.innerHTML = ''; // wyczyść, by nie dodawać podwójnie
          listItem.appendChild(wrapper);
        } else {
          inputElement = document.createElement('input');
          inputElement.type = inputType;
          inputElement.className = 'form-control';
          inputElement.id = inputId;
          inputElement.name = inputId;

          listItem.appendChild(label);
          listItem.appendChild(inputElement);
        }


        inputElement.id = inputId;
        inputElement.name = inputId;

        formGroup.appendChild(inputElement);
        col.appendChild(formGroup);
        container.appendChild(col);
      });
    }

//################################# - funkcje do obsługi merged inputs    

//################################# - funkcje do obsługi local storage

    // Zapisuje dane inputów do localStorage pod wskazanym kluczem
    function saveInputsToLocalStorage(storageKey) {
      const inputs = document.querySelectorAll('input[id]');
      const data = {};

      inputs.forEach(input => {
        if (input.type === 'checkbox') {
          data[input.id] = input.checked;
        } else{
          data[input.id] = input.value;
        }
      });

      localStorage.setItem(storageKey, JSON.stringify(data));
    }

    // Reaguje na zmiany w localStorage i uruchamia odpowiednią funkcję, jeśli key pasuje
    function handleStorageChange(event, watchList) {
      if (!event || !event.key) return;

      watchList.forEach(([watchedKey, callback]) => {
        if (event.key === watchedKey && typeof callback === 'function') {
          callback(event);
        }
      });
    }

    // Wczytuje dane z localStorage i przypisuje do inputów na stronie - zwraca pusty obiekt, jeśli dane są nieodpowiednie
    function loadFromStorage(keyStorage) {
      const dataStr = localStorage.getItem(keyStorage);
      if (!dataStr) {
        console.warn(`Brak danych w localStorage pod kluczem "${keyStorage}"`);
        return {};
      }

      let data;
      try {
        data = JSON.parse(dataStr);
      } catch (e) {
        console.error(`Błąd parsowania JSON dla klucza "${keyStorage}"`, e);
        return {};
      }

      if (typeof data !== "object" || data === null) {
        console.warn("Dane nie są poprawnym obiektem:", data);
        return {};
      }

      Object.entries(data).forEach(([key, value]) => {
        const el = document.getElementById(key);
        if (el && ("value" in el || el.type === "checkbox")) {
          if (el.type === 'checkbox' && typeof value === "boolean") {
            el.checked = value;
          } else {
            el.value = value;
          }
        }
      });

      return data;
    }

    // Zapisuje obiekt do localStorage
    function saveToStorage(obj, keyStorage) {
      if (typeof obj !== "object" || obj === null) {
        console.error("Próba zapisania niepoprawnego obiektu:", obj);
        return;
      }

      try {
        const json = JSON.stringify(obj);
        localStorage.setItem(keyStorage, json);
      } catch (e) {
        console.error("Błąd przy zapisie do localStorage:", e);
      }
    }

    // Automatyczne przypisanie nasłuchiwania zmian w localStorage
    window.addEventListener('storage', (e) => {
      if (typeof window.__watchList !== 'undefined') {
        handleStorageChange(e, window.__watchList);
      }
    });

//################################# - funkcje do obsługi local storage

//################################# - funkcje pól pomocniczych

	// funkcja do dodawania pola komentarza
    function addCommentCell(id, text, destination) {
        // Główny kontener
        const container = document.createElement('div');
        container.className = 'container my-3'; // margines dla odstępów
        container.id = id;

        // Komórka tekstowa w stylu komentarza
        const comment = document.createElement('div');
        comment.className = 'bg-light p-3 rounded fs-3 border-bottom border-top border-secondary'; // Bootstrapowa stylizacja
        comment.innerText = `📝: ${text}`;

        // Składanie i dodanie do body
        container.appendChild(comment);
        destination.appendChild(container);
    }

    // funkcja do tworzenia tabeli z polami wejścia
    function parameterTable(containerId, table) {
        // Główny kontener
        const container = document.createElement('div');
        container.className = 'container bg-light my-4';
        container.id = containerId;

        // Nagłówek
        const heading = document.createElement('h2');
        heading.className = 'mb-3';
        heading.textContent = 'Parametry wejściowe';
        container.appendChild(heading);

        // Tabela
        const tableEl = document.createElement('table');
        tableEl.className = 'table table-bordered table-striped';

        // Ciało tabeli
        const tbody = document.createElement('tbody');

        for (let row of table) {
            const [description, id, value] = row;

            const tr = document.createElement('tr');

            // Kolumna z opisem
            const tdLabel = document.createElement('td');
            tdLabel.className = 'align-middle';
            tdLabel.textContent = description;
            tr.appendChild(tdLabel);

            // Kolumna z inputem
            const tdInput = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'form-control';
            input.id = id;
            input.value = value;
            tdInput.appendChild(input);
            tr.appendChild(tdInput);

            tbody.appendChild(tr);
        }

        tableEl.appendChild(tbody);
        container.appendChild(tableEl);
        document.body.appendChild(container);
    }

    // funkcja do dodawania pola przycisków akcji
    function parameterButtons(containerId, table) {
        // Usuń istniejący kontener o tym ID jeśli istnieje
        const existing = document.getElementById(containerId);
        if (existing) existing.remove();

        // Główny kontener
        const container = document.createElement('div');
        container.className = 'container bg-light my-4';
        container.id = containerId;

        // Nagłówek
        const heading = document.createElement('h2');
        heading.className = 'mb-3';
        heading.textContent = 'Dostępne akcje';
        container.appendChild(heading);

        // Grid na przyciski
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(180px, 1fr))';
        grid.style.gap = '1rem';

        for (let [text, description, func] of table) {
            const tile = document.createElement('div');
            tile.className = 'd-flex btn btn-primary p-0 overflow-hidden';
            tile.style.height = '60px';
            tile.style.fontSize = '1.5rem';

            // Główna część przycisku (2/3)
            const mainBtn = document.createElement('div');
            mainBtn.className = 'flex-grow-1 d-flex align-items-center justify-content-center';
            mainBtn.style.cursor = 'pointer';
            mainBtn.textContent = text;
            mainBtn.onclick = func;

            // Pomoc (1/3)
            const helpBtn = document.createElement('div');
            helpBtn.className = 'bg-secondary d-flex align-items-center justify-content-center';
            helpBtn.style.width = '33.33%';
            helpBtn.style.cursor = 'pointer';
            helpBtn.textContent = '?';
            helpBtn.onclick = (e) => {
                e.stopPropagation();
                showHelp(description);
            };

            tile.appendChild(mainBtn);
            tile.appendChild(helpBtn);
            grid.appendChild(tile);
        }

        container.appendChild(grid);
        document.body.appendChild(container);

        // Pomocnicze okno instrukcji
        function showHelp(text) {
            const helpBox = document.createElement('div');
            helpBox.className = 'modal fade show';
            helpBox.style.display = 'block';
            helpBox.style.position = 'fixed';
            helpBox.style.top = '0';
            helpBox.style.left = '0';
            helpBox.style.width = '100vw';
            helpBox.style.height = '100vh';
            helpBox.style.backgroundColor = 'rgba(0,0,0,0.5)';
            helpBox.style.zIndex = '9999';

            const content = document.createElement('div');
            content.className = 'bg-white rounded p-4';
            content.style.maxWidth = '500px';
            content.style.margin = '100px auto';
            content.innerHTML = `
                <h5>Pomoc</h5>
                <p>${text}</p>
                <button class="btn btn-secondary mt-2">Zamknij</button>
            `;

            content.querySelector('button').onclick = () => {
                helpBox.remove();
            };

            helpBox.appendChild(content);
            document.body.appendChild(helpBox);
        }
    }

     // Pobiera liczbę całkowitą z inputa o podanym ID. Jeśli się nie da, zwraca domyślną.
    function getInt(id, defaultValue = 0) {
        const value = document.getElementById(id)?.value;
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? defaultValue : parsed;
    }


    // Pobiera liczbę zmiennoprzecinkową z inputa o podanym ID. Jeśli się nie da, zwraca domyślną.
    function getFloat(id, defaultValue = 0.0) {
        const value = document.getElementById(id)?.value;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
    }


    // Pobiera tekst z inputa o podanym ID. Jeśli jest pusty lub niedostępny, zwraca domyślną.
    function getString(id, defaultValue = '') {
        const value = document.getElementById(id)?.value;
        return value != null && value.trim().length > 0 ? value : defaultValue;
    }

//################################# - funkcje pól pomocniczych