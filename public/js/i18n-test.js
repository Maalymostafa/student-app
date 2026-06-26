// i18n System Test
console.log('🌍 Testing i18n System...\n');

// Test 1: Check if i18n object exists
console.log('✓ Test 1: i18n object exists');
console.log('  i18n:', typeof i18n !== 'undefined' ? '✅ Found' : '❌ Not Found');

// Test 2: Check translations
console.log('\n✓ Test 2: Translation dictionaries');
console.log('  English translations:', Object.keys(i18n.translations.en).length + ' keys');
console.log('  Arabic translations:', Object.keys(i18n.translations.ar).length + ' keys');

// Test 3: Get translations
console.log('\n✓ Test 3: Getting translations');
console.log('  EN - students.title:', i18n.t('students.title', 'DEFAULT'));
console.log('  AR - students.title:', i18n.translations.ar['students.title']);

// Test 4: Current language
console.log('\n✓ Test 4: Current language');
console.log('  Current: ' + i18n.getLanguage());
console.log('  Stored: ' + localStorage.getItem('language'));

// Test 5: Language switching
console.log('\n✓ Test 5: Language switching');
console.log('  Function setLanguage:', typeof i18n.setLanguage);
console.log('  Function getLanguage:', typeof i18n.getLanguage);
console.log('  Function t:', typeof i18n.t);
console.log('  Function applyLanguage:', typeof i18n.applyLanguage);

// Test 6: Check for RTL attributes
console.log('\n✓ Test 6: HTML attributes');
console.log('  HTML lang:', document.documentElement.lang);
console.log('  HTML dir:', document.documentElement.dir);

// Test 7: Translation keys structure
console.log('\n✓ Test 7: Translation keys structure');
const sections = new Set();
Object.keys(i18n.translations.en).forEach(key => {
  const section = key.split('.')[0];
  sections.add(section);
});
console.log('  Sections:', Array.from(sections).join(', '));

// Test 8: Sample translations
console.log('\n✓ Test 8: Sample translations (EN/AR)');
const samples = [
  'nav.students',
  'students.title',
  'common.save',
  'dashboard.welcome'
];
samples.forEach(key => {
  const en = i18n.translations.en[key];
  const ar = i18n.translations.ar[key];
  console.log(`  ${key}:`);
  console.log(`    EN: ${en}`);
  console.log(`    AR: ${ar}`);
});

console.log('\n✅ All tests completed!');
console.log('\nUsage:');
console.log('  i18n.getLanguage()          // Get current language');
console.log('  i18n.setLanguage("ar")      // Switch to Arabic');
console.log('  i18n.t("key.name")          // Get translation');
console.log('  i18n.applyLanguage()        // Apply to page');
