// components/colorPicker.js

export function initializeColorPicker() {
    const colorPicker = document.getElementById('colorPicker');
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = '#000000'; // Default color

    colorInput.addEventListener('input', (event) => {
        const selectedColor = event.target.value;
        document.getElementById('drawingCanvas').getContext('2d').strokeStyle = selectedColor;
    });

    colorPicker.appendChild(colorInput);
}
