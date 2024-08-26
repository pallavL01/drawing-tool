self.onmessage = function(event) {
    const { imageData, task, options } = event.data;

    let processedData;

    switch (task) {
        case 'blur':
            processedData = applyBoxBlur(imageData, options.radius || 1);
            break;
        // Add other tasks as needed
        default:
            console.error('Unknown task:', task);
    }

    self.postMessage({ imageData: processedData });
};

function applyBoxBlur(imageData, radius) {
    const { width, height, data } = imageData;
    const copy = new Uint8ClampedArray(data);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let r = 0, g = 0, b = 0, count = 0;

            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;

                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        const index = (ny * width + nx) * 4;
                        r += copy[index];
                        g += copy[index + 1];
                        b += copy[index + 2];
                        count++;
                    }
                }
            }

            const i = (y * width + x) * 4;
            data[i] = r / count;
            data[i + 1] = g / count;
            data[i + 2] = b / count;
        }
    }

    return imageData;
}
