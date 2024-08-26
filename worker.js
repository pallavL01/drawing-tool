// worker.js

self.onmessage = function (event) {
  const { task, imageData, options } = event.data;

  switch (task) {
    case "applyFilter":
      const filteredData = applyFilter(imageData, options.filter);
      self.postMessage({ imageData: filteredData });
      break;
    // Add other cases for different tasks
  }
};

function applyFilter(imageData, filter) {
  switch (filter) {
    case "blur":
      return blurFilter(imageData);
    case "invert":
      return invertFilter(imageData);
    case "grayscale":
      return grayscaleFilter(imageData);
    default:
      return imageData;
  }
}

function blurFilter(imageData) {
  const radius = 3; // Example blur radius
  const { width, height } = imageData;
  const tempCanvas = new OffscreenCanvas(width, height);
  const tempCtx = tempCanvas.getContext("2d");

  tempCtx.putImageData(imageData, 0, 0);
  tempCtx.filter = `blur(${radius}px)`;
  tempCtx.drawImage(tempCanvas, 0, 0);

  return tempCtx.getImageData(0, 0, width, height);
}

function invertFilter(imageData) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i]; // Red
    data[i + 1] = 255 - data[i + 1]; // Green
    data[i + 2] = 255 - data[i + 2]; // Blue
  }
  return imageData;
}

function grayscaleFilter(imageData) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = avg; // Red
    data[i + 1] = avg; // Green
    data[i + 2] = avg; // Blue
  }
  return imageData;
}
