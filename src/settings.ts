const b = document.getElementById('save');
const t = document.getElementById('gas-url') as HTMLInputElement;

b!.addEventListener('click', () => {
  const gasUrl = t.value;
  if (gasUrl) {
    chrome.storage.sync.set({ gasUrl: gasUrl }).then(() => {
      b!.classList.add('finished');
    });
  }
});

t.addEventListener('input', () => {
  b!.classList.remove('finished');
});

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get('gasUrl', (data) => {
    if (data.gasUrl) {
      t.value = data.gasUrl;
    }
  });
});
