document.querySelectorAll('#data-table td')
  .forEach(e => e.addEventListener("click", function() {
      // Here, `this` refers to the element the event was hooked on
    console.log("clicked");
  }));
  