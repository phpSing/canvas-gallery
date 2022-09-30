# canvas-gallery
canvas-gallery

## Features
- Ability to create/clear annotation tags on currently selected image
- Tags need to be draggable aka re-positionable by clicking and dragging the mouse on the tag box
  - partially done
  - suppose to re-render annotation indenpently rather than re-render image again, which cause the flash
- Switch between images with next/back/delete image feature
- All content should be stored in the browser side storage and initialized on load/refresh of the page
- App should allow multiple images uploads and multiple associated tags per image
- Annotations should show correctly even when screen resolution changes e.g. landscape/ portrait. 
- Handle cases where screen resolution is too small to function by displaying a message to the user.
  - Not implemented
  - Implementation can be done by checking the window size on initial load and resize event to show/hide a global overlay

## Notes
- Done by a bit rush (really heavy features delivery this week, squeezed 2 nights on this task)
- A lot of improvement to be done including extracting renderer and pure calculation functions
- Basic mechanism is leveraging on setter and getter, re-render related DOM on change
- Only vanilla JS used

## To Run
- Recommended: start local http service to browser the index.html (e.g. Live Server Plugin)
- Open index.html in Chrome
