//################################# - funkcje do preprocess

   // prosta funkcja do obliczania jasności
    function getBrightness(r, g, b) {
      return (r + g + b) / 3;
    }

    // wykrywa narożniki płytki
    function detectBrightCorners(id, canvas) {
        // Usuń istniejący kontener jeśli już jest
        const existing = document.getElementById(`${id}_process`);
        if (existing) {
            existing.remove();
        }

        // Utwórz główny kontener
        const container = document.createElement('div');
        container.className = 'container bg-light p-3';
        container.id = `${id}_process`;

        // Nagłówek
        const heading = document.createElement('h1');
        heading.className = 'mb-4';
        heading.textContent = 'Wstępne przetwarzanie obrazów';
        container.appendChild(heading);

        // Przygotowanie głównych canvasów
        const mainCanvas = document.createElement('canvas');
        const blurCanvas = document.createElement('canvas');

        mainCanvas.id = `mainCanvas-${id}`;
        blurCanvas.id = `blurCanvas-${id}`;

        const mainCtx = mainCanvas.getContext('2d');
        const blurCtx = blurCanvas.getContext('2d');

        const width = canvas.width;
        const height = canvas.height;

        mainCanvas.width = width;
        mainCanvas.height = height;
        blurCanvas.width = width;
        blurCanvas.height = height;

        // Rysujemy oryginał
        mainCtx.drawImage(canvas, 0, 0);

        // Rozmycie
        blurCtx.filter = 'blur(1px)'; // INPUT*
        blurCtx.drawImage(canvas, 0, 0);
        blurCtx.filter = 'none';

        // Dane pikseli
        const imgData = blurCtx.getImageData(0, 0, width, height);
        const data = imgData.data;

        const treshold = 80; // INPUT*
        const brightPoints = [];

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            if (brightness > treshold) {
                brightPoints.push({ x, y });
            }
            }
        }

        if (brightPoints.length === 0) {
            alert("Brak jasnych punktów powyżej progu.");
            return;
        }

        const corners = [
            { x: 0, y: 0 },
            { x: width - 1, y: 0 },
            { x: width - 1, y: height - 1 },
            { x: 0, y: height - 1 }
        ];

        const closest = corners.map(corner => {
            let minDist = Infinity;
            let closestPoint = null;
            for (const p of brightPoints) {
                const dx = p.x - corner.x;
                const dy = p.y - corner.y;
                const dist = dx * dx + dy * dy;
                if (dist < minDist) {
                    minDist = dist;
                    closestPoint = p;
                }
            }
            return closestPoint;
        });

        // Rysowanie konturu
        mainCtx.strokeStyle = "red";
        mainCtx.lineWidth = 1;
        mainCtx.beginPath();
        mainCtx.moveTo(closest[0].x, closest[0].y);
        for (let i = 1; i < closest.length; i++) {
            mainCtx.lineTo(closest[i].x, closest[i].y);
        }
        mainCtx.closePath();
        mainCtx.stroke();

        // Dodaj canvasy do kontenera
        addCommentCell(`mainCanvas-comment-${id}`, 'wykrywanie krawędzi', container);
        container.appendChild(mainCanvas);
        //addCommentCell(`blurCanvas-comment-${id}`, 'obraz z blurr jako źródło do wykrywania krawędzi', container);
        //container.appendChild(blurCanvas);

        // Dodaj kontener do DOM
        document.body.appendChild(container);

        return closest;
    }

//################################# - funkcje do preprocess

//################################# - funkcje do właściwego przetwarzania


    // wycina płytkę ze zdjęcia - i normalizuje za pomocą uproszczonej metody grid
    function extractDocumentFromCanvas(id, sourceCanvas) {
        // 1. Usuń istniejący kontener
        const existing = document.getElementById(`${id}_mid_process`);
        if (existing) existing.remove();

        // 2. Utwórz kontener Bootstrap
        const container = document.createElement('div');
        container.className = 'container bg-light p-3';
        container.id = `${id}_mid_process`;

        // 3. Nagłówek
        const heading = document.createElement('h1');
        heading.className = 'mb-4';
        heading.textContent = 'Ekstrakcja obrazu';
        container.appendChild(heading);

        // 4. Utwórz canvas z rozmyciem 1px
        const blurCanvas = document.createElement('canvas');
        blurCanvas.width = sourceCanvas.width;
        blurCanvas.height = sourceCanvas.height;
        blurCanvas.id = `midCanvas-${id}`;

        const ctx = blurCanvas.getContext('2d');
        ctx.filter = 'blur(1px)'; // INPUT*
        ctx.drawImage(sourceCanvas, 0, 0);

        container.appendChild(blurCanvas);
        document.body.appendChild(container);

        // 5. Wykonaj ekstrakcję z jscanify
        const scanner = new jscanify();

        const newCanvas = scanner.extractPaper(blurCanvas, 1000, 1000, corners); // INPUT* // INPUT*
        newCanvas.id = `midCanvas-${id}`;

        // 6. Podmień canvas
        blurCanvas.replaceWith(newCanvas);

        // 7. przetwórz na luminance
        const ctx_new = newCanvas.getContext('2d');
        let imgData = ctx_new.getImageData(0, 0, newCanvas.width, newCanvas.height);
        let data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const luminance = Math.round(0.299 * r + 0.587 * g + 0.114 * b); // INPUT* // INPUT* // INPUT*

            data[i] = luminance;     // R
            data[i + 1] = luminance; // G
            data[i + 2] = luminance; // B
            data[i + 3] = 255;       // A
        }

        //ctx_new.putImageData(imgData, 0, 0);

        // 8. odejmujemy tło bazując na funkcji grid - do ustalania lokalnej intensywności tła

        // zakładamy zmienne:
        const gridSize = 1; // INPUT*
        const topPercent = 5; // INPUT*

        const { width, height } = newCanvas;
        //imgData = ctx_new.getImageData(0, 0, width, height);
        //data = imgData.data;

        const cellWidth = Math.floor(width / gridSize);
        const cellHeight = Math.floor(height / gridSize);

        for (let gy = 0; gy < gridSize; gy++) {
            for (let gx = 0; gx < gridSize; gx++) {
            const startX = gx * cellWidth;
            const startY = gy * cellHeight;
            const endX = (gx + 1 === gridSize) ? width : startX + cellWidth;
            const endY = (gy + 1 === gridSize) ? height : startY + cellHeight;

            const pixels = [];

            // Zbieramy piksele do sortowania
            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                const i = (y * width + x) * 4;
                const r = data[i];
                pixels.push({ i, r }); // tylko indeks i czerwony kanał
                }
            }

            // Sortujemy po czerwonym kanale malejąco
            pixels.sort((a, b) => b.r - a.r);

            const count = Math.max(1, Math.floor(pixels.length * (topPercent / 100)));

            // Średnia z top % pikseli
            let sumR = 0;
            for (let k = 0; k < count; k++) {
                const i = pixels[k].i;
                sumR += data[i];
            }

            const avgR = Math.round(sumR / count);


            // Odejmujemy od każdego piksela w oczku siatki
            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                const i = (y * width + x) * 4;
                data[i + 2] = data[i + 1] = data[i]     = Math.max(0, avgR - data[i]); // R
                }
            }
            }
        }

        // Zapisujemy zmodyfikowany obraz z powrotem
        ctx_new.putImageData(imgData, 0, 0);

        // 9. zwracamy newCanvas
        return newCanvas;
    }

    // ekstrachuje płytkę ze zdjęcia z normalizacją oświetlenia pełną typu polynomial reggression
    function extractDocumentFromCanvas_norm(id, sourceCanvas) {
        // 1. Usuń istniejący kontener
        const existing = document.getElementById(`${id}_mid_process`);
        if (existing) existing.remove();

        // 2. Utwórz kontener Bootstrap
        const container = document.createElement('div');
        container.className = 'container bg-light p-3';
        container.id = `${id}_mid_process`;

        // 3. Nagłówek
        const heading = document.createElement('h1');
        heading.className = 'mb-4';
        heading.textContent = 'Ekstrakcja obrazu';
        container.appendChild(heading);

        // 4. Utwórz canvas z rozmyciem 1px
        const blurCanvas = document.createElement('canvas');
        blurCanvas.width = sourceCanvas.width;
        blurCanvas.height = sourceCanvas.height;
        blurCanvas.id = `midCanvas-${id}`;

        const ctx = blurCanvas.getContext('2d');
        ctx.filter = 'blur(1px)'; // INPUT*
        ctx.drawImage(sourceCanvas, 0, 0);

        container.appendChild(blurCanvas);
        document.body.appendChild(container);

        // 5. Wykonaj ekstrakcję z jscanify
        const scanner = new jscanify();

        const newCanvas = scanner.extractPaper(blurCanvas, 1000, 1000, corners); // INPUT* // INPUT*
        newCanvas.id = `midCanvas-${id}`;

        // 6. Podmień canvas
        blurCanvas.replaceWith(newCanvas);

        // 7. przetwórz na luminance
        const ctx_new = newCanvas.getContext('2d');
        let imgData = ctx_new.getImageData(0, 0, newCanvas.width, newCanvas.height);
        let data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const luminance = Math.round(0.299 * r + 0.587 * g + 0.114 * b); // INPUT* // INPUT* // INPUT*

            data[i] = luminance;     // R
            data[i + 1] = luminance; // G
            data[i + 2] = luminance; // B
            data[i + 3] = 255;       // A
        }

        ctx_new.putImageData(imgData, 0, 0);

        // 8. Przeskaluj newCanvas na mniejszy (20x mniejszy - w osi y)
        const scale = 20; // INPUT*
        const smallCanvas = document.createElement('canvas');
        smallCanvas.width = Math.floor(newCanvas.width);
        smallCanvas.height = Math.floor(newCanvas.height / scale);

        const min_ctx = smallCanvas.getContext('2d');

        min_ctx.drawImage(
            newCanvas,
            0, 0, newCanvas.width, newCanvas.height,  // źródło
            0, 0, smallCanvas.width, smallCanvas.height  // cel
        );

        const min_imagedata = min_ctx.getImageData(0, 0, smallCanvas.width, smallCanvas.height);
        const min_data = min_imagedata.data;

        // (Opcjonalnie: dodaj canvas do DOM do podglądu)
        container.appendChild(smallCanvas);        

        // 9. odejmujemy tło bazując na funkcji polynomyal reggression - do ustalania lokalnej intensywności tła
        // dla mode unnormalise

        processColumnsWithPolynomialRegression(
            min_data,
            scale,
            data,
            newCanvas.width,
            newCanvas.height,
            smallCanvas.width,
            smallCanvas.height,
            data
        );

        // 10 dokonujemy subtrakcji tła
        ctx_new.putImageData(imgData, 0, 0);

        // 11. zwracamy newCanvas
        return newCanvas;
    }

    // tworzy format narożników charakterystyczny dla js scanify
    function assignCorners(points) {
      // points: array z 4 punktami {x, y}, z normalizowanymi współrzędnymi (0..1)

      // Sortujemy wg y rosnąco (od góry do dołu)
      const sortedByY = points.slice().sort((a, b) => a.y - b.y);

      // Górne dwa punkty
      const topPoints = sortedByY.slice(0, 2).sort((a, b) => a.x - b.x); // posortowane wg x rosnąco
      // Dolne dwa punkty
      const bottomPoints = sortedByY.slice(2, 4).sort((a, b) => a.x - b.x);

      return {
        topLeftCorner: topPoints[0],
        topRightCorner: topPoints[1],
        bottomLeftCorner: bottomPoints[0],
        bottomRightCorner: bottomPoints[1],
      };
    }  
//################################# - funkcje do właściwego przetwarzania