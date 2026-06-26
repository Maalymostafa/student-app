# نظام الترجمة والعربية - دليل الاستخدام

## 🌍 الميزات

- ✅ ترجمة سهلة بين الإنجليزية والعربية
- ✅ تخزين اختيار اللغة في localStorage
- ✅ دعم كامل لـ RTL (اليمين لليسار)
- ✅ دعم الخطوط العربية
- ✅ تبديل لغة بدون إعادة تحميل الصفحة (اختياري)

---

## 📦 الملفات المطلوبة

```
public/
├── js/
│   └── i18n.js                 # نظام الترجمة
├── css/
│   └── i18n.css               # أنماط RTL والترجمة
```

---

## 🚀 الخطوات السريعة

### 1️⃣ إضافة إلى HTML Head

```html
<head>
  <link rel="stylesheet" href="/css/i18n.css" />
  <script src="/js/i18n.js"></script>
</head>
```

### 2️⃣ إضافة Language Toggle في Navbar

```html
<div class="language-toggle" id="languageToggle">
  <button class="lang-btn" data-lang="en" id="langEn">English</button>
  <button class="lang-btn" data-lang="ar" id="langAr">العربية</button>
</div>
```

### 3️⃣ Initialize في JavaScript

```javascript
document.addEventListener('DOMContentLoaded', () => {
  const currentLang = localStorage.getItem('language') || 'en';
  
  // Set active button
  document.querySelectorAll('.lang-btn').forEach(btn => {
    if (btn.dataset.lang === currentLang) {
      btn.classList.add('active');
    }
    
    btn.addEventListener('click', () => {
      i18n.setLanguage(btn.dataset.lang);
    });
  });
});
```

### 4️⃣ استخدام في HTML

استخدم attribute `data-i18n` على أي عنصر:

```html
<h1 data-i18n="students.title">Student Management</h1>
<button data-i18n="common.save">Save</button>
<input data-i18n-placeholder="common.search" placeholder="Search..." />
```

### 5️⃣ استخدام في JavaScript

```javascript
// الحصول على نص مترجم
const message = i18n.t('common.success'); // "Success" أو "نجح"

// إنشاء عنصر HTML ديناميكي
function showGreeting() {
  const greeting = i18n.t('dashboard.welcome');
  document.querySelector('h1').textContent = greeting;
}

// الحصول على اللغة الحالية
const lang = i18n.getLanguage(); // 'en' أو 'ar'
```

---

## 📝 إضافة ترجمات جديدة

عدّل ملف `public/js/i18n.js`:

```javascript
translations: {
  en: {
    'my.page.title': 'My Page',
    'my.page.button': 'Click Me',
  },
  ar: {
    'my.page.title': 'صفحتي',
    'my.page.button': 'اضغط هنا',
  }
}
```

ثم استخدمها:

```html
<h1 data-i18n="my.page.title">My Page</h1>
<button data-i18n="my.page.button">Click Me</button>
```

---

## 🎨 الأنماط المتضمنة

### Language Toggle

```html
<div class="language-toggle">
  <button class="lang-btn active">English</button>
  <button class="lang-btn">العربية</button>
</div>
```

### RTL Support

تطبق تلقائياً عند تفعيل العربية:
- قلب الـ margins و padding
- دعم الخطوط العربية
- قلب الأيقونات
- محاذاة النصوص

### Dark Mode

يعمل مع الـ dark mode الموجود بدون تغييرات.

---

## 💡 أمثلة عملية

### مثال 1: جدول ديناميكي

```javascript
function renderStudents(students) {
  return students.map(student => `
    <tr>
      <td>${student.name}</td>
      <td>${student.grade}</td>
      <td>
        <button data-i18n="common.edit">Edit</button>
        <button data-i18n="common.delete">Delete</button>
      </td>
    </tr>
  `).join('');
}
```

### مثال 2: رسالة ديناميكية

```javascript
function showSuccess(action) {
  const message = i18n.t('common.success');
  document.querySelector('.message').textContent = `${message}: ${action}`;
}
```

### مثال 3: Conditional Display

```javascript
function showLanguageSpecificContent() {
  if (i18n.getLanguage() === 'ar') {
    // عرض محتوى عربي خاص
  } else {
    // عرض محتوى إنجليزي خاص
  }
}
```

---

## 🔄 الترجمة التلقائية

عند الضغط على زر تبديل اللغة:

1. ✅ تخزين الاختيار في localStorage
2. ✅ تحديث `html[lang]` و `html[dir]`
3. ✅ ترجمة جميع العناصر مع `data-i18n`
4. ✅ إعادة تحميل الصفحة تلقائياً

---

## 🐛 استكشاف الأخطاء

### المشكلة: الترجمة لا تظهر

**الحل:**
- تأكد من وجود `<script src="/js/i18n.js"></script>` في HTML
- تحقق من `data-i18n` attribute (بدون مسافات)
- افتح Browser Console وتحقق من الأخطاء

### المشكلة: RTL لا يعمل للعربية

**الحل:**
- تأكد من وجود `<link rel="stylesheet" href="/css/i18n.css" />`
- تحقق من أن الخط يدعم العربية

### المشكلة: اللغة لا تتغير

**الحل:**
```javascript
// اختبر يدوياً في Browser Console:
i18n.setLanguage('ar');
```

---

## 📊 Structure الترجمات

```
Key Structure: 'section.subsection.key'

Examples:
- 'nav.students'          // Navigation
- 'students.title'        // Students Page
- 'common.save'           # Common Actions
- 'dashboard.welcome'     # Dashboard
- 'support.message'       # Support System
```

---

## 🎯 Best Practices

1. **استخدم namespaces واضحة** للمفاتيح
2. **ترجم الثوابت فقط** وليس الأرقام أو الأسماء
3. **استخدم `data-i18n`** للعناصر الثابتة
4. **استخدم `i18n.t()`** للمحتوى الديناميكي
5. **اختبر كلا اللغتين** قبل الإطلاق

---

## 🚀 الخطوة التالية

لتفعيل النظام على جميع الصفحات:

1. أضف i18n.js و i18n.css إلى كل HTML file
2. أضف language toggle إلى navbar/topbar
3. أضف `data-i18n` attributes للعناصر
4. اختبر تبديل اللغات

**تم! الآن موقعك مدعوم بالعربية والإنجليزية!** 🎉

