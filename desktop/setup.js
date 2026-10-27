document.getElementById("f").addEventListener("submit", async (e) => {
  e.preventDefault();
  const error = await window.museoneDesktop.saveLink(document.getElementById("url").value.trim());
  document.getElementById("error").textContent = error || "";
});
