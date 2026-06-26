// Complete i18n Implementation Example

// 1. INITIALIZATION
// Add to HTML head:
// <link rel="stylesheet" href="/css/i18n.css" />
// <script src="/js/i18n.js"></script>

// 2. LANGUAGE TOGGLE COMPONENT
// Add to navbar/topbar:
/*
<div class="language-toggle" id="languageToggle">
  <button class="lang-btn" data-lang="en" id="langEn">English</button>
  <button class="lang-btn" data-lang="ar" id="langAr">العربية</button>
</div>
*/

// 3. SETUP EVENT LISTENERS
function initializeLanguageToggle() {
  const currentLang = localStorage.getItem('language') || 'en';
  
  // Set active button
  const langButtons = document.querySelectorAll('.lang-btn');
  langButtons.forEach(btn => {
    if (btn.dataset.lang === currentLang) {
      btn.classList.add('active');
    }
    
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      i18n.setLanguage(btn.dataset.lang);
    });
  });
}

// 4. MARK ELEMENTS FOR TRANSLATION
// Use data-i18n attribute:
/*
<h1 data-i18n="students.title">Student Management</h1>
<button data-i18n="common.save">Save</button>
<input data-i18n-placeholder="common.search" />
*/

// 5. USE IN JAVASCRIPT
function createStudentCard(student) {
  return `
    <div class="student-card">
      <h3>${student.name}</h3>
      <p data-i18n="students.grade">${student.grade}</p>
      <button data-i18n="common.edit">Edit</button>
    </div>
  `;
}

// For dynamic content, use i18n.t():
function showMessage() {
  const message = i18n.t('common.success'); // "Success" or "نجح"
  alert(message);
}

// 6. SWITCHING LANGUAGE
function switchLanguage(lang) {
  i18n.setLanguage(lang); // 'en' or 'ar'
  // Page reloads automatically
}

// 7. GET CURRENT LANGUAGE
function getCurrentLanguage() {
  return i18n.getLanguage(); // 'en' or 'ar'
}

// ADDING NEW TRANSLATIONS
// Edit i18n.js translations object:
/*
translations: {
  en: {
    'my.custom.key': 'English text',
    ...
  },
  ar: {
    'my.custom.key': 'النص العربي',
    ...
  }
}
*/

// Then use:
// <h2 data-i18n="my.custom.key">English text</h2>
// Or: const text = i18n.t('my.custom.key');

// STYLING CONSIDERATIONS
// The system automatically handles:
// - RTL text direction
// - Arabic font support
// - Margin/padding flipping
// - Form alignment
// - Icon positioning

// TEST CURRENT STATE
function testI18n() {
  console.log('Current Language:', i18n.getLanguage());
  console.log('Student Title (EN):', 'students.title');
  console.log('Result:', i18n.t('students.title'));
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initializeLanguageToggle();
  i18n.applyLanguage();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeLanguageToggle,
    switchLanguage,
    getCurrentLanguage,
    testI18n
  };
}
