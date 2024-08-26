// src/components/colorPicker.js

export function initializeColorPicker(setColor) {
  const colorInput = document.getElementById("colorPickerInput");

  colorInput.addEventListener("input", (event) => {
    const selectedColor = event.target.value;
    setColor(selectedColor);
  });
}
