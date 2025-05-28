// ============================================================================
// البيانات الأولية والتحميل من التخزين المحلي (localStorage)
// ============================================================================

// وظيفة لحفظ البيانات إلى localStorage
function saveDataToLocalStorage(data, key) {
    localStorage.setItem(key, JSON.stringify(data));
}

// وظيفة لتحميل البيانات من localStorage
function loadDataFromLocalStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

// البيانات الافتراضية التي تُستخدم إذا لم تكن هناك بيانات محفوظة في localStorage
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

// تحميل البيانات عند بدء التشغيل. إذا لم تكن موجودة، استخدم البيانات الافتراضية
let adhkar = loadDataFromLocalStorage('adhkar') || defaultAdhkar;
let adhkarTypes = loadDataFromLocalStorage('adhkarTypes') || defaultAdhkarTypes;

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


// بيانات اعتماد المسؤول (يتم تحميلها من localStorage أو استخدام الافتراضية)
let adminCredentials = loadDataFromLocalStorage('adminCredentials') || {
    username: "admin",
    password: "password123"
};

// تخزين التذكيرات ككائنات منفصلة، كل كائن يحتوي على معرف فريد، معرف الذكر، الوقت، ونغمة الصوت
// وخاصية لتخزين معرف الـ setInterval لكل تذكير (لا تحفظ في localStorage)
let reminders = loadDataFromLocalStorage('reminders') || [];

// وظيفة لحفظ بيانات اعتماد المسؤول إلى localStorage
function saveAdminCredentialsToLocalStorage() {
    saveDataToLocalStorage(adminCredentials, 'adminCredentials');
}

// وظيفة لحفظ التذكيرات إلى localStorage
function saveRemindersToLocalStorage() {
    // عند الحفظ، لا تحفظ خاصية intervalId لأنها ديناميكية
    const serializableReminders = reminders.map(({ id, adhkarId, time, sound }) => ({ id, adhkarId, time, sound }));
    saveDataToLocalStorage(serializableReminders, 'reminders');
}

// المتغيرات التي تتحكم في حالة التطبيق
let currentFilterType = adhkarTypes.length > 0 ? adhkarTypes[0].value : null;
let currentEditedAdhkarId = null;
let isAdminLoggedIn = false;
let isUserView = true;
let currentAdhkarForReminderModal = null; // لتخزين الذكر الحالي الذي تُفتح لأجله نافذة التذكير

// حالة الوضع الليلي
let isDarkMode = loadDataFromLocalStorage('darkMode') || false;


// ============================================================================
// عناصر DOM (جلب العناصر من HTML باستخدام معرفاتها)
// ============================================================================
const filterButtonsContainer = document.getElementById('filter-buttons');
const adhkarDisplayContainer = document.getElementById('adhkar-display');

// عناصر البحث
const searchBar = document.getElementById('search-bar');
const searchInput = document.getElementById('search-input');


// عناصر القائمة المنبثقة
const menuToggleBtn = document.getElementById('menu-toggle-btn');
const mainDropdownMenu = document.getElementById('main-dropdown-menu');
const userViewBtn = document.getElementById('user-view-btn');
const adminViewBtn = document.getElementById('admin-view-btn');
const toggleDarkModeBtn = document.getElementById('toggle-dark-mode-btn');

const adminPanel = document.getElementById('admin-panel');

// عناصر لوحة المصادقة
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

// عناصر تغيير بيانات دخول المسؤول
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

// عناصر التذكير (المودال الجديد)
const reminderModal = document.getElementById('reminder-modal');
const reminderAdhkarText = document.getElementById('reminder-adhkar-text');
const addReminderForm = document.getElementById('add-reminder-form');
const newReminderTimeInput = document.getElementById('new-reminder-time');
const newReminderSoundSelect = document.getElementById('new-reminder-sound');
const addReminderErrorMessage = document.getElementById('add-reminder-error-message');
const currentRemindersList = document.getElementById('current-reminders-list');
const cancelReminderModalBtn = document.getElementById('cancel-reminder-modal-btn');
const reminderAudioPlayer = document.getElementById('reminder-audio-player');

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

// وظيفة لعرض الأذكار بناءً على النوع المحدد
function renderAdhkar(type, searchTerm = '') {
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

        let actionsHtml = '';
        if (isAdminLoggedIn && !isUserView) {
            actionsHtml = `
                <div class="actions">
                    <button onclick="editAdhkar('${item.id}')">تعديل</button>
                    <button class="delete-btn" onclick="deleteAdhkar('${item.id}')">حذف</button>
                </div>
            `;
        }

        let userInteractionsHtml = '';
        if (isUserView) {
            const favoriteClass = item.isFavorite ? 'active' : '';
            userInteractionsHtml = `
                <div class="adhkar-counter-wrapper">
                    <button onclick="increaseAdhkarCount('${item.id}')">ذكر</button>
                    <span class="adhkar-count-val" id="count-${item.id}">${item.currentCount}</span>
                    <button class="reset-counter-btn" onclick="resetAdhkarCount('${item.id}')">تصفير</button>
                </div>
                <div class="adhkar-interactions">
                    <button class="favorite-btn ${favoriteClass}" onclick="toggleFavorite('${item.id}')">
                        ${item.isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                    </button>
                    <button class="reminder-btn" onclick="showReminderModal('${item.id}')">إدارة التذكيرات</button>
                    <button class="share-btn" onclick="shareAdhkar('${item.id}')">مشاركة</button>
                </div>
            `;
        }

        adhkarCard.innerHTML = `
            <div>
                <p class="adhkar-text">${item.text}</p>
                ${item.benefit ? `<p class="adhkar-benefit">الفائدة: ${item.benefit}</p>` : ''}
            </div>
            ${item.count ? `<div class="adhkar-count-display">العدد الموصى به: ${item.count}</div>` : ''}
            ${userInteractionsHtml}
            ${actionsHtml}
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

// وظيفة لعرض أزرار فلاتر أنواع الأذكار في وضع المستخدم
function renderFilterButtons() {
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

// وظيفة لملء قائمة خيارات أنواع الأذكار في نموذج الإضافة/التعديل بلوحة التحكم
function populateAdhkarTypeSelect() {
    adhkarTypeSelect.innerHTML = '';
    const selectableTypes = adhkarTypes.filter(type => type.value !== 'favorites');
    selectableTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.value;
        option.textContent = type.name;
        adhkarTypeSelect.appendChild(option);
    });
}

// وظيفة لعرض قائمة أنواع الأذكار في لوحة التحكم (مع أزرار الحذف)
function renderTypesList() {
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

// وظيفة لعرض قائمة التذكيرات الحالية في نافذة المودال
function renderCurrentReminders() {
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

// ============================================================================
// وظائف إدارة البيانات (CRUD Operations)
// ============================================================================

adhkarForm.addEventListener('submit', (e) => {
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

    saveDataToLocalStorage(adhkar, 'adhkar');
    adhkarForm.reset();
    adhkarIdInput.value = '';
    saveAdhkarBtn.textContent = 'إضافة ذكر';
    cancelEditBtn.classList.add('hidden');
    renderAdhkar(currentFilterType, searchInput.value);
});

function editAdhkar(id) {
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

cancelEditBtn.addEventListener('click', () => {
    adhkarForm.reset();
    adhkarIdInput.value = '';
    saveAdhkarBtn.textContent = 'إضافة ذكر';
    cancelEditBtn.classList.add('hidden');
});

function deleteAdhkar(id) {
    if (confirm('هل أنت متأكد من حذف هذا الذكر؟ سيتم حذف جميع التذكيرات المرتبطة به أيضاً.')) {
        adhkar = adhkar.filter(item => item.id !== id);
        // حذف التذكيرات المرتبطة بهذا الذكر
        reminders = reminders.filter(r => r.adhkarId !== id);
        // مسح الـ setIntervals للتذكيرات المحذوفة
        clearAllReminderIntervals(); // سيعيد جدولتها للتذكيرات المتبقية
        setupAllReminders(); // إعادة جدولة التذكيرات المتبقية

        saveDataToLocalStorage(adhkar, 'adhkar');
        saveRemindersToLocalStorage();
        renderAdhkar(currentFilterType, searchInput.value);
        alert('تم حذف الذكر بنجاح!');
    }
}

addTypeBtn.addEventListener('click', () => {
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
    saveDataToLocalStorage(adhkarTypes, 'adhkarTypes');
    newTypeNameInput.value = '';
    newTypeValueInput.value = '';
    renderTypesList();
    populateAdhkarTypeSelect();
    renderFilterButtons();
    alert('تم إضافة النوع بنجاح!');
});

function deleteType(id) {
    if (confirm('هل أنت متأكد من حذف هذا النوع؟ سيتم حذف جميع الأذكار والتذكيرات المرتبطة به!')) {
        const typeToDelete = adhkarTypes.find(type => type.id === id);
        if (typeToDelete) {
            // حذف الأذكار المرتبطة بهذا النوع أولاً
            const adhkarToDeleteIds = adhkar.filter(item => item.type === typeToDelete.value).map(item => item.id);
            adhkar = adhkar.filter(item => item.type !== typeToDelete.value);
            saveDataToLocalStorage(adhkar, 'adhkar');

            // حذف التذكيرات المرتبطة بالأذكار المحذوفة
            reminders = reminders.filter(r => !adhkarToDeleteIds.includes(r.adhkarId));
            clearAllReminderIntervals();
            setupAllReminders();
            saveRemindersToLocalStorage();

            // حذف النوع نفسه من مصفوفة الأنواع
            adhkarTypes = adhkarTypes.filter(type => type.id !== id);
            saveDataToLocalStorage(adhkarTypes, 'adhkarTypes');

            renderTypesList();
            populateAdhkarTypeSelect();

            if (currentFilterType === typeToDelete.value) {
                currentFilterType = adhkarTypes.length > 0 ? adhkarTypes[0].value : null;
            }
            renderFilterButtons();
            renderAdhkar(currentFilterType, searchInput.value);
            alert('تم حذف النوع والأذكار والتذكيرات المرتبطة به بنجاح!');
        }
    }
}

// ============================================================================
// وظائف العداد والمفضلة والمشاركة
// ============================================================================

function increaseAdhkarCount(id) {
    const item = adhkar.find(item => item.id === id);
    if (item) {
        item.currentCount++;
        saveDataToLocalStorage(adhkar, 'adhkar');
        document.getElementById(`count-${id}`).textContent = item.currentCount;
    }
}

function resetAdhkarCount(id) {
    const item = adhkar.find(item => item.id === id);
    if (item) {
        item.currentCount = 0;
        saveDataToLocalStorage(adhkar, 'adhkar');
        document.getElementById(`count-${id}`).textContent = item.currentCount;
    }
}

function toggleFavorite(id) {
    const item = adhkar.find(item => item.id === id);
    if (item) {
        item.isFavorite = !item.isFavorite;
        saveDataToLocalStorage(adhkar, 'adhkar');
        renderAdhkar(currentFilterType, searchInput.value);
    }
}

function shareAdhkar(id) {
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
// وظائف البحث
// ============================================================================

searchInput.addEventListener('input', () => {
    renderAdhkar(currentFilterType, searchInput.value);
});


// ============================================================================
// وظائف التحكم في القائمة المنبثقة وعروض التطبيق
// ============================================================================

function toggleDropdownMenu() {
    mainDropdownMenu.classList.toggle('hidden');
}

menuToggleBtn.addEventListener('click', toggleDropdownMenu);

userViewBtn.addEventListener('click', () => {
    adminPanel.classList.add('hidden');
    authPanel.classList.add('hidden');
    
    filterButtonsContainer.classList.remove('hidden');
    adhkarDisplayContainer.classList.remove('hidden');
    searchBar.classList.remove('hidden');

    mainDropdownMenu.classList.add('hidden');

    isUserView = true;
    renderAdhkar(currentFilterType, searchInput.value);
});

adminViewBtn.addEventListener('click', () => {
    filterButtonsContainer.classList.add('hidden');
    adhkarDisplayContainer.classList.add('hidden');
    searchBar.classList.add('hidden');

    mainDropdownMenu.classList.add('hidden');

    isUserView = false;

    if (isAdminLoggedIn) {
        authPanel.classList.add('hidden');
        adminPanel.classList.remove('hidden');
        renderTypesList();
        populateAdhkarTypeSelect();
        renderAdhkar(currentFilterType, searchInput.value);
    } else {
        authPanel.classList.remove('hidden');
        adminPanel.classList.add('hidden');
        loginErrorMessage.style.display = 'none';
        usernameInput.value = '';
        passwordInput.value = '';
    }
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = usernameInput.value;
    const password = passwordInput.value;

    if (username === adminCredentials.username && password === adminCredentials.password) {
        isAdminLoggedIn = true;
        authPanel.classList.add('hidden');
        adminPanel.classList.remove('hidden');
        loginErrorMessage.style.display = 'none';
        renderTypesList();
        populateAdhkarTypeSelect();
        renderAdhkar(currentFilterType, searchInput.value);
        alert('تم تسجيل الدخول بنجاح إلى لوحة التحكم!');
    } else {
        loginErrorMessage.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة.';
        loginErrorMessage.style.display = 'block';
        isAdminLoggedIn = false;
    }
});

// ============================================================================
// وظائف الخيارات المتقدمة (تصدير البيانات وتغيير بيانات المسؤول)
// ============================================================================

function exportAdhkarData() {
    const dataToExport = {
        adhkar: adhkar,
        adhkarTypes: adhkarTypes,
        reminders: reminders.map(({ id, adhkarId, time, sound }) => ({ id, adhkarId, time, sound })) // export serializable part
    };
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'adhkar_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('تم تصدير البيانات بنجاح كملف JSON!');
}

importFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (importedData.adhkar && importedData.adhkarTypes) {
                    adhkar = importedData.adhkar.map(importedItem => {
                        const existingItem = adhkar.find(item => item.id === importedItem.id);
                        return {
                            ...importedItem,
                            currentCount: existingItem ? existingItem.currentCount : (importedItem.currentCount !== undefined ? importedItem.currentCount : 0),
                            isFavorite: existingItem ? existingItem.isFavorite : (importedItem.isFavorite !== undefined ? importedItem.isFavorite : false)
                        };
                    });

                    const newTypes = importedData.adhkarTypes.filter(newType => 
                        !adhkarTypes.some(existingType => existingType.id === newType.id || existingType.value === newType.value)
                    );
                    adhkarTypes = [...adhkarTypes, ...newTypes];
                    if (!adhkarTypes.some(type => type.value === 'favorites')) {
                        adhkarTypes.push({ id: 'type_favorites', name: 'المفضلة', value: 'favorites' });
                    }

                    if (importedData.reminders) {
                        // دمج التذكيرات الجديدة مع الحفاظ على التذكيرات الموجودة حاليا
                        const existingReminderIds = new Set(reminders.map(r => r.id));
                        const newReminders = importedData.reminders.filter(r => !existingReminderIds.has(r.id));
                        reminders = [...reminders, ...newReminders];
                        clearAllReminderIntervals();
                        setupAllReminders();
                    }

                    saveDataToLocalStorage(adhkar, 'adhkar');
                    saveDataToLocalStorage(adhkarTypes, 'adhkarTypes');
                    saveRemindersToLocalStorage();

                    alert('تم استيراد البيانات بنجاح ودمجها مع البيانات الحالية!');
                    renderFilterButtons();
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


function showChangePasswordModal() {
    changePasswordModal.classList.remove('hidden');
    currentUsernameInput.value = '';
    currentPasswordInput.value = '';
    newUsernameInput.value = '';
    newPasswordInput.value = '';
    confirmPasswordInput.value = '';
    changePasswordErrorMessage.style.display = 'none';
}

function hideChangePasswordModal() {
    changePasswordModal.classList.add('hidden');
}

changeAdminCredentialsBtn.addEventListener('click', showChangePasswordModal);
cancelChangePasswordBtn.addEventListener('click', hideChangePasswordModal);

changePasswordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const currentUsername = currentUsernameInput.value;
    const currentPassword = currentPasswordInput.value;
    const newUsername = newUsernameInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (currentUsername === adminCredentials.username && currentPassword === adminCredentials.password) {
        if (!newUsername.trim() || !newPassword.trim()) {
            changePasswordErrorMessage.textContent = 'اسم المستخدم الجديد وكلمة المرور الجديدة لا يمكن أن تكون فارغة.';
            changePasswordErrorMessage.style.display = 'block';
            return;
        }

        if (newPassword !== confirmPassword) {
            changePasswordErrorMessage.textContent = 'كلمة المرور الجديدة وتأكيد كلمة المرور غير متطابقتين.';
            changePasswordErrorMessage.style.display = 'block';
            return;
        }

        adminCredentials.username = newUsername;
        adminCredentials.password = newPassword;
        saveAdminCredentialsToLocalStorage();
        alert('تم تغيير بيانات دخول المسؤول بنجاح!');
        hideChangePasswordModal();
        isAdminLoggedIn = false;
        adminViewBtn.click();
    } else {
        changePasswordErrorMessage.textContent = 'اسم المستخدم الحالي أو كلمة المرور الحالية غير صحيحة.';
        changePasswordErrorMessage.style.display = 'block';
    }
});

// ============================================================================
// وظائف معاينة كلمة السر
// ============================================================================

function togglePasswordVisibility(event) {
    const targetId = event.target.dataset.target;
    const passwordField = document.getElementById(targetId);
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        event.target.textContent = '🙈';
    } else {
        passwordField.type = 'password';
        event.target.textContent = '👁️';
    }
}

document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', togglePasswordVisibility);
});

exportDataBtn.addEventListener('click', exportAdhkarData);

// ============================================================================
// وظائف الوضع الليلي (Dark Mode)
// ============================================================================

function applyDarkMode(enable) {
    if (enable) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    isDarkMode = enable;
    saveDataToLocalStorage(isDarkMode, 'darkMode');
}

toggleDarkModeBtn.addEventListener('click', () => {
    applyDarkMode(!isDarkMode);
});

// ============================================================================
// وظائف التذكير (Web Notifications API & Multiple Reminders)
// ============================================================================

// طلب إذن الإشعارات عند بدء التشغيل
function requestNotificationPermission() {
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

// وظيفة لعرض نافذة التذكير المنبثقة
function showReminderModal(adhkarId) {
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
    newReminderTimeInput.value = `${currentHours}:${currentMinutes}`;
    newReminderSoundSelect.value = 'bell'; // تعيين نغمة افتراضية

    renderCurrentReminders(); // عرض التذكيرات الحالية لهذا الذكر
    reminderModal.classList.remove('hidden');
    addReminderErrorMessage.style.display = 'none';
}

// وظيفة لإخفاء نافذة التذكير
function hideReminderModal() {
    reminderModal.classList.add('hidden');
    addReminderErrorMessage.style.display = 'none';
    currentAdhkarForReminderModal = null; // مسح الذكر الحالي عند إغلاق المودال
}

// معالج حدث لإضافة تذكير جديد
addReminderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const time = newReminderTimeInput.value;
    const sound = newReminderSoundSelect.value;

    if (!time) {
        addReminderErrorMessage.textContent = 'الرجاء تحديد وقت التذكير.';
        addReminderErrorMessage.style.display = 'block';
        return;
    }

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5]?[0-9])$/;
    if (!timeRegex.test(time)) {
        addReminderErrorMessage.textContent = 'صيغة الوقت غير صحيحة. الرجاء استخدام HH:MM.';
        addReminderErrorMessage.style.display = 'block';
        return;
    }

    // التحقق من عدم وجود تذكير بنفس الوقت والنغمة لنفس الذكر
    const isDuplicate = reminders.some(r =>
        r.adhkarId === currentAdhkarForReminderModal &&
        r.time === time &&
        r.sound === reminderSounds[sound]
    );

    if (isDuplicate) {
        addReminderErrorMessage.textContent = 'يوجد تذكير مطابق لهذا الوقت والنغمة.';
        addReminderErrorMessage.style.display = 'block';
        return;
    }

    const newReminderId = Date.now().toString(); // معرف فريد للتذكير
    const newReminder = {
        id: newReminderId,
        adhkarId: currentAdhkarForReminderModal,
        time: time,
        sound: reminderSounds[sound], // تخزين مسار الصوت أو null للصامت
        intervalId: null // سيتم تعيينه عند الجدولة
    };

    reminders.push(newReminder);
    saveRemindersToLocalStorage();
    setupReminder(newReminder); // جدولة التذكير الجديد
    renderCurrentReminders(); // تحديث قائمة التذكيرات في المودال
    newReminderTimeInput.value = String(new Date().getHours()).padStart(2, '0') + ':' + String(new Date().getMinutes()).padStart(2, '0'); // إعادة تعيين حقل الوقت
    newReminderSoundSelect.value = 'bell'; // إعادة تعيين حقل النغمة
    addReminderErrorMessage.style.display = 'none';
    alert('تم إضافة تذكير جديد بنجاح!');
});

// معالج حدث لإلغاء (إغلاق) نافذة التذكير
cancelReminderModalBtn.addEventListener('click', hideReminderModal);

// وظيفة لجدولة تذكير واحد
function setupReminder(r) {
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

// وظيفة لجدولة جميع التذكيرات الموجودة
function setupAllReminders() {
    reminders.forEach(setupReminder);
}

// وظيفة لمسح جميع الـ setIntervals للتذكيرات
function clearAllReminderIntervals() {
    reminders.forEach(r => {
        if (r.intervalId) {
            clearInterval(r.intervalId);
            r.intervalId = null;
        }
    });
}

// وظيفة لحذف تذكير معين
function deleteReminder(id) {
    if (confirm('هل أنت متأكد من حذف هذا التذكير؟')) {
        const reminderIndex = reminders.findIndex(r => r.id === id);
        if (reminderIndex !== -1) {
            const reminderToDelete = reminders[reminderIndex];
            if (reminderToDelete.intervalId) {
                clearInterval(reminderToDelete.intervalId);
            }
            reminders.splice(reminderIndex, 1); // إزالة التذكير من المصفوفة
            saveRemindersToLocalStorage(); // حفظ التغييرات
            renderCurrentReminders(); // تحديث القائمة في المودال
            alert('تم حذف التذكير بنجاح.');
        }
    }
}

// وظيفة لتشغيل نغمة التذكير
function playReminderSound(soundPath) {
    if (soundPath) {
        reminderAudioPlayer.src = soundPath;
        reminderAudioPlayer.play().catch(error => {
            console.warn("فشل تشغيل الصوت، قد يكون المستخدم لم يتفاعل مع الصفحة بعد:", error);
            // يمكن هنا عرض رسالة للمستخدم يدوياً لطلب التفاعل لتمكين الصوت
        });
    }
}


// ============================================================================
// التهيئة الأولية عند تحميل الصفحة
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    requestNotificationPermission();

    // تطبيق الوضع الليلي بناءً على الحالة المحفوظة
    applyDarkMode(isDarkMode);
    // تحديث نص زر الوضع الليلي
    toggleDarkModeBtn.textContent = isDarkMode ? 'تبديل الوضع النهاري' : 'تبديل الوضع الليلي';


    adminPanel.classList.add('hidden');
    authPanel.classList.add('hidden');
    changePasswordModal.classList.add('hidden');
    reminderModal.classList.add('hidden');
    searchBar.classList.add('hidden');

    filterButtonsContainer.classList.remove('hidden');
    adhkarDisplayContainer.classList.remove('hidden');
    searchBar.classList.remove('hidden');

    mainDropdownMenu.classList.add('hidden');

    isUserView = true;
    renderFilterButtons();

    // جدولة جميع التذكيرات عند تحميل الصفحة
    setupAllReminders();
});

// تسجيل عامل الخدمة (Service Worker) للـ PWA
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