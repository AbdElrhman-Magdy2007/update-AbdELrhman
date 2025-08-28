# دليل استخدام الـ Scrollbar الاحترافي

## نظرة عامة
تم تطوير نظام scrollbar احترافي ومتقدم يتضمن تأثيرات بصرية جميلة ومتناسقة مع تصميم الموقع.

## الميزات الرئيسية

### 1. Scrollbar متدرج مع تأثيرات
- تدرج لوني جميل يتماشى مع ألوان الموقع
- تأثيرات hover وactive
- انيميشن متدرج
- تأثير glow عند التفاعل

### 2. مؤشر التقدم (Progress Bar)
- شريط تقدم في أعلى الصفحة
- يظهر مدى التقدم في القراءة
- تأثيرات ضوئية جميلة

### 3. زر العودة للأعلى
- زر عائم في الزاوية السفلية
- يظهر عند النزول 300px
- تأثيرات hover وانيميشن

## كيفية الاستخدام

### 1. استخدام ScrollManager Component

```tsx
import ScrollManager from '@/components/ScrollManager';

function MyPage() {
  return (
    <div>
      <ScrollManager 
        showProgressBar={true}
        showScrollToTop={true}
        scrollToTopOffset={300}
        progressBarHeight={3}
      />
      {/* محتوى الصفحة */}
    </div>
  );
}
```

### 2. استخدام CSS Classes

```tsx
// Scrollbar عادي مع تأثيرات
<div className="scrollbar-animated">
  {/* المحتوى */}
</div>

// Scrollbar مع تأثير النبض
<div className="scrollbar-pulse">
  {/* المحتوى */}
</div>

// Scrollbar مع تأثير الإضاءة
<div className="scrollbar-glow">
  {/* المحتوى */}
</div>

// Scrollbar مخفي
<div className="scrollbar-hidden">
  {/* المحتوى */}
</div>

// Scrollbar رفيع للموبايل
<div className="scrollbar-minimal">
  {/* المحتوى */}
</div>
```

### 3. استخدام Custom Hooks

```tsx
import { useScrollbar, useScrollDirection } from '@/hooks/useScrollbar';

function MyComponent() {
  const {
    scrollProgress,
    scrollPosition,
    scrollToTop,
    scrollToElement
  } = useScrollbar({
    hideOnInactive: true,
    inactiveDelay: 2000,
    customClass: 'scrollbar-glow'
  });

  const scrollDirection = useScrollDirection();

  return (
    <div>
      <p>تقدم القراءة: {scrollProgress.toFixed(1)}%</p>
      <p>اتجاه التمرير: {scrollDirection}</p>
      <button onClick={scrollToTop}>العودة للأعلى</button>
    </div>
  );
}
```

## الأنماط المتاحة

### 1. الأنماط الأساسية
- `scrollbar-animated`: scrollbar مع انيميشن متدرج
- `scrollbar-pulse`: scrollbar مع تأثير النبض
- `scrollbar-glow`: scrollbar مع تأثير الإضاءة
- `scrollbar-minimal`: scrollbar رفيع ومبسط
- `scrollbar-thick`: scrollbar سميك
- `scrollbar-hidden`: scrollbar مخفي

### 2. الأنماط التفاعلية
- `scrollbar-auto-hide`: يختفي عند عدم الاستخدام
- `projects-scrollbar`: مخصص لصفحة المشاريع
- `code-scrollbar`: مخصص لكتل الكود

### 3. الأنماط المتجاوبة
- تلقائياً يتكيف مع أحجام الشاشات المختلفة
- دعم للوضع المظلم
- دعم للتباين العالي
- دعم لتقليل الحركة

## التخصيص

### تغيير الألوان
```css
::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #your-color-1, #your-color-2);
}
```

### تغيير الحجم
```css
::-webkit-scrollbar {
  width: 16px; /* العرض */
  height: 16px; /* الارتفاع */
}
```

### إضافة تأثيرات مخصصة
```css
.my-custom-scrollbar::-webkit-scrollbar-thumb {
  background: your-gradient;
  box-shadow: your-shadow;
  animation: your-animation;
}
```

## الدعم للمتصفحات
- ✅ Chrome/Chromium
- ✅ Safari
- ✅ Edge
- ✅ Firefox (دعم محدود)
- ✅ Mobile browsers

## نصائح للأداء
1. استخدم `passive: true` مع event listeners
2. استخدم `requestAnimationFrame` للانيميشن
3. تجنب التحديثات المفرطة للـ DOM
4. استخدم CSS transforms بدلاً من تغيير الخصائص المباشرة

## أمثلة متقدمة

### Scrollbar مع مؤشر التقدم المدمج
```tsx
function AdvancedScrollbar() {
  const { scrollProgress } = useScrollbar();
  
  return (
    <div 
      className="scrollbar-progress"
      style={{
        '--scroll-progress': `${scrollProgress}%`
      }}
    >
      {/* المحتوى */}
    </div>
  );
}
```

### Scrollbar مع تحكم ديناميكي
```tsx
function DynamicScrollbar() {
  const [scrollbarType, setScrollbarType] = useState('glow');
  
  return (
    <div className={`scrollbar-${scrollbarType}`}>
      <select onChange={(e) => setScrollbarType(e.target.value)}>
        <option value="glow">مضيء</option>
        <option value="pulse">نابض</option>
        <option value="animated">متحرك</option>
      </select>
      {/* المحتوى */}
    </div>
  );
}
```

## الصيانة والتحديث
- تحقق من التوافق مع المتصفحات الجديدة
- اختبر الأداء على الأجهزة المختلفة
- راقب ملاحظات المستخدمين
- حدث الألوان حسب تطور التصميم