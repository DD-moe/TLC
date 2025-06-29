    // custom implementation of polynomial reggression
    function polynomialRegression(data, degree) {
        const X = [];
        const Y = [];

        // Rozdziel dane
        for (const point of data) {
            X.push(point.x);
            Y.push(point.y);
        }

        const N = degree + 1;
        const matrix = Array.from({ length: N }, () => Array(N + 1).fill(0));

        // Wypełnij macierz układu równań normalnych
        for (let row = 0; row < N; row++) {
            for (let col = 0; col < N; col++) {
                matrix[row][col] = X.reduce((sum, xi) => sum + Math.pow(xi, row + col), 0);
            }
            matrix[row][N] = X.reduce((sum, xi, i) => sum + Y[i] * Math.pow(xi, row), 0);
        }

        // Rozwiązywanie układu równań metodą Gaussa
        for (let i = 0; i < N; i++) {
            // Szukamy maksymalnego elementu w kolumnie
            let maxRow = i;
            for (let k = i + 1; k < N; k++) {
                if (Math.abs(matrix[k][i]) > Math.abs(matrix[maxRow][i])) {
                    maxRow = k;
                }
            }
            [matrix[i], matrix[maxRow]] = [matrix[maxRow], matrix[i]];

            // Eliminacja
            for (let k = i + 1; k < N; k++) {
                const factor = matrix[k][i] / matrix[i][i];
                for (let j = i; j <= N; j++) {
                    matrix[k][j] -= factor * matrix[i][j];
                }
            }
        }

        // Podstawianie wsteczne
        const coeffs = Array(N).fill(0);
        for (let i = N - 1; i >= 0; i--) {
            coeffs[i] = matrix[i][N] / matrix[i][i];
            for (let k = i - 1; k >= 0; k--) {
                matrix[k][N] -= matrix[k][i] * coeffs[i];
            }
        }

        return coeffs; // współczynniki od wyrazu wolnego (x^0) do najwyższego (x^n)
    }

    // predykcja wyników
    function predictY(coeffs, x) {
        return coeffs.reduce((sum, a, i) => sum + a * Math.pow(x, i), 0);
    }


    // polynomial reggression light normalization
     /*
     * Przetwarza kolumny z pomniejszonego obrazu za pomocą regresji wielomianowej
     * i wypełnia pełne dane predykcjami RGB.
     *
     * @param {Uint8ClampedArray} min_data - Dane obrazu pomniejszonego (ImageData.data)
     * @param {number} scale - Skala pomniejszenia (np. 4 jeśli pomniejszony obraz ma 1/4 wysokości)
     * @param {Uint8ClampedArray} full_data - Dane obrazu pełnego (ImageData.data)
     * @param {number} width - Szerokość pełnego obrazu
     * @param {number} height - Wysokość pełnego obrazu
     * @param {number} smallWidth - Szerokość pomniejszonego obrazu
     * @param {number} smallHeight - Wysokość pomniejszonego obrazu
     */
    function processColumnsWithPolynomialRegression(min_data, scale, full_data, width, height, smallWidth, smallHeight) {
        for (let x = 0; x < smallWidth; x++) {
            const data = [];

            // Zbieranie danych treningowych z RED kanału pomniejszonego obrazu
            for (let y = 0; y < smallHeight; y++) {
                const index = (y * smallWidth + x) * 4;
                const red = min_data[index];
                data.push({ x: y * scale, y: red });  // x = rzeczywista pozycja w pełnym obrazie
            }

            // Trenuj model
            const { model } = iterativePolynomialRegression(data);

            // Predykcja dla pełnego obrazu
            for (let y = 0; y < height; y++) {
                const predicted = model(y);
                const fullIndex = (y * width + x) * 4;

                const clamped = Math.max(0, Math.min(255, Math.round(predicted - full_data[fullIndex])));

                
                full_data[fullIndex] = clamped;     // R
                full_data[fullIndex + 1] = clamped; // G
                full_data[fullIndex + 2] = clamped; // B
                // Alpha kanał zostaje nietknięty
            }
        }
    }


    // obliczanie regresji wielomianowej w modelu iteracyjnym
    /**
     * Iteracyjna regresja z odrzucaniem danych o największym błędzie.
     * @param {Array<{x: number, y: number}>} data - Dane wejściowe.
     * @returns {Object} Obiekt z końcowym modelem, oczyszczonymi danymi i historią błędów.
     */
    function iterativePolynomialRegression(data) {
        const originalLength = data.length;
        let currentData = [...data];
        let previousAvgErrorFactor = Infinity;
        let history = [];

        while (true) {
            const coeffs = polynomialRegression(currentData, 3); // zamiennik model.getTerms()

            // Oblicz błędy
            const errors = currentData.map(point => {
                const predictedY = predictY(coeffs, point.x);
                const error = predictedY - point.y;
                return { ...point, error };
            });

            // Średni błąd
            const avgError = errors.reduce((sum, e) => sum + e.error, 0) / errors.length;

            // Factor: aktualna liczba danych / pierwotna liczba danych
            const factor = currentData.length / originalLength;
            const avgErrorFactor = avgError / factor;

            history.push({
                dataLength: currentData.length,
                avgError,
                factor,
                avgErrorFactor
            });

            // Warunek zakończenia
            if (
                //avgErrorFactor > previousAvgErrorFactor ||
                currentData.length <= originalLength / 2.5 // INPUT*
            ) {
                break;
            }

            previousAvgErrorFactor = avgErrorFactor;

            // Usuń 10% punktów z największym błędem
            const threshold = Math.ceil(currentData.length * 0.1); // INPUT*
            errors.sort((a, b) => b.error - a.error);
            currentData = errors.slice(threshold).map(e => ({ x: e.x, y: e.y }));
        }

        const finalCoeffs = polynomialRegression(currentData, 3);

        return {
            coeffs: finalCoeffs,          // współczynniki końcowego modelu
            model: x => predictY(finalCoeffs, x), // funkcja do przewidywania
            cleanedData: currentData,
            history
        };
    }