    function outputForm(sources, processed_sources) {
        // Iteracja w kolejności dodania (klucze obiektów w JS zachowują kolejność)
        Object.keys(sources).forEach(id => {
            const sourceCanvas = sources[id];
            const processedData = processed_sources[id];
            addCommentCell(id+'_outputsHeader', `Wyniki dla obrazu: ${id}`, document.body);

            // Przetwórz dane przez analizator
            const spots= postprocess_analysis(processedData);

            // Stwórz kontener

            // Główna karta
            const cardWrapper = document.createElement('div');
            cardWrapper.className = 'card mb-4';

            // Nagłówek z przyciskami toggle
            const cardHeader = document.createElement('div');
            cardHeader.className = 'card-header d-flex gap-2 flex-wrap';

            const toggleMain = document.createElement('button');
            toggleMain.className = 'btn btn-sm btn-outline-primary';
            toggleMain.type = 'button';
            toggleMain.setAttribute('data-bs-toggle', 'collapse');
            toggleMain.setAttribute('data-bs-target', `#collapse-main-${id}`);
            toggleMain.textContent = 'Pokaż/Wyłącz obraz';

            const toggleDesc = document.createElement('button');
            toggleDesc.className = 'btn btn-sm btn-outline-secondary';
            toggleDesc.type = 'button';
            toggleDesc.setAttribute('data-bs-toggle', 'collapse');
            toggleDesc.setAttribute('data-bs-target', `#collapse-desc-${id}`);
            toggleDesc.textContent = 'Pokaż/Wyłącz opis';

            cardHeader.appendChild(toggleMain);
            cardHeader.appendChild(toggleDesc);
            cardWrapper.appendChild(cardHeader);

            // Kontener na sekcję: ( obraz + przyciski )
            const container = document.createElement('div');
            container.className = 'collapse show';
            container.id = `collapse-main-${id}`;
            container.classList.add('card-body');

            // Kontener na obraz + przyciski
            const img_container = document.createElement('div');
            img_container.className = 'canvas-result mb-4';
            img_container.id = `image_show-${id}`;
            img_container.style.position = 'relative';  // Pozycjonowanie względem tego kontenera
            container.appendChild(img_container);

            // Kontener na opis/tabelę
            const description_container = document.createElement('div');
            description_container.className = 'collapse show row g-3';
            description_container.id = `collapse-desc-${id}`;
            description_container.classList.add('card-body');

            // Dodaj oba kontenery do głównej karty
            cardWrapper.appendChild(container);
            cardWrapper.appendChild(description_container);

            // Stwórz kopię canvasu
            // 1. Konwersja do PNG (base64)
            const pngDataURL = sourceCanvas.toDataURL('image/png');

            // 2. Tworzymy <img> z zakodowanym PNG
            const imageElement = document.createElement('img');
            imageElement.src = pngDataURL;
            imageElement.alt = `Wynik ${id}`;
            imageElement.style.display = 'block';
            imageElement.style.width = '100%';  // bardzo ważne, by obraz się skalował względem kontenera
            imageElement.style.border = '1px solid #ccc';

            img_container.appendChild(imageElement);

            // Poczekaj, aż obraz się załaduje, aby znać jego wymiary
            imageElement.onload = () => {
                const imgWidth = imageElement.naturalWidth;
                const imgHeight = imageElement.naturalHeight;

                spots.forEach((spot, index) => {
                    const { x, y, width, height } = spot;

                    const btn = document.createElement('button');
                    btn.textContent = `${id}#${index}`;
                    btn.style.position = 'absolute';

                    // Pozycjonuj względem oryginalnych wymiarów obrazu
                    btn.style.left = `${(x / imgWidth) * 100}%`;
                    btn.style.top = `${(y / imgHeight) * 100}%`;
                    btn.style.width = `${(width / imgWidth) * 100}%`;
                    btn.style.height = `${(height / imgHeight) * 100}%`;

                    btn.style.background = 'rgba(255,0,0,0.3)';
                    btn.style.border = '1px solid red';
                    btn.style.color = 'yellow';
                    btn.style.fontSize = '10px';
                    btn.style.cursor = 'pointer';
                    btn.title = `Plamka ${index}`;

                    btn.addEventListener('click', () => {
                        const tableRow = document.getElementById(`spot-${id}-${index}`);
                        if (tableRow) {
                            tableRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            tableRow.style.backgroundColor = 'yellow';
                            setTimeout(() => {
                                tableRow.style.backgroundColor = '';
                            }, 1000);
                        }
                    });

                    img_container.appendChild(btn);

            // Tworzenie tabeli parametrów

                        // Wrapper kolumny dla tabeli
                        const colWrapper = document.createElement('div');
                        colWrapper.className = 'col-12 col-md-6 col-lg-4'; // pełna szerokość w mobile, 2 kolumny na md, 3 na lg+

                        // Nagłówek nad tabelą
                        const caption = document.createElement('h6');
                        caption.textContent = `Parametry Plamki #${index}`;
                        caption.className = 'fw-bold mb-2';

                        // Tabela
                        const table = document.createElement('table');
                        table.className = 'table table-sm table-bordered table-striped w-100';

                        // Iteracja po danych
                        Object.entries(spot).forEach(([key, value]) => {
                            if (key === 'imageData') return;
                            if (key === 'chartX') return;
                            if (key === 'chartY') return;

                            const row = document.createElement('tr');
                            row.id = `spot-${id}-${index}`;

                            const cellKey = document.createElement('td');
                            cellKey.textContent = key;
                            cellKey.className = 'fw-light';

                            const cellValue = document.createElement('td');
                            cellValue.textContent = value;

                            row.appendChild(cellKey);
                            row.appendChild(cellValue);
                            table.appendChild(row);
                        });

                        // Składanie całości
                        colWrapper.appendChild(caption);
                        colWrapper.appendChild(table);
                        description_container.appendChild(colWrapper);        
                });
            };

            // Umieść cały wynik na stronie
            document.body.appendChild(cardWrapper);
        });
    }