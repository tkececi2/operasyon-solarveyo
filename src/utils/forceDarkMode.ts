// User-based Dark Mode (not forced)
export function initDarkMode() {
  // Don't force dark mode anymore
  // Theme will be loaded from user preferences
  console.log('🎨 Tema sistemi başlatıldı - Kullanıcı tercihleri yüklenecek');
  
  // Override any inline styles
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        const element = mutation.target as HTMLElement;
        if (element.style.backgroundColor === 'white' || 
            element.style.backgroundColor === 'rgb(255, 255, 255)') {
          element.style.backgroundColor = '#1e293b';
        }
        if (element.style.color === 'black' || 
            element.style.color === 'rgb(0, 0, 0)') {
          element.style.color = '#f1f5f9';
        }
      }
    });
  });

  // Start observing
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['style'],
    subtree: true
  });

  console.log('🌙 Dark mode force-enabled');
}

// Auto-init
if (typeof window !== 'undefined') {
  initDarkMode();
}
