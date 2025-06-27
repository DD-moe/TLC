//################################# - funkcje ładowania obrazów  

  	// funkcja tworząca panel ładowania obrazów
    function images(id, auto = false) {
      // Utwórz główny kontener
      const container = document.createElement('div');
      container.className = 'container bg-light';
      container.id = id;

      //  paint tools element
      const painter = document.createElement('paint-tools');
      painter.setAttribute('data-canvas', `canvas-${id}`);

      // Nagłówek
      const heading = document.createElement('h1');
      heading.className = 'mb-4';
      heading.textContent = 'Wczytaj obraz(y)';

      // Input
      const inputDiv = document.createElement('div');
      inputDiv.className = 'mb-3';
      const input = document.createElement('input');
      input.type = 'file';
      input.className = 'form-control';
      input.accept = 'image/*';
      input.multiple = true;
      input.id = `input-${id}`; // unikalny ID jeśli potrzeba
      inputDiv.appendChild(input);

      // Canvas
      const canvas = document.createElement('canvas');
      canvas.id = `canvas-${id}`;
      inputDiv.appendChild(canvas);

      // Złożenie wszystkiego
      container.appendChild(heading);
      container.appendChild(inputDiv);
      container.appendChild(canvas);
      container.appendChild(painter);
      document.body.appendChild(container);

      // Obsługa inputa
      input.addEventListener('change', async function () {
        const files = [...this.files];
        if (files.length === 0) return;

        const parent = this.closest('.container');
        const canvas = parent.querySelector('canvas');
        const ctx = canvas.getContext('2d');

        const images = await Promise.all(files.map(loadImage));
        const width = images[0].naturalWidth;
        const height = images[0].naturalHeight;

        // Sprawdzenie rozmiarów
        for (let img of images) {
          if (img.naturalWidth !== width || img.naturalHeight !== height) {
            alert('Wszystkie obrazy muszą mieć ten sam rozmiar!');
            return;
          }
        }

        canvas.width = width;
        canvas.height = height;

        if (images.length === 1) {
          ctx.drawImage(images[0], 0, 0);
        } else {
          const sumData = new Float32Array(width * height * 4);
          for (let img of images) {
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, width, height);
            for (let i = 0; i < imageData.data.length; i++) {
              sumData[i] += imageData.data[i];
            }
          }

          const avgData = new Uint8ClampedArray(width * height * 4);
          const numImages = images.length;
          for (let i = 0; i < sumData.length; i++) {
            avgData[i] = Math.round(sumData[i] / numImages);
          }

          const finalImageData = new ImageData(avgData, width, height);
          ctx.putImageData(finalImageData, 0, 0);
        }
        if (auto) {
            window.dispatchEvent(new CustomEvent('newScan', {
            detail: { id, canvas }
            }));
        }
      });
    }

    // Pomocnicza funkcja do ładowania obrazu
    function loadImage(file) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
    }

//################################# - funkcje ładowania obrazów