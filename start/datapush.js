document.getElementById('downloadBtn').addEventListener('click', () => {
    if (!panel_canvas) return;
    const imageURL = selectedFormat === 'jpeg' 
        ? lastCanvas.toDataURL('image/jpeg', 1.0) 
        : lastCanvas.toDataURL(`image/${selectedFormat.value}`);
    const link = document.createElement('a');
    link.href = imageURL;
    link.download = `canvas_image.${selectedFormat.value}`;
    link.click();
    document.body.removeChild(link);
});

document.getElementById('DirdownloadBtn').addEventListener('click', async () => {
    if (!panel_canvas) return;
    
    // Prompt user for file name
    const fileName = prompt("Enter the file name:", "canvas_image");

    if (!fileName) return; // If no name is provided, do nothing

    // Get image data as a data URL
    const imageURL = selectedFormat === 'jpeg' 
        ? lastCanvas.toDataURL('image/jpeg', 1.0) 
        : lastCanvas.toDataURL(`image/${selectedFormat.value}`);

    // Convert image data URL to a Blob
    const blob = await fetch(imageURL).then(res => res.blob());

    try {
        // Request a handle to a directory
        const directoryHandle = await window.showDirectoryPicker();
        
        // Create or overwrite the file in the chosen directory
        const fileHandle = await directoryHandle.getFileHandle(`${fileName}.${selectedFormat.value}`, { create: true });

        // Create a writable stream to write the image data
        const writableStream = await fileHandle.createWritable();
        await writableStream.write(blob);
        await writableStream.close();
    } catch (err) {
        console.error('Error writing file:', err);
    }
});


document.getElementById('copyBtn').addEventListener('click', async () => {
    if (!panel_canvas) return;
    const imageBlob = await new Promise(resolve => lastCanvas.toBlob(resolve, 'image/png'));
    const clipboardItem = new ClipboardItem({ 'image/png': imageBlob });
    try {
        await navigator.clipboard.write([clipboardItem]);
        console.log('Image copied!');
    } catch (error) {
        console.error('Copy failed:', error);
    }
});

document.getElementById('pasteBtn').addEventListener('click', async () => {
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

document.getElementById('shareBtn').addEventListener('click', async () => {
    if (!panel_canvas) return;
    const selectedFormat = document.getElementById("fileType").value;
    const imageBlob = await new Promise(resolve => lastCanvas.toBlob(resolve, `image/${selectedFormat.value}`));
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


document.getElementById("imageInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) loadImageToCanvas(file);
});

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

