    // funkcja do ekstrakcji niezlewających się plamek 2d
    function extractBlobsFromCanvas(id, sourceCanvas, processingParameters) {

        // zakładamy zmienne bazowe:
        const treshold =  processingParameters.detectSpotTreshold; // INPUT*
        const edgeThickness = processingParameters.edgeThickness; // INPUT*

        // 1. Usuń istniejący kontener
        const existing = document.getElementById(`${id}_mid_process_blobs`);
        if (existing) existing.remove();

        // 2. Utwórz kontener Bootstrap
        const container = document.createElement('div');
        container.className = 'container bg-light p-3';
        container.id = `${id}_mid_process_blobs`;

        // 3. Nagłówek
        const heading = document.createElement('h1');
        heading.className = 'mb-4';
        heading.textContent = 'Ekstrakcja plamek';
        container.appendChild(heading);

        // 4. pobierz canvas z rozmyciem 1px
        const detectedCanvas = document.createElement('canvas');
        detectedCanvas.width = sourceCanvas.width;
        detectedCanvas.height = sourceCanvas.height;
        detectedCanvas.id = `midCanvas-blobs-${id}`;

        let src = cv.imread(sourceCanvas); // Wczytaj obraz RGBA
        let gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY); // Konwertuj na grayscale
        // Zamaskuj ramkę - 5px od każdej krawędzi
        gray.rowRange(0, edgeThickness).setTo(new cv.Scalar(0)); // góra
        gray.rowRange(gray.rows - edgeThickness, gray.rows).setTo(new cv.Scalar(0)); // dół
        gray.colRange(0, edgeThickness).setTo(new cv.Scalar(0)); // lewa
        gray.colRange(gray.cols - edgeThickness, gray.cols).setTo(new cv.Scalar(0)); // prawa


        // Progowanie jasnych obszarów: wszystko powyżej 10
        let thresh = new cv.Mat();
        cv.threshold(gray, thresh, treshold, 255, cv.THRESH_BINARY);

        // Operacje morfologiczne: oczyszczanie i rozszerzenie
        let kernel = cv.Mat.ones(3, 3, cv.CV_8U);
        cv.morphologyEx(thresh, thresh, cv.MORPH_OPEN, kernel);
        cv.dilate(thresh, thresh, kernel);

        // Znajdź kontury
        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();
        cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        let boxes = [];
        for (let i = 0; i < contours.size(); ++i) {
            let cnt = contours.get(i);
            let rect = cv.boundingRect(cnt);

            if (rect.width * rect.height > processingParameters.minSpotSize) { // Odrzuć drobne zakłócenia // INPUT*
                let expandX = Math.round(rect.width * 0.08);
                let expandY = Math.round(rect.height * 0.08);

                let x = Math.max(0, rect.x - expandX);
                let y = Math.max(0, rect.y - expandY);
                let width = Math.min(src.cols - x, rect.width + 2 * expandX);
                let height = Math.min(src.rows - y, rect.height + 2 * expandY);

                let point1 = new cv.Point(x, y);
                let point2 = new cv.Point(x + width, y + height);
                cv.rectangle(src, point1, point2, [0, 255, 0, 255], 2);
                boxes.push({ x, y, width, height });
            }

            cnt.delete();
        }

        cv.imshow(detectedCanvas, src);

        // Zwolnienie pamięci
        src.delete(); gray.delete(); thresh.delete();
        kernel.delete(); contours.delete(); hierarchy.delete();


        let ctx = sourceCanvas.getContext("2d");
        for (let box of boxes) {
            box.imageData = ctx.getImageData(box.x, box.y, box.width, box.height);
        }

        container.appendChild(detectedCanvas);
        document.body.appendChild(container);

        return boxes;
    }

    // funkcja do maskowania niezlewających się plamek 2d
    function maskDarkest5Percent(boxes, percent) {
        return boxes.map(box => {
            const { imageData } = box;
            const { data, width, height } = imageData;
            const pixelCount = width * height;

            // Tworzymy tablicę: { index, red } — jeden element na każdy piksel
            let redValues = [];
            for (let i = 0; i < data.length; i += 4) {
                redValues.push({ index: i, red: data[i] }); // data[i] = kanał R
            }

            // Sortujemy rosnąco po czerwonym kanale
            redValues.sort((a, b) => a.red - b.red);

            // Ile to jest 5%?
            const thresholdCount = Math.floor(pixelCount * percent / 100);

            // Iterujemy po 5% najciemniejszych i maskujemy RGB
            for (let i = 0; i < thresholdCount; i++) {
                const idx = redValues[i].index;
                data[idx] = 0;     // R
                data[idx + 1] = 0; // G
                data[idx + 2] = 0; // B
                // data[idx + 3] = alfa — NIE ruszamy
            }

            // Tworzymy nowy ImageData i przypisujemy do box
            box.imageData = new ImageData(data, width, height);
            return box;
        });
    }  