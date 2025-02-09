const downloadBtn = document.getElementById('downloadBtn');
const DirdownloadBtn = document.getElementById('DirdownloadBtn');
const copyBtn = document.getElementById('copyBtn');
const pasteBtn = document.getElementById('pasteBtn');
const shareBtn = document.getElementById('shareBtn');
const imageInput = document.getElementById('imageInput');

if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
        if (!panel_canvas) return;
        const imageURL = selectedFormat === 'jpeg' 
            ? panel_canvas.toDataURL('image/jpeg', 1.0) 
            : panel_canvas.toDataURL(`image/${selectedFormat.value}`);
        const link = document.createElement('a');
        link.href = imageURL;
        link.download = `canvas_image.${selectedFormat.value}`;
        link.click();
    });
}

if (DirdownloadBtn) {
    DirdownloadBtn.addEventListener('click', async () => {
        if (!panel_canvas) return;

        // Get image data as a data URL
        const imageURL = selectedFormat === 'jpeg' 
            ? panel_canvas.toDataURL('image/jpeg', 1.0) 
            : panel_canvas.toDataURL(`image/${selectedFormat.value}`);

        // Convert image data URL to a Blob
        const blob = await fetch(imageURL).then(res => res.blob());

        try {
            // Show file save dialog (user selects any location)
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: `canvas_image.${selectedFormat}`,
                types: [{
                    description: "Image Files",
                    accept: { [`image/${selectedFormat}`]: [`.${selectedFormat}`] }
                }]
            });

            // Create a writable stream to write the image data
            const writableStream = await fileHandle.createWritable();
            await writableStream.write(blob);
            await writableStream.close();
        } catch (err) {
            console.error('Error writing file:', err);
        }
    });
}

if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
        if (!panel_canvas) return;
        const imageBlob = await new Promise(resolve => panel_canvas.toBlob(resolve, 'image/png'));
        const clipboardItem = new ClipboardItem({ 'image/png': imageBlob });
        try {
            await navigator.clipboard.write([clipboardItem]);
            console.log('Image copied!');
        } catch (error) {
            console.error('Copy failed:', error);
        }
    });
}

if (pasteBtn) {
    pasteBtn.addEventListener('click', async () => {
        try {
            const clipboardItems = await navigator.clipboard.read();
            for (const item of clipboardItems) {
                for (const type of item.types) {
                    if (type.startsWith('image/')) {
                        const blob = await item.getType(type);
                        loadImageToCanvas(blob);
                        return;
                    }
                }
            }
        } catch (error) {
            console.error('Paste failed:', error);
        }
    });
}

if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
        if (!panel_canvas) return;
        const imageBlob = await new Promise(resolve => panel_canvas.toBlob(resolve, `image/${selectedFormat.value}`));
        if (navigator.share) {
            try {
                await navigator.share({
                    files: [new File([imageBlob], `canvas_image.${selectedFormat}`, { type: `image/${selectedFormat.value}` })],
                    title: 'Canvas Image',
                    text: 'Check this out!',
                });
            } catch (error) {
                console.error('Share failed:', error);
            }
        } else {
            console.log('Share API not supported.');
        }
    });
}

if (imageInput) {
    imageInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) loadImageToCanvas(file);
    });
}

function loadImageToCanvas(file) {
    const reader = new FileReader();
    reader.onload = function (event) {
        const img = new Image();
        img.onload = function () {
            panel_canvas.width = img.width;
            panel_canvas.height = img.height;
            panel_ctx.drawImage(img, 0, 0);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

