// ============================================================================
// البيانات الأولية والتحميل من التخزين المحلي (localStorage)
// ============================================================================

// *** إعدادات GitHub Gist API (لغرض التجربة فقط - غير آمن في الإنتاج!) ***
const GIST_ID = 'b5c662f7a46a27f91f8fded411625bd4'; // استبدل هذا بمعرف Gist الخاص بك
const GITHUB_PAT = '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'; // استبدل هذا برمز PAT الخاص بك
const GIST_FILENAME = 'adhkar_data.json'; // تأكد أنه نفس اسم الملف الذي أنشأته في Gist

// وظيفة لحفظ البيانات إلى localStorage (لا يزال مطلوبًا كنسخة احتياطية أو مؤقتة)
function saveDataToLocalStorage(data, key) {
    localStorage.setItem(key, JSON.stringify(data));
}

// وظيفة لتحميل البيانات من localStorage (لا يزال مطلوبًا كنسخة احتياطية)
function loadDataFromLocalStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

// وظيفة لتحميل البيانات من GitHub Gist
async function loadDataFromGist() {
    const gistUrl = `https://api.github.com/gists/${GIST_ID}`;
    try {
        const response = await fetch(gistUrl, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `token ${GITHUB_PAT}` // مطلوب للقراءة من Gist الخاص بك إذا كان سريًا
            }
        });

        if (!response.ok) {
            console.error('Failed to fetch Gist data:', response.status, response.statusText);
            // إذا فشل الجلب من Gist، حاول التحميل من localStorage كخيار احتياطي
            return loadDataFromLocalStorage('adhkar_app_backup'); // استخدام مفتاح مختلف للنسخ الاحتياطي
        }

        const gistData = await response.json();
        if (gistData.files && gistData.files[GIST_FILENAME]) {
            const content = gistData.files[GIST_FILENAME].content;
            return JSON.parse(content);
        } else {
            console.warn('Gist file not found or empty:', GIST_FILENAME);
            return loadDataFromLocalStorage('adhkar_app_backup');
        }
    } catch (error) {
        console.error('Error loading data from Gist:', error);
        return loadDataFromLocalStorage('adhkar_app_backup'); // في حالة وجود خطأ، حاول التحميل من localStorage
    }
}

// وظيفة لحفظ البيانات إلى GitHub Gist
async function saveDataToGist() {
    const gistUrl = `https://api.github.com/gists/${GIST_ID}`;
    // إزالة intervalId لأنه لا ينبغي حفظه، وتضمين currentCount و isFavorite
    const dataToSave = {
        adhkar: adhkar.map(item => ({ ...item, currentCount: item.currentCount, isFavorite: item.isFavorite, intervalId: undefined })),
        adhkarTypes: adhkarTypes,
        reminders: reminders.map(({ id, adhkarId, time, sound }) => ({ id, adhkarId, time, sound }))
    };

    try {
        const response = await fetch(gistUrl, {
            method: 'PATCH', // استخدم PATCH لتحديث Gist موجود
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `token ${GITHUB_PAT}`
            },
            body: JSON.stringify({
                description: 'Adhkar App Data Updated', // وصف اختياري للتحديث
                files: {
                    [GIST_FILENAME]: {
                        content: JSON.stringify(dataToSave, null, 2) // حفظ البيانات المحدثة
                    }
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to save data to Gist:', response.status, response.statusText, errorText);
            alert('فشل حفظ البيانات على الإنترنت! تم الحفظ محليًا فقط.');
            // في حالة الفشل، لا يزال بإمكاننا حفظ نسخة احتياطية في localStorage
            saveDataToLocalStorage(dataToSave, 'adhkar_app_backup');
        } else {
            console.log('Data saved to Gist successfully!');
            // بعد الحفظ الناجح على Gist، يمكننا أيضًا تحديث النسخة المحلية في localStorage
            saveDataToLocalStorage(dataToSave, 'adhkar_app_backup');
        }
    } catch (error) {
        console.error('Error saving data to Gist:', error);
        alert('حدث خطأ أثناء الاتصال بخادم Gist. تم الحفظ محليًا فقط.');
        saveDataToLocalStorage(dataToSave, 'adhkar_app_backup');
    }
}


// البيانات الافتراضية التي تُستخدم إذا لم تكن هناك بيانات محفوظة
const defaultAdhkar = [
    { id: '1', text: 'اللهم بك أصبحنا، وبك أمسينا، وبك نحيا، وبك نموت، وإليك النشور.', type: 'morning', count: 1, benefit: 'دعاء الصباح' },
    { id: '2', text: 'اللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك، وأنا على عهدك ووعدك ما استطعت، أعوذ بك من شر ما صنعت، أبوء لك بنعمتك علي، وأبوء بذنبي فاغفر لي فإنه لا يغفر الذنوب إلا أنت.', type: 'morning', count: 1, benefit: 'سيد الاستغفار' },
    { id: '3', text: 'رضيت بالله رباً، وبالإسلام ديناً، وبمحمد صلى الله عليه وسلم نبياً ورسولاً.', type: 'morning', count: 3, benefit: 'الحفاظ على الإيمان' },
    { id: '4', text: 'اللهم بك أمسينا، وبك أصبحنا، وبك نحيا، وبك نموت، وإليك المصير.', type: 'evening', count: 1, benefit: 'دعاء المساء' },
    { id: '5', text: 'أعوذ بكلمات الله التامات من شر ما خلق.', type: 'evening', count: 3, benefit: 'الحماية من الشرور' },
    { id: '6', text: 'بسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء وهو السميع العليم.', type: 'evening', count: 3, benefit: 'الحماية من البلاء' },
    { id: '7', text: 'سبحان الله وبحمده عدد خلقه ورضا نفسه وزنة عرشه ومداد كلماته.', type: 'general', count: 3, benefit: 'ذكر عام' },
    { id: '8', text: 'لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير.', type: 'general', count: 100, benefit: 'فضل عظيم' },
];

const defaultAdhkarTypes = [
    { id: 'type_morning', name: 'أذكار الصباح', value: 'morning' },
    { id: 'type_evening', name: 'أذكار المساء', value: 'evening' },
    { id: 'type_general', name: 'أذكار عامة', value: 'general' },
    { id: 'type_favorites', name: 'المفضلة', value: 'favorites' }
];

// تحميل البيانات عند بدء التشغيل سيتم في DOMContentLoaded
let adhkar;
let adhkarTypes;
let reminders;


// بيانات اعتماد المسؤول (يتم تحميلها من localStorage أو استخدام الافتراضية)
let adminCredentials = loadDataFromLocalStorage('adminCredentials') || {
    username: "admin",
    password: "password123"
};

// وظيفة لحفظ بيانات اعتماد المسؤول إلى localStorage
function saveAdminCredentialsToLocalStorage() {
    saveDataToLocalStorage(adminCredentials, 'adminCredentials');
}

// المتغيرات التي تتحكم في حالة التطبيق
let currentFilterType;
let currentEditedAdhkarId = null;
let isAdminLoggedIn = loadDataFromLocalStorage('isAdminLoggedIn') || false;
const isUserView = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
let currentAdhkarForReminderModal = null; // لتخزين الذكر الحالي الذي تُفتح لأجله نافذة التذكير
let currentAdminTab = null; // لتخزين التبويب النشط في لوحة التحكم

// حالة الوضع الليلي
let isDarkMode = loadDataFromLocalStorage('darkMode') || false;

// قائمة بنغمات التنبيه المتاحة
const reminderSounds = {
    silent: null, // لا يوجد صوت
    bell: 'sounds/bell.mp3',
    chime: 'sounds/chime.mp3',
    xylophone: 'sounds/xylophone.mp3',
};


// ============================================================================
// وظائف العرض (Rendering Functions) - تقوم بإنشاء وتحديث عناصر HTML
// ============================================================================

// وظيفة لعرض الأذكار بناءً على النوع المحدد (خاصة بـ index.html)
function renderAdhkar(type, searchTerm = '') {
    // تتأكد هذه الوظيفة من أنها تُعرض فقط في واجهة المستخدم (index.html) وأن العناصر المطلوبة موجودة
    if (!adhkarDisplayContainer || !filterButtonsContainer || !searchInput || !isUserView) {
        return;
    }

    currentFilterType = type;
    let filteredAdhkar = [];

    if (type === 'favorites') {
        filteredAdhkar = adhkar.filter(item => item.isFavorite);
    } else {
        filteredAdhkar = adhkar.filter(item => item.type === type);
    }

    if (searchTerm) {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        filteredAdhkar = filteredAdhkar.filter(item =>
            item.text.toLowerCase().includes(lowerCaseSearchTerm) ||
            (item.benefit && item.benefit.toLowerCase().includes(lowerCaseSearchTerm))
        );
    }

    adhkarDisplayContainer.innerHTML = '';

    if (filteredAdhkar.length === 0) {
        adhkarDisplayContainer.innerHTML = `<div class="no-adhkar-message">لا توجد أذكار لعرضها لهذا النوع حالياً.</div>`;
    }

    filteredAdhkar.forEach(item => {
        const adhkarCard = document.createElement('div');
        adhkarCard.className = 'adhkar-card';

        // يتم عرض تفاعلات المستخدم دائمًا في index.html
        const favoriteClass = item.isFavorite ? 'active' : '';
        const userInteractionsHtml = `
            <div class="adhkar-counter-wrapper">
                <button onclick="increaseAdhkarCount('${item.id}')">ذكر</button>
                <span class="adhkar-count-val" id="count-${item.id}">${item.currentCount}</span>
                <button class="reset-counter-btn" onclick="resetAdhkarCount('${item.id}')">تصفير</button>
            </div>
            <div class="adhkar-interactions">
                <button class="favorite-btn ${favoriteClass}" onclick="toggleFavorite('${item.id}')">
                    <i class="${item.isFavorite ? 'fas' : 'far'} fa-star"></i>
                </button>
                <button class="reminder-btn" onclick="showReminderModal('${item.id}')"><i class="fas fa-bell"></i></button>
                <button class="share-btn" onclick="shareAdhkar('${item.id}')"><i class="fas fa-share-alt"></i></button>
            </div>
        `;

        adhkarCard.innerHTML = `
            <div>
                <p class="adhkar-text">${item.text}</p>
                ${item.benefit ? `<p class="adhkar-benefit">الفائدة: ${item.benefit}</p>` : ''}
            </div>
            ${item.count ? `<div class="adhkar-count-display">العدد الموصى به: ${item.count}</div>` : ''}
            ${userInteractionsHtml}
        `;
        adhkarDisplayContainer.appendChild(adhkarCard);
    });

    const buttons = filterButtonsContainer.querySelectorAll('button');
    buttons.forEach(button => {
        if (button.dataset.type === type) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

// وظيفة لعرض الأذكار في لوحة التحكم بناءً على التبويبات (خاصة بـ admin.html)
function renderAdhkarForAdminPanel(type) {
    // تتأكد هذه الوظيفة من أنها تُعرض فقط في لوحة التحكم (admin.html) وأن العنصر المطلوب موجود
    if (!adminTabContentContainer || isUserView) {
        return;
    }

    currentAdminTab = type; // تحديث التبويب النشط

    adminTabContentContainer.innerHTML = ''; // مسح المحتوى السابق

    let filteredAdhkar = [];
    if (type === 'all') { // تبويب "الكل"
        filteredAdhkar = adhkar;
    } else {
        filteredAdhkar = adhkar.filter(item => item.type === type);
    }

    if (filteredAdhkar.length === 0) {
        adminTabContentContainer.innerHTML = `<div class="no-adhkar-message">لا توجد أذكار لعرضها لهذا النوع حالياً.</div>`;
    }

    filteredAdhkar.forEach(item => {
        const adhkarCard = document.createElement('div');
        adhkarCard.className = 'adhkar-card'; // إعادة استخدام نمط البطاقة

        // إجراءات المسؤول
        const actionsHtml = `
            <div class="actions">
                <button class="adhkar-edit-btn" onclick="editAdhkar('${item.id}')">تعديل</button>
                <button class="delete-btn" onclick="deleteAdhkar('${item.id}')">حذف</button>
            </div>
        `;

        adhkarCard.innerHTML = `
            <div>
                <p class="adhkar-text">${item.text}</p>
                ${item.benefit ? `<p class="adhkar-benefit">الفائدة: ${item.benefit}</p>` : ''}
            </div>
            ${item.count ? `<div class="adhkar-count-display">العدد الموصى به: ${item.count}</div>` : ''}
            ${actionsHtml}
        `;
        adminTabContentContainer.appendChild(adhkarCard);
    });

    // تحديث حالة الأزرار النشطة للتبويبات
    const tabButtons = adminTabsContainer.querySelectorAll('.admin-tab-button');
    tabButtons.forEach(button => {
        if (button.dataset.type === type) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}


// وظيفة لعرض أزرار فلاتر أنواع الأذكار في وضع المستخدم (خاصة بـ index.html)
function renderFilterButtons() {
    // تتأكد هذه الوظيفة من أنها تُعرض فقط في واجهة المستخدم (index.html) وأن العنصر المطلوب موجود
    if (!filterButtonsContainer || !isUserView) {
        return;
    }

    filterButtonsContainer.innerHTML = '';
    adhkarTypes.forEach(type => {
        const button = document.createElement('button');
        button.textContent = type.name;
        button.dataset.type = type.value;
        button.addEventListener('click', () => renderAdhkar(type.value, searchInput.value));
        filterButtonsContainer.appendChild(button);
    });

    if (currentFilterType) {
        renderAdhkar(currentFilterType, searchInput.value);
    } else if (adhkarTypes.length > 0) {
        renderAdhkar(adhkarTypes[0].value, searchInput.value);
    }
}

// وظيفة لملء قائمة خيارات أنواع الأذكار في نموذج الإضافة/التعديل بلوحة التحكم (خاصة بـ admin.html)
function populateAdhkarTypeSelect() {
    // تتأكد هذه الوظيفة من أنها تُعرض فقط في لوحة التحكم (admin.html) وأن العنصر المطلوب موجود
    if (!adhkarTypeSelect || isUserView) {
        return;
    }

    adhkarTypeSelect.innerHTML = '';
    const selectableTypes = adhkarTypes.filter(type => type.value !== 'favorites');
    selectableTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.value;
        option.textContent = type.name;
        adhkarTypeSelect.appendChild(option);
    });
}

// وظيفة لعرض قائمة أنواع الأذكار في لوحة التحكم (مع أزرار الحذف) (خاصة بـ admin.html)
function renderTypesList() {
    // تتأكد هذه الوظيفة من أنها تُعرض فقط في لوحة التحكم (admin.html) وأن العنصر المطلوب موجود
    if (!typesList || isUserView) {
        return;
    }

    typesList.innerHTML = '';
    const editableTypes = adhkarTypes.filter(type => type.value !== 'favorites');
    editableTypes.forEach(type => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span>${type.name} (${type.value})</span>
            <button onclick="deleteType('${type.id}')">حذف</button>
        `;
        typesList.appendChild(listItem);
    });
}

// وظيفة لعرض قائمة التذكيرات الحالية في نافذة المودال (خاصة بـ index.html)
function renderCurrentReminders() {
    // تتأكد هذه الوظيفة من أنها تُعرض فقط في واجهة المستخدم (index.html) وأن العنصر المطلوب موجود
    if (!currentRemindersList || !isUserView) {
        return;
    }

    currentRemindersList.innerHTML = '';
    const remindersForCurrentAdhkar = reminders.filter(r => r.adhkarId === currentAdhkarForReminderModal);

    if (remindersForCurrentAdhkar.length === 0) {
        currentRemindersList.innerHTML = `<li class="no-reminders-message">لا توجد تذكيرات مضبوطة لهذا الذكر.</li>`;
        return;
    }

    remindersForCurrentAdhkar.forEach(r => {
        const listItem = document.createElement('li');
        const soundName = Object.keys(reminderSounds).find(key => reminderSounds[key] === r.sound) || 'غير معروف';
        listItem.innerHTML = `
            <span>عند: ${r.time} (${soundName === 'silent' ? 'صامت' : `نغمة: ${soundName}`})</span>
            <button onclick="deleteReminder('${r.id}')">حذف</button>
        `;
        currentRemindersList.appendChild(listItem);
    });
}

// وظيفة لإنشاء وعرض أزرار التبويبات في لوحة التحكم (خاصة بـ admin.html)
function renderAdminTabs() {
    if (!adminTabsContainer || isUserView) {
        return;
    }

    adminTabsContainer.innerHTML = '';

    // إضافة تبويب "الكل" أولاً
    const allTabButton = document.createElement('button');
    allTabButton.textContent = 'الكل';
    allTabButton.dataset.type = 'all';
    allTabButton.className = 'admin-tab-button';
    allTabButton.addEventListener('click', () => renderAdhkarForAdminPanel('all'));
    adminTabsContainer.appendChild(allTabButton);

    // إضافة تبويبات لأنواع الأذكار الموجودة
    const editableTypes = adhkarTypes.filter(type => type.value !== 'favorites');
    editableTypes.forEach(type => {
        const button = document.createElement('button');
        button.textContent = type.name;
        button.dataset.type = type.value;
        button.className = 'admin-tab-button';
        button.addEventListener('click', () => renderAdhkarForAdminPanel(type.value));
        adminTabsContainer.appendChild(button);
    });

    // تفعيل التبويب الأول أو التبويب النشط سابقًا
    if (currentAdminTab) {
        renderAdhkarForAdminPanel(currentAdminTab);
    } else if (adhkarTypes.length > 0) {
        renderAdhkarForAdminPanel('all'); // تفعيل تبويب "الكل" افتراضياً
    }
}


// ============================================================================
// وظائف إدارة البيانات (CRUD Operations)
// ============================================================================

function editAdhkar(id) {
    // لا تنفذ إلا إذا كنت في admin.html والعناصر المطلوبة موجودة
    if (!adhkarIdInput || !adhkarTextInput || !adhkarBenefitInput || !adhkarCountInput || !adhkarTypeSelect || !saveAdhkarBtn || !cancelEditBtn || !adminPanel || isUserView) {
        return;
    }
    const itemToEdit = adhkar.find(item => item.id === id);
    if (itemToEdit) {
        adhkarIdInput.value = itemToEdit.id;
        adhkarTextInput.value = itemToEdit.text;
        adhkarBenefitInput.value = itemToEdit.benefit || '';
        adhkarCountInput.value = itemToEdit.count || '';
        adhkarTypeSelect.value = itemToEdit.type;
        saveAdhkarBtn.textContent = 'تعديل الذكر';
        cancelEditBtn.classList.remove('hidden');
        adminPanel.scrollIntoView({ behavior: 'smooth' });
    }
}

async function deleteAdhkar(id) {
    // لا تنفذ إلا إذا كنت في admin.html
    if (isUserView) return;

    if (confirm('هل أنت متأكد من حذف هذا الذكر؟ سيتم حذف جميع التذكيرات المرتبطة به أيضاً.')) {
        adhkar = adhkar.filter(item => item.id !== id);
        reminders = reminders.filter(r => r.adhkarId !== id);
        clearAllReminderIntervals(); // مسح جميع مؤقتات التذكير
        setupAllReminders(); // إعادة جدولة التذكيرات المتبقية

        await saveDataToGist(); // حفظ التغييرات إلى Gist
        // بعد الحذف، أعد عرض قائمة الأذكار في لوحة المسؤول (للتأكد من تحديث التبويب الحالي)
        renderAdhkarForAdminPanel(currentAdminTab);
        alert('تم حذف الذكر بنجاح!');
    }
}

async function deleteType(id) {
    // لا تنفذ إلا إذا كنت في admin.html
    if (isUserView) return;

    if (confirm('هل أنت متأكد من حذف هذا النوع؟ سيتم حذف جميع الأذكار والتذكيرات المرتبطة به!')) {
        const typeToDelete = adhkarTypes.find(type => type.id === id);
        if (typeToDelete) {
            const adhkarToDeleteIds = adhkar.filter(item => item.type === typeToDelete.value).map(item => item.id);
            adhkar = adhkar.filter(item => item.type !== typeToDelete.value);

            reminders = reminders.filter(r => !adhkarToDeleteIds.includes(r.adhkarId));
            clearAllReminderIntervals();
            setupAllReminders();

            adhkarTypes = adhkarTypes.filter(type => type.id !== id);

            await saveDataToGist(); // حفظ التغييرات إلى Gist

            renderTypesList();
            populateAdhkarTypeSelect();
            renderAdminTabs(); // إعادة رسم التبويبات بعد حذف النوع
            // أعد عرض الأذكار في لوحة المسؤول بعد حذف النوع
            renderAdhkarForAdminPanel(currentAdminTab);
            alert('تم حذف النوع والأذكار والتذكيرات المرتبطة به بنجاح!');
        }
    }
}

// ============================================================================
// وظائف العداد والمفضلة والمشاركة (خاصة بـ index.html)
// ============================================================================

function increaseAdhkarCount(id) {
    // لا تنفذ إلا إذا كنت في index.html
    if (!isUserView) return;

    const item = adhkar.find(item => item.id === id);
    if (item && document.getElementById(`count-${id}`)) {
        item.currentCount++;
        saveDataToLocalStorage({ adhkar: adhkar, adhkarTypes: adhkarTypes, reminders: reminders }, 'adhkar_app_backup'); // تحديث النسخة الاحتياطية المحلية
        document.getElementById(`count-${id}`).textContent = item.currentCount;
    }
}

function resetAdhkarCount(id) {
    // لا تنفذ إلا إذا كنت في index.html
    if (!isUserView) return;

    const item = adhkar.find(item => item.id === id);
    if (item) {
        item.currentCount = 0;
        saveDataToLocalStorage({ adhkar: adhkar, adhkarTypes: adhkarTypes, reminders: reminders }, 'adhkar_app_backup'); // تحديث النسخة الاحتياطية المحلية
        document.getElementById(`count-${id}`).textContent = item.currentCount;
    }
}

async function toggleFavorite(id) {
    // لا تنفذ إلا إذا كنت في index.html
    if (!isUserView) return;

    const item = adhkar.find(item => item.id === id);
    if (item) {
        item.isFavorite = !item.isFavorite;
        await saveDataToGist(); // حفظ التغييرات إلى Gist
        renderAdhkar(currentFilterType, searchInput.value); // أعد العرض لتحديث زر المفضلة
    }
}

function shareAdhkar(id) {
    // لا تنفذ إلا إذا كنت في index.html
    if (!isUserView) return;

    const item = adhkar.find(item => item.id === id);
    if (item) {
        const shareText = `ذكر: ${item.text}\n${item.benefit ? `الفائدة: ${item.benefit}\n` : ''}${item.count ? `العدد الموصى به: ${item.count}\n` : ''}\nشارك في ذكر الله.`;

        if (navigator.share) {
            navigator.share({
                title: 'تطبيق الأذكار',
                text: shareText
            }).then(() => {
                console.log('تمت المشاركة بنجاح');
            }).catch((error) => {
                console.error('فشل المشاركة:', error);
                fallbackCopyText(shareText);
            });
        } else {
            fallbackCopyText(shareText);
        }
    }
}

function fallbackCopyText(text) {
    // لا تنفذ إلا إذا كنت في index.html
    if (!isUserView) return;

    navigator.clipboard.writeText(text)
        .then(() => {
            alert('تم نسخ الذكر إلى الحافظة! يمكنك لصقه ومشاركته الآن.');
        })
        .catch(err => {
            console.error('فشل نسخ النص: ', err);
            alert('لا يمكن نسخ النص تلقائياً. الرجاء نسخه يدوياً:\n' + text);
        });
}

// ============================================================================
// وظائف الوضع الليلي (Dark Mode) - مشتركة
// ============================================================================

function applyDarkMode(enable) {
    if (enable) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    isDarkMode = enable;
    saveDataToLocalStorage(isDarkMode, 'darkMode');
    // تحديث نص زر الوضع الليلي مباشرة
    if (toggleDarkModeBtn) {
        toggleDarkModeBtn.textContent = isDarkMode ? 'تبديل الوضع النهاري' : 'تبديل الوضع الليلي';
    }
}

// ============================================================================
// وظائف التذكير (Web Notifications API & Multiple Reminders) - خاصة بـ index.html
// ============================================================================

// طلب إذن الإشعارات عند بدء التشغيل (خاص بـ index.html)
function requestNotificationPermission() {
    // لا تطلب الإذن إلا إذا كنت في واجهة المستخدم
    if (!isUserView) return;

    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('تم منح إذن الإشعارات.');
            } else {
                console.warn('لم يتم منح إذن الإشعارات.');
            }
        });
    }
}

// وظيفة لعرض نافذة التذكير المنبثقة (خاصة بـ index.html)
function showReminderModal(adhkarId) {
    // لا تنفذ إلا إذا كنت في index.html والعناصر المطلوبة موجودة
    if (!reminderModal || !reminderAdhkarText || !isUserView) {
        return;
    }

    const selectedAdhkar = adhkar.find(item => item.id === adhkarId);
    if (!selectedAdhkar) {
        alert('الذكر المحدد غير موجود.');
        return;
    }

    currentAdhkarForReminderModal = adhkarId; // حفظ معرف الذكر الحالي
    reminderAdhkarText.textContent = selectedAdhkar.text;

    // تعيين الوقت الحالي في حقل الوقت كتذكير مبدئي
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    if (newReminderTimeInput) { // التحقق مما إذا كان العنصر موجودًا
        newReminderTimeInput.value = `${currentHours}:${currentMinutes}`;
    }
    if (newReminderSoundSelect) { // التحقق مما إذا كان العنصر موجودًا
        newReminderSoundSelect.value = 'bell'; // تعيين نغمة افتراضية
    }

    renderCurrentReminders(); // عرض التذكيرات الحالية لهذا الذكر
    reminderModal.classList.remove('hidden');
    if (addReminderErrorMessage) { // التحقق مما إذا كان العنصر موجودًا
        addReminderErrorMessage.style.display = 'none';
    }
}

// وظيفة لإخفاء نافذة التذكير (خاصة بـ index.html)
function hideReminderModal() {
    // لا تنفذ إلا إذا كنت في index.html والعنصر موجود
    if (!reminderModal || !isUserView) {
        return;
    }

    reminderModal.classList.add('hidden');
    if (addReminderErrorMessage) { // التحقق مما إذا كان العنصر موجودًا
        addReminderErrorMessage.style.display = 'none';
    }
    currentAdhkarForReminderModal = null; // مسح الذكر الحالي عند إغلاق المودال
}

// وظيفة لجدولة تذكير واحد
function setupReminder(r) {
    // لا تُجدول التذكيرات إلا إذا كنت في واجهة المستخدم
    if (!isUserView) {
        return;
    }

    // مسح أي تذكير سابق بنفس الـ ID لضمان عدم التكرار
    if (r.intervalId) {
        clearInterval(r.intervalId);
    }

    const [targetHour, targetMinute] = r.time.split(':').map(Number);

    const checkAndNotify = () => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentSecond = now.getSeconds();

        // التحقق مما إذا كانت الدقيقة الحالية هي نفسها الدقيقة المستهدفة (والثانية 0 للدقة)
        if (currentHour === targetHour && currentMinute === targetMinute && currentSecond === 0) {
            const adhkarToRemind = adhkar.find(item => item.id === r.adhkarId);
            if (adhkarToRemind) {
                if ('Notification' in window && Notification.permission === 'granted') {
                    const notificationTitle = 'تذكير أذكار!';
                    const notificationOptions = {
                        body: `${adhkarToRemind.text}\n${adhkarToRemind.benefit ? `الفائدة: ${adhkarToRemind.benefit}\n` : ''}${adhkarToRemind.count ? `العدد: ${adhkarToRemind.count}` : ''}`,
                        icon: 'favicon.ico' // استخدام Favicon كأيقونة للإشعار
                    };
                    new Notification(notificationTitle, notificationOptions);
                } else {
                    alert(`تذكير الأذكار:\n\n${adhkarToRemind.text}\n\n${adhkarToRemind.benefit ? `الفائدة: ${adhkarToRemind.benefit}\n` : ''}${adhkarToRemind.count ? `العدد: ${adhkarToRemind.count}` : ''}`);
                }

                // تشغيل الصوت إذا كان محدداً وليس "صامت"
                if (r.sound) {
                    playReminderSound(r.sound);
                }
            } else {
                console.warn(`الذكر المحدد للتذكير (ID: ${r.adhkarId}) غير موجود. إزالة هذا التذكير.`);
                deleteReminder(r.id); // حذف التذكير إذا كان الذكر غير موجود
            }
        }
    };

    // تعيين setInterval للتحقق كل ثانية
    r.intervalId = setInterval(checkAndNotify, 1000);
    console.log(`تم جدولة تذكير ID: ${r.id} للذكر ID: ${r.adhkarId} عند ${r.time} مع صوت ${r.sound}`);
}

// وظيفة لجدولة جميع التذكيرات الموجودة (خاصة بـ index.html)
function setupAllReminders() {
    if (!isUserView) {
        return;
    } // لا تُجدول التذكيرات إلا إذا كنت في واجهة المستخدم
    reminders.forEach(setupReminder);
}

// وظيفة لمسح جميع الـ setIntervals للتذكيرات (مشتركة، تُستدعى من كلتا الواجهتين)
function clearAllReminderIntervals() {
    reminders.forEach(r => {
        if (r.intervalId) {
            clearInterval(r.intervalId);
            r.intervalId = null;
        }
    });
}

// وظيفة لحذف تذكير معين (تُستدعى من كلتا الواجهتين)
async function deleteReminder(id) {
    if (confirm('هل أنت متأكد من حذف هذا التذكير؟')) {
        const reminderIndex = reminders.findIndex(r => r.id === id);
        if (reminderIndex !== -1) {
            const reminderToDelete = reminders[reminderIndex];
            if (reminderToDelete.intervalId) {
                clearInterval(reminderToDelete.intervalId);
            }
            reminders.splice(reminderIndex, 1); // إزالة التذكير من المصفوفة
            await saveDataToGist(); // حفظ التغييرات

            // أعد عرض التذكيرات الحالية فقط إذا كان المودال مفتوحًا في واجهة المستخدم
            if (isUserView && reminderModal && !reminderModal.classList.contains('hidden')) {
                renderCurrentReminders(); // تحديث القائمة في المودال
            }
            alert('تم حذف التذكير بنجاح.');
        }
    }
}

// وظيفة لتشغيل نغمة التذكير (خاصة بـ index.html)
function playReminderSound(soundPath) {
    if (!isUserView || !reminderAudioPlayer) {
        return;
    }

    if (soundPath) {
        reminderAudioPlayer.src = soundPath;
        reminderAudioPlayer.play().catch(error => {
            console.warn("فشل تشغيل الصوت، قد يكون المستخدم لم يتفاعل مع الصفحة بعد:", error);
            // يمكن هنا عرض رسالة للمستخدم يدوياً لطلب التفاعل لتمكين الصوت
        });
    }
}

// ============================================================================
// وظائف LLM (شرح الذكر) - خاصة بـ index.html
// ============================================================================

// وظيفة لعرض نافذة شرح الذكر (خاصة بـ index.html)
function showExplanationModal(adhkarText) {
    if (!explanationModal || !explanationContent || !explanationLoading || !isUserView) {
        return;
    }

    explanationModal.classList.remove('hidden');
    explanationContent.innerHTML = ''; // مسح المحتوى القديم
    explanationLoading.classList.remove('hidden'); // إظهار مؤشر التحميل
    explainAdhkar(adhkarText); // بدء جلب الشرح
}

// وظيفة لإخفاء نافذة شرح الذكر (خاصة بـ index.html)
function hideExplanationModal() {
    if (!explanationModal || !isUserView) {
        return;
    }
    explanationModal.classList.add('hidden');
    explanationContent.innerHTML = '';
    explanationLoading.classList.add('hidden');
}

// وظيفة لجلب شرح الذكر باستخدام Gemini API
async function explainAdhkar(adhkarText) {
    if (!explanationContent || !explanationLoading) {
        return;
    }

    explanationContent.innerHTML = '';
    explanationLoading.classList.remove('hidden');

    const prompt = `اشرح الذكر التالي بالتفصيل، مع ذكر معناه، فضله، وأي دروس مستفادة منه، بأسلوب مبسط ومناسب للمسلمين: "${adhkarText}"`;

    let chatHistory = [];
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });

    const payload = { contents: chatHistory };
    const apiKey = ""; // إذا كنت تريد استخدام نماذج أخرى غير gemini-2.0-flash، قم بتوفير مفتاح API هنا. وإلا، اتركه كما هو.
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const text = result.candidates[0].content.parts[0].text;
            explanationContent.innerHTML = text.replace(/\n/g, '<br>'); // استبدال الأسطر الجديدة بـ <br> للعرض في HTML
        } else {
            explanationContent.textContent = 'عذراً، لم أتمكن من جلب الشرح في الوقت الحالي. الرجاء المحاولة لاحقاً.';
        }
    } catch (error) {
        console.error('Error fetching explanation from Gemini API:', error);
        explanationContent.textContent = 'حدث خطأ أثناء جلب الشرح. الرجاء التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.';
    } finally {
        explanationLoading.classList.add('hidden'); // إخفاء مؤشر التحميل
    }
}


// ============================================================================
// وظائف الخيارات المتقدمة (تصدير البيانات وتغيير بيانات المسؤول) - خاصة بـ admin.html
// ============================================================================

function exportAdhkarData() {
    // لا تنفذ إلا إذا كنت في admin.html
    if (isUserView) {
        return;
    }

    const dataToExport = {
        adhkar: adhkar,
        adhkarTypes: adhkarTypes,
        reminders: reminders.map(({ id, adhkarId, time, sound }) => ({ id, adhkarId, time, sound })) // تصدير التذكيرات بدون intervalId
    };
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'adhkar_data_export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('تم تصدير البيانات بنجاح!');
}


function showChangePasswordModal() {
    // لا تنفذ إلا إذا كنت في admin.html والعنصر موجود
    if (!changePasswordModal || isUserView) {
        return;
    }

    changePasswordModal.classList.remove('hidden');
    currentUsernameInput.value = '';
    currentPasswordInput.value = '';
    newUsernameInput.value = '';
    newPasswordInput.value = '';
    confirmPasswordInput.value = '';
    changePasswordErrorMessage.style.display = 'none';
}

function hideChangePasswordModal() {
    // لا تنفذ إلا إذا كنت في admin.html والعنصر موجود
    if (!changePasswordModal || isUserView) {
        return;
    }

    changePasswordModal.classList.add('hidden');
}


// ============================================================================
// عناصر DOM (جلب العناصر من HTML باستخدام معرفاتها) - يتم جلبها هنا لضمان وجودها عند الحاجة
// ============================================================================
// العناصر المشتركة
const menuToggleBtn = document.getElementById('menu-toggle-btn');
const mainDropdownMenu = document.getElementById('main-dropdown-menu');
const toggleDarkModeBtn = document.getElementById('toggle-dark-mode-btn');

// العناصر الخاصة بـ index.html (واجهة المستخدم)
const filterButtonsContainer = document.getElementById('filter-buttons');
const adhkarDisplayContainer = document.getElementById('adhkar-display');
const searchBar = document.getElementById('search-bar');
const searchInput = document.getElementById('search-input');
const reminderModal = document.getElementById('reminder-modal');
const reminderAdhkarText = document.getElementById('reminder-adhkar-text');
const addReminderForm = document.getElementById('add-reminder-form');
const newReminderTimeInput = document.getElementById('new-reminder-time');
const newReminderSoundSelect = document.getElementById('new-reminder-sound');
const addReminderErrorMessage = document.getElementById('add-reminder-error-message');
const currentRemindersList = document.getElementById('current-reminders-list');
const cancelReminderModalBtn = document.getElementById('cancel-reminder-modal-btn');
const reminderAudioPlayer = document.getElementById('reminder-audio-player');
const adminViewBtn = document.getElementById('admin-view-btn'); // زر الانتقال للمسؤول (في index.html)

// عناصر مودال شرح الذكر (جديدة)
const explanationModal = document.getElementById('explanation-modal');
const explanationLoading = document.getElementById('explanation-loading');
const explanationContent = document.getElementById('explanation-content');
const explanationCloseBtn = document.getElementById('explanation-close-btn');


// العناصر الخاصة بـ admin.html (لوحة التحكم)
const userViewBtn = document.getElementById('user-view-btn'); // زر الانتقال للمستخدم (في admin.html)
const adminPanel = document.getElementById('admin-panel');
const authPanel = document.getElementById('auth-panel');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const loginErrorMessage = document.getElementById('login-error-message');
const adhkarForm = document.getElementById('adhkar-form');
const adhkarIdInput = document.getElementById('adhkar-id');
const adhkarTextInput = document.getElementById('adhkar-text');
const adhkarBenefitInput = document.getElementById('adhkar-benefit');
const adhkarCountInput = document.getElementById('adhkar-count');
const adhkarTypeSelect = document.getElementById('adhkar-type-select');
const saveAdhkarBtn = document.getElementById('save-adhkar-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const newTypeNameInput = document.getElementById('new-type-name');
const newTypeValueInput = document.getElementById('new-type-value');
const addTypeBtn = document.getElementById('add-type-btn');
const typesList = document.getElementById('types-list');
const exportDataBtn = document.getElementById('export-data-btn');
const importFileInput = document.getElementById('import-file-input');
const changeAdminCredentialsBtn = document.getElementById('change-admin-credentials-btn');
const changePasswordModal = document.getElementById('change-password-modal');
const changePasswordForm = document.getElementById('change-password-form');
const currentUsernameInput = document.getElementById('current-username-input');
const currentPasswordInput = document.getElementById('current-password-input');
const newUsernameInput = document.getElementById('new-username-input');
const newPasswordInput = document.getElementById('new-password-input');
const confirmPasswordInput = document.getElementById('confirm-password-input');
const cancelChangePasswordBtn = document.getElementById('cancel-change-password-btn');
const changePasswordErrorMessage = document.getElementById('change-password-error-message');

// عناصر التبويبات الجديدة في لوحة التحكم
const adminTabsContainer = document.getElementById('admin-tabs-container');
const adminTabContentContainer = document.getElementById('admin-tab-content-container');


// ============================================================================
// التهيئة الأولية عند تحميل الصفحة - المنطق مقسم بناءً على الصفحة
// ============================================================================
document.addEventListener('DOMContentLoaded', async () => { // اجعل الوظيفة async هنا

    // قم بتحميل جميع البيانات (الأذكار، الأنواع، التذكيرات) من Gist
    const loadedAllData = await loadDataFromGist();

    if (loadedAllData) {
        adhkar = loadedAllData.adhkar || defaultAdhkar;
        adhkarTypes = loadedAllData.adhkarTypes || defaultAdhkarTypes;
        reminders = loadedAllData.reminders || [];
    } else {
        // إذا فشل التحميل من Gist ولم يكن هناك نسخة احتياطية محلية، استخدم الافتراضيات
        adhkar = defaultAdhkar;
        adhkarTypes = defaultAdhkarTypes;
        reminders = [];
    }

    // إضافة خاصية `currentCount` و `isFavorite` لكل ذكر إذا لم تكن موجودة
    adhkar = adhkar.map(item => {
        if (item.currentCount === undefined) {
            item.currentCount = 0;
        }
        if (item.isFavorite === undefined) {
            item.isFavorite = false;
        }
        return item;
    });

    // تأكد أن خاصية intervalId غير محفوظة ومهيأة للجدولة
    reminders = reminders.map(r => ({ ...r, intervalId: null }));


    applyDarkMode(isDarkMode); // تطبيق الوضع الليلي عالميًا

    // إضافة معالجات الأحداث للعناصر المشتركة
    if (menuToggleBtn) {
        menuToggleBtn.addEventListener('click', () => {
            if (mainDropdownMenu) {
                mainDropdownMenu.classList.toggle('hidden');
            }
        });
    }

    if (toggleDarkModeBtn) {
        toggleDarkModeBtn.addEventListener('click', () => {
            applyDarkMode(!isDarkMode);
        });
    }

    // إضافة معالجات الأحداث لتبديل رؤية كلمة المرور
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', (event) => {
            const targetId = event.target.dataset.target;
            const passwordField = document.getElementById(targetId);
            if (passwordField) {
                if (passwordField.type === 'password') {
                    passwordField.type = 'text';
                    event.target.textContent = '🙈';
                } else {
                    passwordField.type = 'password';
                    event.target.textContent = '👁️';
                }
            }
        });
    });


    if (isUserView) { // المنطق الخاص بـ index.html
        requestNotificationPermission();

        // إخفاء عناصر المسؤول
        if (adminPanel) adminPanel.classList.add('hidden');
        if (authPanel) authPanel.classList.add('hidden');
        if (changePasswordModal) changePasswordModal.classList.add('hidden');

        // التأكد من أن عناصر المستخدم مرئية
        if (filterButtonsContainer) filterButtonsContainer.classList.remove('hidden');
        if (adhkarDisplayContainer) adhkarDisplayContainer.classList.remove('hidden');
        if (searchBar) searchBar.classList.remove('hidden');
        if (reminderModal) reminderModal.classList.add('hidden'); // التأكد من إخفاء مودال التذكير مبدئيًا
        if (explanationModal) explanationModal.classList.add('hidden'); // التأكد من إخفاء مودال الشرح مبدئيًا

        // إخفاء القائمة المنسدلة مبدئيًا
        if (mainDropdownMenu) mainDropdownMenu.classList.add('hidden');

        renderFilterButtons(); // عرض أزرار التصفية والأذكار الأولية
        setupAllReminders(); // جدولة جميع التذكيرات

        // معالج حدث لشريط البحث (خاص بـ index.html)
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                renderAdhkar(currentFilterType, searchInput.value);
            });
        }

        // معالج حدث لإضافة تذكير جديد (خاص بـ index.html)
        if (addReminderForm) {
            addReminderForm.addEventListener('submit', async (e) => { // اجعل الوظيفة async هنا
                e.preventDefault();
                const time = newReminderTimeInput.value;
                const sound = newReminderSoundSelect.value;

                if (!time) {
                    if (addReminderErrorMessage) {
                        addReminderErrorMessage.textContent = 'الرجاء تحديد وقت التذكير.';
                        addReminderErrorMessage.style.display = 'block';
                    }
                    return;
                }

                const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5]?[0-9])$/;
                if (!timeRegex.test(time)) {
                    if (addReminderErrorMessage) {
                        addReminderErrorMessage.textContent = 'صيغة الوقت غير صحيحة. الرجاء استخدام HH:MM.';
                        addReminderErrorMessage.style.display = 'block';
                    }
                    return;
                }

                const isDuplicate = reminders.some(r =>
                    r.adhkarId === currentAdhkarForReminderModal &&
                    r.time === time &&
                    r.sound === reminderSounds[sound]
                );

                if (isDuplicate) {
                    if (addReminderErrorMessage) {
                        addReminderErrorMessage.textContent = 'يوجد تذكير مطابق لهذا الوقت والنغمة.';
                        addReminderErrorMessage.style.display = 'block';
                    }
                    return;
                }

                const newReminderId = Date.now().toString();
                const newReminder = {
                    id: newReminderId,
                    adhkarId: currentAdhkarForReminderModal,
                    time: time,
                    sound: reminderSounds[sound],
                    intervalId: null
                };

                reminders.push(newReminder);
                await saveDataToGist(); // حفظ التغييرات إلى Gist
                setupReminder(newReminder);
                renderCurrentReminders();
                if (newReminderTimeInput) {
                    newReminderTimeInput.value = String(new Date().getHours()).padStart(2, '0') + ':' + String(new Date().getMinutes()).padStart(2, '0');
                }
                if (newReminderSoundSelect) {
                    newReminderSoundSelect.value = 'bell';
                }
                if (addReminderErrorMessage) {
                    addReminderErrorMessage.style.display = 'none';
                }
                alert('تم إضافة تذكير جديد بنجاح!');
            });
        }

        // معالج حدث لإلغاء (إغلاق) نافذة التذكير (خاص بـ index.html)
        if (cancelReminderModalBtn) {
            cancelReminderModalBtn.addEventListener('click', hideReminderModal);
        }

        // معالج حدث لإغلاق نافذة الشرح (خاص بـ index.html)
        if (explanationCloseBtn) {
            explanationCloseBtn.addEventListener('click', hideExplanationModal);
        }

        // زر الانتقال للوحة المسؤول (يجب أن يكون موجودًا فقط في index.html)
        if (adminViewBtn) {
            adminViewBtn.addEventListener('click', () => {
                window.location.href = 'admin.html'; // الانتقال إلى لوحة المسؤول
            });
        }

    } else { // المنطق الخاص بـ admin.html
        // إخفاء عناصر المستخدم ومودال التذكير والشرح
        if (filterButtonsContainer) filterButtonsContainer.classList.add('hidden');
        if (adhkarDisplayContainer) adhkarDisplayContainer.classList.add('hidden');
        if (searchBar) searchBar.classList.add('hidden');
        if (reminderModal) reminderModal.classList.add('hidden');
        if (explanationModal) explanationModal.classList.add('hidden');

        if (mainDropdownMenu) mainDropdownMenu.classList.add('hidden');

        // عرض لوحة المسؤول أو لوحة المصادقة بناءً على حالة تسجيل الدخول
        if (isAdminLoggedIn) {
            if (authPanel) authPanel.classList.add('hidden');
            if (adminPanel) adminPanel.classList.remove('hidden');
            renderTypesList();
            populateAdhkarTypeSelect();
            renderAdminTabs(); // عرض التبويبات والأذكار داخلها
        } else {
            if (authPanel) authPanel.classList.remove('hidden');
            if (adminPanel) adminPanel.classList.add('hidden');
            if (loginErrorMessage) loginErrorMessage.style.display = 'none'; // مسح رسائل الخطأ السابقة
            if (usernameInput) usernameInput.value = '';
            if (passwordInput) passwordInput.value = '';
        }

        // التأكد من إخفاء مودال تغيير كلمة المرور مبدئيًا
        if (changePasswordModal) changePasswordModal.classList.add('hidden');

        // زر الانتقال لواجهة المستخدم (يجب أن يكون موجودًا فقط في admin.html)
        if (userViewBtn) {
            userViewBtn.addEventListener('click', () => {
                // مسح حالة تسجيل دخول المسؤول عند التبديل إلى واجهة المستخدم
                localStorage.removeItem('isAdminLoggedIn');
                window.location.href = 'index.html'; // الانتقال إلى واجهة المستخدم
            });
        }

        // نموذج تسجيل الدخول (خاص بـ admin.html)
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = usernameInput.value;
                const password = passwordInput.value;

                if (username === adminCredentials.username && password === adminCredentials.password) {
                    isAdminLoggedIn = true;
                    saveDataToLocalStorage(isAdminLoggedIn, 'isAdminLoggedIn'); // حفظ حالة تسجيل الدخول
                    if (authPanel) authPanel.classList.add('hidden');
                    if (adminPanel) adminPanel.classList.remove('hidden');
                    if (loginErrorMessage) loginErrorMessage.style.display = 'none';
                    renderTypesList(); // استدعاء دالة العرض الخاصة بالمسؤول
                    populateAdhkarTypeSelect(); // استدعاء دالة العرض الخاصة بالمسؤول
                    renderAdminTabs(); // عرض التبويبات والأذكار داخلها
                    alert('تم تسجيل الدخول بنجاح إلى لوحة التحكم!');
                } else {
                    if (loginErrorMessage) {
                        loginErrorMessage.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة.';
                        loginErrorMessage.style.display = 'block';
                    }
                    isAdminLoggedIn = false;
                    localStorage.removeItem('isAdminLoggedIn'); // التأكد من مسح حالة تسجيل الدخول عند الفشل
                }
            });
        }

        // نموذج إدارة الأذكار (خاص بـ admin.html)
        if (adhkarForm) {
            adhkarForm.addEventListener('submit', async (e) => { // اجعل الوظيفة async هنا
                e.preventDefault();

                const id = adhkarIdInput.value;
                const text = adhkarTextInput.value.trim();
                const benefit = adhkarBenefitInput.value.trim();
                const count = parseInt(adhkarCountInput.value) || null;
                const type = adhkarTypeSelect.value;

                if (!text || !type) {
                    alert('الرجاء إدخال نص الذكر واختيار النوع.');
                    return;
                }

                if (id) {
                    adhkar = adhkar.map(item =>
                        item.id === id ? { ...item, text, benefit, count, type } : item
                    );
                    alert('تم تعديل الذكر بنجاح!');
                } else {
                    const newId = Date.now().toString();
                    adhkar.push({ id: newId, text, benefit, count, type, currentCount: 0, isFavorite: false });
                    alert('تم إضافة الذكر بنجاح!');
                }

                await saveDataToGist(); // حفظ التغييرات إلى Gist
                adhkarForm.reset();
                adhkarIdInput.value = '';
                saveAdhkarBtn.textContent = 'إضافة ذكر';
                cancelEditBtn.classList.add('hidden');
                renderAdminTabs(); // أعد رسم التبويبات والأذكار داخلها بعد الإضافة/التعديل
            });
        }

        // زر إلغاء التعديل (خاص بـ admin.html)
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                adhkarForm.reset();
                adhkarIdInput.value = '';
                saveAdhkarBtn.textContent = 'إضافة ذكر';
                cancelEditBtn.classList.add('hidden');
            });
        }

        // زر إضافة نوع جديد (خاص بـ admin.html)
        if (addTypeBtn) {
            addTypeBtn.addEventListener('click', async () => { // اجعل الوظيفة async هنا
                const name = newTypeNameInput.value.trim();
                const value = newTypeValueInput.value.trim();

                if (!name || !value) {
                    alert('الرجاء إدخال اسم وقيمة للنوع.');
                    return;
                }
                if (adhkarTypes.some(type => type.value === value)) {
                    alert('هذه القيمة (Value) موجودة بالفعل كنوع. الرجاء اختيار قيمة فريدة.');
                    return;
                }

                const newTypeId = Date.now().toString();
                adhkarTypes.push({ id: newTypeId, name, value });
                await saveDataToGist(); // حفظ التغييرات إلى Gist
                newTypeNameInput.value = '';
                newTypeValueInput.value = '';
                renderTypesList();
                populateAdhkarTypeSelect();
                renderAdminTabs(); // إعادة رسم التبويبات بعد إضافة النوع
                alert('تم إضافة النوع بنجاح!');
            });
        }

        // زر تصدير البيانات (خاص بـ admin.html)
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', exportAdhkarData);
        }

        // معالج حدث لملف الاستيراد (خاص بـ admin.html)
        if (importFileInput) {
            importFileInput.addEventListener('change', async (event) => { // اجعل الوظيفة async هنا
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = async (e) => { // اجعل الوظيفة async هنا
                        try {
                            const importedData = JSON.parse(e.target.result);
                            if (importedData.adhkar && importedData.adhkarTypes) {
                                // دمج الأذكار: تحديث الموجود وإضافة الجديد
                                // نحافظ على currentCount و isFavorite من الذكر الأصلي إذا كان موجودًا
                                adhkar = importedData.adhkar.map(importedItem => {
                                    const existingItem = adhkar.find(item => item.id === importedItem.id);
                                    return {
                                        ...importedItem,
                                        currentCount: existingItem ? existingItem.currentCount : (importedItem.currentCount !== undefined ? importedItem.currentCount : 0),
                                        isFavorite: existingItem ? existingItem.isFavorite : (importedItem.isFavorite !== undefined ? importedItem.isFavorite : false)
                                    };
                                }).filter(item => { // فلترة الأذكار المكررة بعد الدمج (إذا كان ID جديد موجودًا)
                                    return !adhkar.some(existingItem => existingItem.id === item.id) || adhkar.find(existingItem => existingItem.id === item.id).text !== item.text;
                                }).concat(adhkar.filter(existingItem => // إضافة الأذكار الموجودة التي لم يتم استيرادها
                                    !importedData.adhkar.some(importedItem => importedItem.id === existingItem.id)
                                ));


                                // دمج الأنواع: إضافة الأنواع الجديدة فقط
                                const newTypes = importedData.adhkarTypes.filter(newType =>
                                    !adhkarTypes.some(existingType => existingType.id === newType.id || existingType.value === newType.value)
                                );
                                adhkarTypes = [...adhkarTypes, ...newTypes];

                                // التأكد من وجود نوع "المفضلة"
                                if (!adhkarTypes.some(type => type.value === 'favorites')) {
                                    adhkarTypes.push({ id: 'type_favorites', name: 'المفضلة', value: 'favorites' });
                                }

                                // دمج التذكيرات: إضافة التذكيرات الجديدة فقط
                                if (importedData.reminders) {
                                    const existingReminderIds = new Set(reminders.map(r => r.id));
                                    const newReminders = importedData.reminders.filter(r => !existingReminderIds.has(r.id));
                                    reminders = [...reminders, ...newReminders];
                                    clearAllReminderIntervals();
                                    setupAllReminders();
                                }

                                await saveDataToGist(); // حفظ التغييرات إلى Gist

                                alert('تم استيراد البيانات بنجاح ودمجها مع البيانات الحالية!');
                                renderAdminTabs(); // إعادة رسم التبويبات بعد الاستيراد
                                renderTypesList();
                                populateAdhkarTypeSelect();
                            } else {
                                alert('الملف المستورد لا يحتوي على هيكل البيانات المتوقع (adhkar و adhkarTypes).');
                            }
                        } catch (error) {
                            alert('حدث خطأ أثناء قراءة أو تحليل ملف JSON. الرجاء التأكد من أنه ملف JSON صالح.');
                            console.error('خطأ في استيراد البيانات:', error);
                        }
                    };
                    reader.readAsText(file);
                }
            });
        }

        // زر تغيير بيانات دخول المسؤول (خاص بـ admin.html)
        if (changeAdminCredentialsBtn) {
            changeAdminCredentialsBtn.addEventListener('click', showChangePasswordModal);
        }
        // زر إلغاء تغيير كلمة المرور (خاص بـ admin.html)
        if (cancelChangePasswordBtn) {
            cancelChangePasswordBtn.addEventListener('click', hideChangePasswordModal);
        }

        // نموذج تغيير كلمة المرور (خاص بـ admin.html)
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const currentUsername = currentUsernameInput.value;
                const currentPassword = currentPasswordInput.value;
                const newUsername = newUsernameInput.value;
                const newPassword = newPasswordInput.value;
                const confirmPassword = confirmPasswordInput.value;

                if (currentUsername === adminCredentials.username && currentPassword === adminCredentials.password) {
                    if (!newUsername.trim() || !newPassword.trim()) {
                        if (changePasswordErrorMessage) {
                            changePasswordErrorMessage.textContent = 'اسم المستخدم الجديد وكلمة المرور الجديدة لا يمكن أن تكون فارغة.';
                            changePasswordErrorMessage.style.display = 'block';
                        }
                        return;
                    }

                    if (newPassword !== confirmPassword) {
                        if (changePasswordErrorMessage) {
                            changePasswordErrorMessage.textContent = 'كلمة المرور الجديدة وتأكيد كلمة المرور غير متطابقتين.';
                            changePasswordErrorMessage.style.display = 'block';
                        }
                        return;
                    }

                    adminCredentials.username = newUsername;
                    adminCredentials.password = newPassword;
                    saveAdminCredentialsToLocalStorage();
                    alert('تم تغيير بيانات دخول المسؤول بنجاح!');
                    hideChangePasswordModal();
                    isAdminLoggedIn = false;
                    localStorage.removeItem('isAdminLoggedIn');
                    window.location.href = 'admin.html';
                } else {
                    if (changePasswordErrorMessage) {
                        changePasswordErrorMessage.textContent = 'اسم المستخدم الحالي أو كلمة المرور الحالية غير صحيحة.';
                        changePasswordErrorMessage.style.display = 'block';
                    }
                }
            });
        }
    }
});

// تسجيل عامل الخدمة (Service Worker) لـ PWA - مشترك
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered successfully:', registration);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    });
}
