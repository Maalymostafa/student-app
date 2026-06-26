// Internationalization System
const i18n = {
  currentLang: localStorage.getItem('language') || 'en',
  
  translations: {
    en: {
      // Navigation & Common
      'nav.students': 'Students',
      'nav.registrations': 'Registrations',
      'nav.attendance': 'Attendance',
      'nav.quizzes': 'Quizzes',
      'nav.grading': 'Grading',
      'nav.results': 'Results',
      'nav.support': 'Support',
      'nav.parent': 'Parent Portal',
      'nav.dashboard': 'Dashboard',
      'nav.logout': 'Logout',
      'nav.language': 'Language',
      
      // Dashboard
      'dashboard.welcome': 'Welcome',
      'dashboard.sessions': "Today's sessions",
      'dashboard.payments': 'Payments due',
      'dashboard.absent': 'Absent students',
      'dashboard.pending': 'Pending reminders',
      
      // Students
      'students.title': 'Student Management',
      'students.list': 'Students List',
      'students.add': 'Add Student',
      'students.name': 'Full Name',
      'students.grade': 'School Grade',
      'students.status': 'Status',
      'students.search': 'Search students...',
      'students.edit': 'Edit',
      'students.archive': 'Archive',
      'students.delete': 'Delete',
      
      // Registrations
      'registrations.title': 'Registrations',
      'registrations.confirm': 'Confirm',
      'registrations.reject': 'Reject',
      'registrations.payment': 'Payment Review',
      'registrations.status': 'Status',
      'registrations.pending': 'Pending',
      'registrations.confirmed': 'Confirmed',
      
      // Quizzes
      'quizzes.title': 'Quiz Manager',
      'quizzes.create': 'Create Quiz',
      'quizzes.title_label': 'Quiz Title',
      'quizzes.submit': 'Submit',
      'quizzes.edit': 'Edit',
      'quizzes.delete': 'Delete',
      'quizzes.questions': 'Questions',
      'quizzes.addQuestion': 'Add Question',
      'quizzes.take': 'Take Quiz',
      
      // Attendance
      'attendance.title': 'Attendance',
      'attendance.grade': 'School Grade',
      'attendance.upload': 'Upload Zoom Chat',
      'attendance.present': 'Present',
      'attendance.absent': 'Absent',
      'attendance.history': 'Attendance History',
      
      // Grading
      'grading.title': 'Grading',
      'grading.submission': 'Submissions',
      'grading.score': 'Score',
      'grading.feedback': 'Feedback',
      'grading.correction': 'Correction Photo',
      'grading.save': 'Save',
      
      // Support
      'support.title': 'Support Inbox',
      'support.message': 'Message',
      'support.category': 'Category',
      'support.status': 'Status',
      'support.reply': 'Reply',
      'support.approve': 'Approve',
      'support.new': 'New',
      'support.answered': 'Answered',
      
      // Parent Portal
      'parent.title': 'Parent Portal',
      'parent.children': 'Children',
      'parent.grades': 'Grades',
      'parent.attendance': 'Attendance',
      'parent.balance': 'Balance',
      
      // Auth
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.login': 'Login',
      'auth.logout': 'Logout',
      
      // Common Actions
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.back': 'Back',
      'common.search': 'Search',
      'common.filter': 'Filter',
      'common.loading': 'Loading...',
      'common.error': 'An error occurred',
      'common.success': 'Success',
      'common.english': 'English',
      'common.arabic': 'العربية',
      'common.quickActions': 'Quick actions',
      'common.attention': 'What needs attention',
      'common.design': 'Visual design',
      'common.chooseLook': 'Choose a better look',
      'common.registration': 'Registration workflow',
      'common.reviewPayment': 'Review payment proofs',
      'common.grading': 'Zoom webinar grading',
      'common.attendanceQuizzes': 'Attendance, quizzes, and correction',
      'common.support': 'Support workflow',
      'common.reviewQuestions': 'Review repeated questions',
      'nav.account': 'Account',
    },
    
    ar: {
      // Navigation & Common
      'nav.students': 'الطلاب',
      'nav.registrations': 'التسجيلات',
      'nav.attendance': 'الحضور',
      'nav.quizzes': 'الاختبارات',
      'nav.grading': 'التقييم',
      'nav.results': 'النتائج',
      'nav.support': 'الدعم',
      'nav.parent': 'بوابة الآباء',
      'nav.dashboard': 'لوحة التحكم',
      'nav.logout': 'تسجيل الخروج',
      'nav.language': 'اللغة',
      
      // Dashboard
      'dashboard.welcome': 'أهلاً وسهلاً',
      'dashboard.sessions': 'الجلسات اليوم',
      'dashboard.payments': 'المدفوعات المستحقة',
      'dashboard.absent': 'الطلاب الغائبون',
      'dashboard.pending': 'التنبيهات المعلقة',
      
      // Students
      'students.title': 'إدارة الطلاب',
      'students.list': 'قائمة الطلاب',
      'students.add': 'إضافة طالب',
      'students.name': 'الاسم الكامل',
      'students.grade': 'الصف الدراسي',
      'students.status': 'الحالة',
      'students.search': 'ابحث عن الطلاب...',
      'students.edit': 'تعديل',
      'students.archive': 'أرشيف',
      'students.delete': 'حذف',
      
      // Registrations
      'registrations.title': 'التسجيلات',
      'registrations.confirm': 'تأكيد',
      'registrations.reject': 'رفض',
      'registrations.payment': 'مراجعة الدفع',
      'registrations.status': 'الحالة',
      'registrations.pending': 'معلق',
      'registrations.confirmed': 'مؤكد',
      
      // Quizzes
      'quizzes.title': 'مدير الاختبارات',
      'quizzes.create': 'إنشاء اختبار',
      'quizzes.title_label': 'عنوان الاختبار',
      'quizzes.submit': 'إرسال',
      'quizzes.edit': 'تعديل',
      'quizzes.delete': 'حذف',
      'quizzes.questions': 'الأسئلة',
      'quizzes.addQuestion': 'إضافة سؤال',
      'quizzes.take': 'الإجابة على الاختبار',
      
      // Attendance
      'attendance.title': 'الحضور',
      'attendance.grade': 'الصف الدراسي',
      'attendance.upload': 'تحميل محادثة Zoom',
      'attendance.present': 'حاضر',
      'attendance.absent': 'غائب',
      'attendance.history': 'سجل الحضور',
      
      // Grading
      'grading.title': 'التقييم',
      'grading.submission': 'الإجابات',
      'grading.score': 'الدرجة',
      'grading.feedback': 'التعليق',
      'grading.correction': 'صورة التصحيح',
      'grading.save': 'حفظ',
      
      // Support
      'support.title': 'صندوق الدعم',
      'support.message': 'الرسالة',
      'support.category': 'الفئة',
      'support.status': 'الحالة',
      'support.reply': 'الرد',
      'support.approve': 'الموافقة',
      'support.new': 'جديد',
      'support.answered': 'تم الرد',
      
      // Parent Portal
      'parent.title': 'بوابة الآباء',
      'parent.children': 'الأطفال',
      'parent.grades': 'الدرجات',
      'parent.attendance': 'الحضور',
      'parent.balance': 'الرصيد',
      
      // Auth
      'auth.email': 'البريد الإلكتروني',
      'auth.password': 'كلمة المرور',
      'auth.login': 'دخول',
      'auth.logout': 'تسجيل الخروج',
      
      // Common Actions
      'common.save': 'حفظ',
      'common.cancel': 'إلغاء',
      'common.delete': 'حذف',
      'common.edit': 'تعديل',
      'common.back': 'رجوع',
      'common.search': 'بحث',
      'common.filter': 'تصفية',
      'common.loading': 'جاري التحميل...',
      'common.error': 'حدث خطأ',
      'common.success': 'نجح',
      'common.english': 'English',
      'common.arabic': 'العربية',
      'common.quickActions': 'إجراءات سريعة',
      'common.attention': 'ما يحتاج اهتمام',
      'common.design': 'التصميم البصري',
      'common.chooseLook': 'اختر مظهراً أفضل',
      'common.registration': 'سير التسجيل',
      'common.reviewPayment': 'مراجعة إثباتات الدفع',
      'common.grading': 'تقييم ندوة Zoom',
      'common.attendanceQuizzes': 'الحضور والاختبارات والتصحيح',
      'common.support': 'سير الدعم',
      'common.reviewQuestions': 'مراجعة الأسئلة المتكررة',
      'nav.account': 'الحساب',
    }
  },

  t(key, defaultValue = key) {
    const keys = key.split('.');
    let value = this.translations[this.currentLang];
    
    for (let k of keys) {
      value = value?.[k];
    }
    
    return value || defaultValue;
  },

  setLanguage(lang) {
    if (lang === 'en' || lang === 'ar') {
      this.currentLang = lang;
      localStorage.setItem('language', lang);
      this.applyLanguage();
    }
  },

  getLanguage() {
    return this.currentLang;
  },

  applyLanguage() {
    const html = document.documentElement;
    html.lang = this.currentLang;
    html.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });
    
    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.t(key);
    });
  },

  init() {
    this.applyLanguage();
  }
};

window.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('[data-i18n], [data-i18n-placeholder]')) {
    i18n.init();
  }
});
