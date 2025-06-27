//################################# - funkcje do przetwarzania parametrów optymalizacyjnych i ilościowych

    // oblicza ilościówkę
    function analyzeQuantitive(boxes) {
        return boxes.map(box => {
            const { imageData } = box;
            const { data, width, height } = imageData;

            let spotSum = 0;
            let spotSurface = 0;

            for (let i = 0; i < data.length; i += 4) {
                const red = data[i]; // kanał R
                spotSum += red;
                if (red > 0) spotSurface++;
            }

            const spotAverage = spotSurface > 0 ? spotSum / spotSurface : 0;

            box.spotSum = spotSum;
            box.spotSurface = spotSurface;
            box.spotAverage = spotAverage;

            return box;
        });
    }

    // oblicza gdzie jest peak i jaką ma wartość
    function analyzePeak(boxes) { // INPUT*  (podaj jenostkę odległości na piksel)
        return boxes.map(box => {
            const { imageData } = box;
            const { data, width, height } = imageData;

            let maxIntensity = -1;
            let maxX = 0;
            let maxY = 0;

            for (let i = 0; i < data.length; i += 4) {
                const red = data[i];
                const index = i / 4;
                const x = index % width;
                const y = Math.floor(index / width);

                if (red > maxIntensity) {
                    maxIntensity = red;
                    maxX = x;
                    maxY = y;
                }
            }

            box.maxIntensity = maxIntensity;
            box.maxX = maxX;
            box.maxY = maxY;

            return box;
        });
    }

    // oblicza wartości procentowe dla parametró ilościowych
    function analyzeRelativeQuantities(boxes) {
        // Inicjalizacja wartości maksymalnych
        let maxValues = {
            spotSum: 0,
            spotSurface: 0,
            spotAverage: 0,
            maxIntensity: 0
        };

        // Pierwsze przejście - znajdź maksima
        for (const box of boxes) {
            if ('spotSum' in box) maxValues.spotSum = Math.max(maxValues.spotSum, box.spotSum);
            if ('spotSurface' in box) maxValues.spotSurface = Math.max(maxValues.spotSurface, box.spotSurface);
            if ('spotAverage' in box) maxValues.spotAverage = Math.max(maxValues.spotAverage, box.spotAverage);
            if ('maxIntensity' in box) maxValues.maxIntensity = Math.max(maxValues.maxIntensity, box.maxIntensity);
        }

        // Drugie przejście - oblicz wartości procentowe
        for (const box of boxes) {
            if ('spotSum' in box && maxValues.spotSum > 0)
                box.spotSumPercent = (box.spotSum / maxValues.spotSum) * 100;

            if ('spotSurface' in box && maxValues.spotSurface > 0)
                box.spotSurfacePercent = (box.spotSurface / maxValues.spotSurface) * 100;

            if ('spotAverage' in box && maxValues.spotAverage > 0)
                box.spotAveragePercent = (box.spotAverage / maxValues.spotAverage) * 100;

            if ('maxIntensity' in box && maxValues.maxIntensity > 0)
                box.maxIntensityPercent = (box.maxIntensity / maxValues.maxIntensity) * 100;
        }

        return boxes;
    }

    // dodaje linie startu i mety : !!! na razie ustawione na stałe
    function addBoxLines(boxes) {
        return boxes.map(box => {
            box.startLineX = 100; // INPUT*
            box.endLineX = 900; // INPUT*
            box.startLineY = 100; // INPUT*
            box.endLineY = 900; // INPUT*
            return box;
        });
    }

    // dodaje RF, K i RM
    function calculateBoxPositionMetrics(boxes) {
        return boxes.map(box => {
            const {
                startLineX, endLineX, startLineY, endLineY,
                x = 0, y = 0, // pozycja boxa względem obrazu
                maxX = 0, maxY = 0 // maksymalne lokalne pozycje intensywności w boxie
            } = box;

            // Wymiary toru (track width)
            const xTrackWidth = endLineX - startLineX;
            const yTrackWidth = endLineY - startLineY;

            // Pozycja szczytu (peak) na torze
            const xPeakonTrack = x + maxX - startLineX;
            const yPeakonTrack = y + maxY - startLineY;

            // Relative Fraction (RF)
            const xRF = xTrackWidth !== 0 ? xPeakonTrack / xTrackWidth : 0;
            const yRF = yTrackWidth !== 0 ? yPeakonTrack / yTrackWidth : 0;

            // K oraz RF-mapped log wartości
            const xK = xRF > 0 ? (1 - xRF) / xRF : 0;
            const yK = yRF > 0 ? (1 - yRF) / yRF : 0;

            const xRM = xK > 0 ? Math.log10(xK) : null;
            const yRM = yK > 0 ? Math.log10(yK) : null;

            // Dodaj dane do boxa
            Object.assign(box, {
                xTrackWidth,
                yTrackWidth,
                xPeakonTrack,
                yPeakonTrack,
                xRF,
                yRF,
                xK,
                yK,
                xRM,
                yRM
            });

            return box;
        });
    }

    // funkcja pomocnicza - oblicza sumę pikseli - kan. czerw. dla wybranej osi
    function sumRedByAxis(data, width, height, axis = 'x') {
        const result = axis === 'x' ? new Array(width).fill(0) : new Array(height).fill(0);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4; // indeks piksela w data (RGBA)
                const red = data[i];
                if (axis === 'x') {
                    result[x] += red;
                } else {
                    result[y] += red;
                }
            }
        }
        return result;
    }

    // oblicza chartY i chartX
        function calculateBoxCharts(boxes) {
        return boxes.map(box => {
            const { imageData } = box;
            if (!imageData) {
                box.chartX = [];
                box.chartY = [];
                return box;
            }
            const { data, width, height } = imageData;

            box.chartX = sumRedByAxis(data, width, height, 'x');
            box.chartY = sumRedByAxis(data, width, height, 'y');

            return box;
        });
    }

    // funkcja pomocnicza: oblicza długość peaku na danej wysokości
    function peakWidthAtThreshold(chart, thresholdValue) {
        let left = null;
        let right = null;

        for (let i = 0; i < chart.length; i++) {
            if (chart[i] >= thresholdValue) {
                left = i;
                break;
            }
        }

        for (let i = chart.length - 1; i >= 0; i--) {
            if (chart[i] >= thresholdValue) {
                right = i;
                break;
            }
        }

        if (left !== null && right !== null && right >= left) {
            return right - left;
        }
        return 0; // brak piku
    }

    // oblicza długość peaku na danej wysokości
    function calculateWidthsAtThresholds(boxes) {
        return boxes.map(box => {
            const { chartX, chartY, maxIntensity } = box;

            if (!chartX || !chartY || typeof maxIntensity !== 'number') {
                return box;
            }

            const thresholds = {
                'W05': 0.5,
                'W01': 0.1,
                'W005': 0.05,
                'W0': 0.0
            };

            for (const [key, factor] of Object.entries(thresholds)) {
                const thresholdValue = maxIntensity * factor;

                box['x' + key] = peakWidthAtThreshold(chartX, thresholdValue);
                box['y' + key] = peakWidthAtThreshold(chartY, thresholdValue);
            }

            return box;
        });
    }

    // oblicza ile długość peaku na danej wysokości stanowi % długości u podstawy
    function calculateRelativeWidths(boxes) {
        const keys = ['W05', 'W01', 'W005']; // wartości które porównujemy do W0

        return boxes.map(box => {
            const xW0 = box.xW0 || 1; // unikamy dzielenia przez 0
            const yW0 = box.yW0 || 1;

            keys.forEach(key => {
                const xKey = 'x' + key;
                const yKey = 'y' + key;

                const xRelKey = xKey + '%';
                const yRelKey = yKey + '%';

                if (typeof box[xKey] === 'number') {
                    box[xRelKey] = box[xKey] / xW0;
                }

                if (typeof box[yKey] === 'number') {
                    box[yRelKey] = box[yKey] / yW0;
                }
            });

            return box;
        });
    }

    // funkcja pomocnicza: oblicza dystanse A i B
    function findEdgeDistance(chart, threshold, fromStart = true, maxIndex = 0) {
        const len = chart.length;
        let bestIndex = -1;

        if (fromStart) {
            for (let i = 0; i < len; i++) {
                if (chart[i] >= threshold) {
                    bestIndex = i;
                    break;
                }
            }
        } else {
            for (let i = len - 1; i >= 0; i--) {
                if (chart[i] >= threshold) {
                    bestIndex = i;
                    break;
                }
            }
        }

        return bestIndex !== -1 ? Math.abs(bestIndex - maxIndex) : null;
    }

    // oblicza A i B
    function calculateAsymmetryWidths(boxes) {
        return boxes.map(box => {
            const { chartX, chartY, maxIntensity, maxX, maxY } = box;

            if (!chartX || !chartY || maxIntensity == null || maxX == null || maxY == null)
                return box; // pomiń jeśli dane są niekompletne

            const thresholds = {
                '005': 0.05 * maxIntensity,
                '01': 0.10 * maxIntensity
            };

            ['005', '01'].forEach(key => {
                const thr = thresholds[key];

                // Oś X
                const xA = findEdgeDistance(chartX, thr, true, maxX);
                const xB = findEdgeDistance(chartX, thr, false, maxX);
                if (xA != null) box['xA' + key] = xA;
                if (xB != null) box['xB' + key] = xB;

                // Oś Y
                const yA = findEdgeDistance(chartY, thr, true, maxY);
                const yB = findEdgeDistance(chartY, thr, false, maxY);
                if (yA != null) box['yA' + key] = yA;
                if (yB != null) box['yB' + key] = yB;
            });

            return box;
        });
    }

    // oblicza As i T
    function calculateChromatographicAsAndT(boxes) {
        return boxes.map(box => {
            const {
                xA005, xB005, yA005, yB005,
                xA01, xB01, yA01, yB01
            } = box;

            // Oś X
            if (xA01 != null && xB01 != null && xA01 !== 0) {
                box.xAs = xB01 / xA01;
            }

            if (xA005 != null && xB005 != null && xA005 !== 0) {
                box.xT = (xA005 + xB005) / (2 * xA005);
            }

            // Oś Y
            if (yA01 != null && yB01 != null && yA01 !== 0) {
                box.yAs = yB01 / yA01;
            }

            if (yA005 != null && yB005 != null && yA005 !== 0) {
                box.yT = (yA005 + yB005) / (2 * yA005);
            }

            return box;
        });
    }

    // oblicza Hobs
    function calculateHobsParameters(boxes) {
        return boxes.map(box => {
            const {
                xW0, yW0,
                xW05, yW05,
                xPeakonTrack, yPeakonTrack
            } = box;

            if (xW0 != null && xPeakonTrack != null && xPeakonTrack !== 0) {
                box.xHobs0 = Math.pow(xW0, 2) / 16 / xPeakonTrack;
            }

            if (yW0 != null && yPeakonTrack != null && yPeakonTrack !== 0) {
                box.yHobs0 = Math.pow(yW0, 2) / 16 / yPeakonTrack;
            }

            if (xW05 != null && xPeakonTrack != null && xPeakonTrack !== 0) {
                box.xHobs05 = Math.pow(xW05, 2) / 5.54 / xPeakonTrack;
            }

            if (yW05 != null && yPeakonTrack != null && yPeakonTrack !== 0) {
                box.yHobs05 = Math.pow(yW05, 2) / 5.54 / yPeakonTrack;
            }

            return box;
        });
    }

    // oblicza Nobs
    function calculateNobsParameters(boxes) {
        return boxes.map(box => {
            const {
                xPeakonTrack, yPeakonTrack,
                xW0, yW0,
                xW05, yW05
            } = box;

            // USP
            if (xPeakonTrack != null && xW0 != null && xW0 !== 0) {
                box.xNobsUSP = 16 * Math.floor((xPeakonTrack / xW0));
            }

            if (yPeakonTrack != null && yW0 != null && yW0 !== 0) {
                box.yNobsUSP = 16 * Math.floor((yPeakonTrack / yW0));
            }

            // EPS
            if (xPeakonTrack != null && xW05 != null && xW05 !== 0) {
                box.xNobsEPS = 5.54 * Math.pow(Math.floor(xPeakonTrack / xW05), 2);
            }

            if (yPeakonTrack != null && yW05 != null && yW05 !== 0) {
                box.yNobsEPS = 5.54 * Math.pow(Math.floor(yPeakonTrack / yW05), 2);
            }

            return box;
        });
    }

    // wyznacza tracks dla każdej wykrytej plamki
    function assignTracks(boxes) {
        const TOLERANCE = 50; // INPUT*
        const MIN_SURFACE = 1000; // INPUT*

        return boxes.map((box, idx) => {
            const xSum = box.x + box.width;
            const ySum = box.y + box.height;

            // Tracks on Y-axis: compare x + width
            const tracksY = boxes.reduce((acc, otherBox, jdx) => {
                if (jdx === idx) return acc;
                if (otherBox.spotSurface < MIN_SURFACE) return acc;

                const otherXSum = otherBox.x + otherBox.width;
                if (Math.abs(otherXSum - xSum) <= TOLERANCE) {
                    acc.push(jdx);
                }
                return acc;
            }, []);

            // Tracks on X-axis: compare y + height
            const tracksX = boxes.reduce((acc, otherBox, jdx) => {
                if (jdx === idx) return acc;
                if (otherBox.spotSurface < MIN_SURFACE) return acc;

                const otherYSum = otherBox.y + otherBox.height;
                if (Math.abs(otherYSum - ySum) <= TOLERANCE) {
                    acc.push(jdx);
                }
                return acc;
            }, []);

            box.tracksY = tracksY;
            box.tracksX = tracksX;

            return box;
        });
    }

    // funkcja wyznacza bezpośredniego poprzednika na torze x / y
    function addPreviousTrackParameters(boxes) {
        return boxes.map((currentBox, currentIndex) => {
            const { x: currentX, y: currentY, tracksX = [], tracksY = [] } = currentBox;

            let previousXIndex = null;
            let maxX = -Infinity;
            for (const idx of tracksX) {
                if (idx === currentIndex) continue;
                const otherBox = boxes[idx];
                if (otherBox?.x != null && otherBox.x < currentX && otherBox.x > maxX) {
                    maxX = otherBox.x;
                    previousXIndex = idx;
                }
            }

            let previousYIndex = null;
            let maxY = -Infinity;
            for (const idx of tracksY) {
                if (idx === currentIndex) continue;
                const otherBox = boxes[idx];
                if (otherBox?.y != null && otherBox.y < currentY && otherBox.y > maxY) {
                    maxY = otherBox.y;
                    previousYIndex = idx;
                }
            }

            currentBox.previousX = previousXIndex;
            currentBox.previousY = previousYIndex;

            return currentBox;
        });
    }

    // oblicza parametry alpha
    function addAlphaParameters(boxes) {
        return boxes.map((box, index) => {
            const { xK, yK, previousX, previousY } = box;

            // Obliczanie αx
            if (xK != null && previousX != null) {
                const prevBox = boxes[previousX];
                if (prevBox?.xK != null) {
                    const k1 = Math.min(xK, prevBox.xK);
                    const k2 = Math.max(xK, prevBox.xK);
                    if (k1 !== 0) {
                        box.alphaX = k2 / k1;
                    }
                }
            }

            // Obliczanie αy
            if (yK != null && previousY != null) {
                const prevBox = boxes[previousY];
                if (prevBox?.yK != null) {
                    const k1 = Math.min(yK, prevBox.yK);
                    const k2 = Math.max(yK, prevBox.yK);
                    if (k1 !== 0) {
                        box.alphaY = k2 / k1;
                    }
                }
            }

            return box;
        });
    }

    // obliczza parametry RS
    function addRSParameters(boxes) {
        return boxes.map((box, index) => {
            const { xPeakonTrack: z2x, yPeakonTrack: z2y, xW0: w2x, yW0: w2y, previousX, previousY } = box;

            // RSx
            if (previousX != null) {
                const prevBox = boxes[previousX];
                const z1x = prevBox?.xPeakonTrack;
                const w1x = prevBox?.xW0;

                if (z1x != null && w1x != null && z2x != null && w2x != null && (w1x + w2x) !== 0) {
                    box.RSx = (z2x - z1x) / 0.5 / (w1x + w2x);
                }
            }

            // RSy
            if (previousY != null) {
                const prevBox = boxes[previousY];
                const z1y = prevBox?.yPeakonTrack;
                const w1y = prevBox?.yW0;

                if (z1y != null && w1y != null && z2y != null && w2y != null && (w1y + w2y) !== 0) {
                    box.RSy = (z2y - z1y) / 0.5 / (w1y + w2y);
                }
            }

            return box;
        });
    }

    // oblicza selectivity
    function addSelectivityParameters(boxes) {
        return boxes.map((box) => {
            const { xK: k2x, yK: k2y, previousX, previousY } = box;

            // selectivityX
            if (previousX != null) {
                const prevBox = boxes[previousX];
                const k1x = prevBox?.xK;

                if (k1x != null && k1x !== 0 && k2x != null) {
                    box.selectivityX = 0.25 * Math.floor(k2x / k1x - 1);
                }
            }

            // selectivityY
            if (previousY != null) {
                const prevBox = boxes[previousY];
                const k1y = prevBox?.yK;

                if (k1y != null && k1y !== 0 && k2y != null) {
                    box.selectivityY = 0.25 * Math.floor(k2y / k1y - 1);
                }
            }

            return box;
        });
    }

    // oblicza efficiency
    function addEfficiencyParameters(boxes) {
        return boxes.map(box => {
            const { xRF, yRF, previousX, previousY, xNobsUSP, xNobsEPS, yNobsUSP, yNobsEPS } = box;

            // RFavgX
            let RFavgX = null;
            if (xRF != null && previousX != null) {
                const prevBox = boxes[previousX];
                if (prevBox?.xRF != null) {
                    RFavgX = (xRF + prevBox.xRF) / 2;
                    box.xRFavg = RFavgX;
                }
            }

            // RFavgY
            let RFavgY = null;
            if (yRF != null && previousY != null) {
                const prevBox = boxes[previousY];
                if (prevBox?.yRF != null) {
                    RFavgY = (yRF + prevBox.yRF) / 2;
                    box.yRFavg = RFavgY;
                }
            }

            // Oblicz efficiency, jeśli dane dostępne
            if (RFavgX != null) {
                if (xNobsUSP != null) {
                    box.xEfficiencyUSP = Math.sqrt(RFavgX  * xNobsUSP);
                }
                if (xNobsEPS != null) {
                    box.xEfficiencyEPS = Math.sqrt(RFavgX  * xNobsEPS);
                }
            }

            if (RFavgY != null) {
                if (yNobsUSP != null) {
                    box.yEfficiencyUSP = Math.sqrt(RFavgY  * yNobsUSP);
                }
                if (yNobsEPS != null) {
                    box.yEfficiencyEPS = Math.sqrt(RFavgY * yNobsEPS);
                }
            }

            return box;
        });
    }

    // oblicza retention
    function addRetentionParameters(boxes) {
        return boxes.map(box => {
            const { xRFavg, yRFavg } = box;

            box.xRetention = xRFavg != null ? 1 - xRFavg : null;
            box.yRetention = yRFavg != null ? 1 - yRFavg : null;

            return box;
        });
    }

    // dodaje RS z tego złożonego wzoru
    function addRSParametersComplex(boxes) {
        return boxes.map(box => {
            const {
                xRetention, yRetention,
                xEfficiencyUSP, xEfficiencyEPS,
                yEfficiencyUSP, yEfficiencyEPS,
                selectivityX, selectivityY
            } = box;

            // Obliczenia tylko jeśli wszystkie potrzebne wartości są dostępne
            box.RSxUSP = (
                selectivityX != null && xEfficiencyUSP != null && xRetention != null
            ) ? selectivityX * xEfficiencyUSP * xRetention : null;

            box.RSxEPS = (
                selectivityX != null && xEfficiencyEPS != null && xRetention != null
            ) ? selectivityX * xEfficiencyEPS * xRetention : null;

            box.RSyUSP = (
                selectivityY != null && yEfficiencyUSP != null && yRetention != null
            ) ? selectivityY * yEfficiencyUSP * yRetention : null;

            box.RSyEPS = (
                selectivityY != null && yEfficiencyEPS != null && yRetention != null
            ) ? selectivityY * yEfficiencyEPS * yRetention : null;

            return box;
        });
    }


//################################# - funkcje do przetwarzania parametrów optymalizacyjnych