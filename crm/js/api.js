// ============================================================
// API.js — Работа с JSONBin и управление данными
// ============================================================

// Конфигурация JSONBin (ваши данные)
const BIN_ID = '6a34730dda38895dfeda3121';
const MASTER_KEY = '$2a$10$euK6kkgJrxsrsI06lUXdu.Zyp1byoA3eVeev6S/Kiol96uQejCvKa';
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// ============================================================
// ОСНОВНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Загрузка всех данных из JSONBin
 * @returns {Promise<Array>} Массив записей
 */
async function loadFromBin() {
    try {
        const resp = await fetch(BASE_URL, {
            headers: { 'X-Master-Key': MASTER_KEY }
        });
        
        if (!resp.ok) {
            throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        }
        
        const json = await resp.json();
        const data = json.record?.data || [];
        
        // Нормализуем данные: добавляем поля, которых может не быть
        return data.map(item => ({
            id: item.id || generateId(),
            name: item.name || item['Название'] || 'Без названия',
            category: item.category || item['Категория'] || '—',
            phone: item.phone || item['Телефон'] || '—',
            website: item.website || item['Сайт'] || '',
            rating: parseFloat(item.rating || item['Рейтинг'] || 0),
            status: normalizeStatus(item.status || item['Статус'] || 'new'),
            priority: item.priority || item['Приоритет'] || 'medium',
            notes: item.notes || item['Заметки'] || '',
            favorite: item.favorite === true || item.favorite === 'true' || item['Избранное'] === 'true',
            micro: item.micro === true || item.micro === 'true' || item['Микро'] === 'true',
            address: item.address || item['Адрес'] || '',
            reviews_count: parseInt(item.reviews_count || item['Отзывы'] || 0),
            price_level: item.price_level || item['Цены'] || '',
            latitude: parseFloat(item.latitude) || 0,
            longitude: parseFloat(item.longitude) || 0,
            history: Array.isArray(item.history) ? item.history : []
        }));
        
    } catch (e) {
        console.error('❌ Ошибка загрузки из JSONBin:', e);
        showToast('Ошибка загрузки данных. Используем локальные данные.');
        return getDefaultData();
    }
}

/**
 * Сохранение данных в JSONBin
 * @param {Array} data - Массив записей для сохранения
 * @returns {Promise<boolean>} Успешно ли сохранено
 */
async function saveToBin(data) {
    try {
        const resp = await fetch(BASE_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': MASTER_KEY
            },
            body: JSON.stringify({ data })
        });
        
        if (!resp.ok) {
            throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        }
        
        console.log(`✅ Сохранено ${data.length} записей в JSONBin`);
        return true;
        
    } catch (e) {
        console.error('❌ Ошибка сохранения в JSONBin:', e);
        showToast('Ошибка сохранения данных. Проверьте соединение.');
        return false;
    }
}

/**
 * Генерация уникального ID
 * @returns {string} Уникальный ID
 */
function generateId() {
    return Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
}

/**
 * Нормализация статуса (приведение к допустимым значениям)
 * @param {string} status - Исходный статус
 * @returns {string} Нормализованный статус
 */
function normalizeStatus(status) {
    const map = {
        'новое': 'new',
        'new': 'new',
        'в работе': 'contacted',
        'contacted': 'contacted',
        'встреча': 'meeting',
        'meeting': 'meeting',
        'сделка': 'deal',
        'deal': 'deal',
        'потеряно': 'lost',
        'lost': 'lost'
    };
    return map[status?.toLowerCase()] || 'new';
}

/**
 * Получение текстового названия статуса
 * @param {string} st - Код статуса
 * @returns {string} Название статуса на русском
 */
function getStatusLabel(st) {
    const map = {
        new: 'Новое',
        contacted: 'В работе',
        meeting: 'Встреча',
        deal: 'Сделка',
        lost: 'Потеряно'
    };
    return map[st] || st;
}

/**
 * Получение CSS-класса для статуса
 * @param {string} st - Код статуса
 * @returns {string} CSS-класс
 */
function getStatusClass(st) {
    return `status-${st}`;
}

/**
 * Получение иконки для категории
 * @param {string} cat - Название категории
 * @returns {string} HTML-иконка
 */
function getCategoryIcon(cat) {
    const icons = {
        'кафе': 'fas fa-coffee',
        'ресторан': 'fas fa-utensils',
        'кофейня': 'fas fa-mug-hot',
        'пекарня': 'fas fa-bread-slice',
        'кондитерская': 'fas fa-cake',
        'столовая': 'fas fa-utensil-spoon',
        'бургерная': 'fas fa-hamburger',
        'пиццерия': 'fas fa-pizza-slice',
        'суши': 'fas fa-fish',
        'фастфуд': 'fas fa-bolt',
        'чайная': 'fas fa-mug-saucer',
        'бар': 'fas fa-wine-glass-alt',
        'парикмахерская': 'fas fa-cut',
        'салон красоты': 'fas fa-spa',
        'косметология': 'fas fa-smile',
        'маникюр': 'fas fa-hand-sparkles',
        'фитнес клуб': 'fas fa-dumbbell',
        'йога студия': 'fas fa-pray',
        'танцевальная студия': 'fas fa-music',
        'массажный салон': 'fas fa-hand-holding-heart',
        'баня': 'fas fa-hot-tub',
        'сауна': 'fas fa-hot-tub',
        'ветеринарная клиника': 'fas fa-paw',
        'зоомагазин': 'fas fa-paw',
        'аптека': 'fas fa-prescription-bottle',
        'оптика': 'fas fa-eye',
        'стоматология': 'fas fa-tooth',
        'медицинский центр': 'fas fa-hospital',
        'автосервис': 'fas fa-car',
        'автомойка': 'fas fa-car-side',
        'шинокомплект': 'fas fa-circle',
        'ремонт техники': 'fas fa-toolbox',
        'ремонт обуви': 'fas fa-shoe-prints',
        'химчистка': 'fas fa-soap',
        'прачечная': 'fas fa-shirt',
        'ключи': 'fas fa-key',
        'ювелирная мастерская': 'fas fa-gem',
        'фотостудия': 'fas fa-camera',
        'типография': 'fas fa-print',
        'школа': 'fas fa-school',
        'детский сад': 'fas fa-child',
        'гостиница': 'fas fa-hotel',
        'хостел': 'fas fa-bed',
        'туристическое агентство': 'fas fa-plane',
        'юридическая консультация': 'fas fa-gavel',
        'бухгалтерские услуги': 'fas fa-calculator'
    };
    const key = cat?.toLowerCase() || '';
    for (const [pattern, icon] of Object.entries(icons)) {
        if (key.includes(pattern)) return icon;
    }
    return 'fas fa-tag';
}

/**
 * Получение приоритета клиента
 * @param {string} p - Код приоритета
 * @returns {string} Название приоритета
 */
function getPriorityLabel(p) {
    const map = { high: 'Высокий', medium: 'Средний', low: 'Низкий' };
    return map[p] || p;
}

/**
 * Форматирование даты
 * @param {string} dateStr - Строка даты
 * @returns {string} Отформатированная дата
 */
function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return dateStr;
    }
}

/**
 * Получение всех уникальных категорий из данных
 * @param {Array} data - Массив записей
 * @returns {Array} Массив уникальных категорий
 */
function getAllCategories(data) {
    const cats = new Set();
    data.forEach(r => {
        if (r.category && r.category !== '—' && r.category !== 'Без категории') {
            cats.add(r.category.toLowerCase());
        }
    });
    return Array.from(cats).sort();
}

/**
 * Подсчёт количества записей в категории
 * @param {Array} data - Массив записей
 * @param {string} cat - Название категории
 * @returns {number} Количество записей
 */
function getCategoryCount(data, cat) {
    return data.filter(r => r.category?.toLowerCase() === cat.toLowerCase()).length;
}

/**
 * Получение данных по умолчанию (если JSONBin пуст)
 * @returns {Array} Начальные данные
 */
function getDefaultData() {
    return [
        { id: generateId(), name: 'Где поесть в Москве', category: 'кафе', phone: '+7 906 774-90-64', website: 'https://www.loft-moskva.ru/', rating: 4.6, status: 'new', priority: 'high', notes: 'Перспективный клиент, хороший рейтинг', favorite: false, micro: true, address: 'Берсеневская наб., 6', history: [] },
        { id: generateId(), name: 'Everest Continental', category: 'ресторан', phone: '+7 985 355-13-13', website: 'https://everestfamily.ru/', rating: 4.9, status: 'contacted', priority: 'high', notes: 'Крупный ресторан, нужен личный визит', favorite: true, micro: false, address: '2-я Звенигородская ул., 13', history: [] },
        { id: generateId(), name: 'Кофейня DAILY GREEN', category: 'кофейня', phone: '+7 495 773-94-77', website: 'http://www.dailygreen.cafe/', rating: 4.7, status: 'new', priority: 'medium', notes: 'Сеть кофеен, можно предложить сотрудничество', favorite: false, micro: false, address: 'Руновский пер., 5', history: [] },
        { id: generateId(), name: 'PARK47', category: 'кофейня', phone: '+7 925 750-08-86', website: 'http://instagram.com/park47coffee', rating: 5.0, status: 'deal', priority: 'high', notes: 'Сделка закрыта! Отличный клиент', favorite: true, micro: false, address: 'ул. Архитектора Власова, 47', history: [] },
        { id: generateId(), name: 'Столовая Mr.Chef', category: 'столовая', phone: '+7 966 047-06-06', website: 'https://chefmr.wixsite.com/mrchef', rating: 4.8, status: 'deal', priority: 'medium', notes: 'Постоянный клиент, заказ каждый месяц', favorite: false, micro: true, address: '4-й Лихачевский пер., 6', history: [] },
        { id: generateId(), name: 'Smash Point', category: 'бургерная', phone: '+7 963 713-64-11', website: 'https://smashpoint.ru/', rating: 4.5, status: 'new', priority: 'low', notes: 'Небольшая бургерная, попробовать позже', favorite: false, micro: false, address: 'Большая Бронная ул., 25', history: [] },
        { id: generateId(), name: 'SEABASUSHI', category: 'суши', phone: '+7 499 653-73-02', website: 'https://seabassushi.ru/ru', rating: 4.9, status: 'meeting', priority: 'high', notes: 'Назначена встреча на следующей неделе', favorite: false, micro: false, address: 'ул. Сельскохозяйственная, 35', history: [] },
        { id: generateId(), name: 'Души не чаю', category: 'чайная', phone: '+7 495 991-56-03', website: 'http://dushinechaju.ru/', rating: 4.8, status: 'new', priority: 'medium', notes: 'Интересный формат, можно предложить дегустацию', favorite: false, micro: false, address: 'ул. Климашкина, 21', history: [] },
        { id: generateId(), name: 'MEOW Bar', category: 'бар', phone: '+7 926 984-28-08', website: '', rating: 4.8, status: 'contacted', priority: 'medium', notes: 'Перезвонить через неделю', favorite: false, micro: false, address: 'ул. Кузнецкий Мост, 19', history: [] },
        { id: generateId(), name: 'The Hat Bar Moscow', category: 'бар', phone: '+7 985 257-50-40', website: 'http://www.hatgroup.ru/', rating: 4.9, status: 'new', priority: 'high', notes: 'Сеть баров, перспективный клиент', favorite: true, micro: false, address: 'Тверская ул., 20с1', history: [] }
    ];
}

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ИМПОРТА
// ============================================================

/**
 * Парсинг строки CSV с учётом кавычек
 * @param {string} line - Строка из CSV
 * @returns {Array} Массив значений
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

/**
 * Определение типа колонки по заголовку
 * @param {string} header - Заголовок колонки
 * @returns {string} Тип поля
 */
function detectFieldType(header) {
    const h = header.toLowerCase().trim();
    if (h === 'name' || h === 'название' || h === 'компания') return 'name';
    if (h === 'category' || h === 'категория' || h === 'тип') return 'category';
    if (h === 'phone' || h === 'телефон' || h === 'номер') return 'phone';
    if (h === 'website' || h === 'сайт' || h === 'web') return 'website';
    if (h === 'rating' || h === 'рейтинг' || h === 'оценка') return 'rating';
    if (h === 'status' || h === 'статус' || h === 'этап') return 'status';
    if (h === 'priority' || h === 'приоритет' || h === 'важность') return 'priority';
    if (h === 'notes' || h === 'заметки' || h === 'комментарий') return 'notes';
    if (h === 'favorite' || h === 'избранное' || h === 'звезда') return 'favorite';
    if (h === 'micro' || h === 'микро' || h === 'микробизнес') return 'micro';
    if (h === 'address' || h === 'адрес' || h === 'локация') return 'address';
    if (h === 'reviews_count' || h === 'отзывы' || h === 'количество отзывов') return 'reviews_count';
    if (h === 'price_level' || h === 'цены' || h === 'уровень цен') return 'price_level';
    if (h === 'latitude' || h === 'широта') return 'latitude';
    if (h === 'longitude' || h === 'долгота') return 'longitude';
    return null;
}

/**
 * Преобразование строки в булево значение
 * @param {string} val - Строковое значение
 * @returns {boolean} Булево значение
 */
function toBoolean(val) {
    if (typeof val === 'boolean') return val;
    const str = String(val).toLowerCase().trim();
    return str === 'true' || str === '1' || str === 'да' || str === 'yes';
}

/**
 * Преобразование строки в число
 * @param {string} val - Строковое значение
 * @returns {number} Число или 0
 */
function toNumber(val) {
    const num = parseFloat(String(val).replace(',', '.').trim());
    return isNaN(num) ? 0 : num;
}

// ============================================================
// ТОСТ-УВЕДОМЛЕНИЯ
// ============================================================

let toastTimer = null;

/**
 * Показ уведомления
 * @param {string} msg - Текст сообщения
 * @param {string} type - Тип: 'success', 'error', 'warning', 'info'
 */
function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) {
        // Создаём тост, если его нет на странице
        const div = document.createElement('div');
        div.className = 'toast';
        div.id = 'toast';
        div.innerHTML = `<i class="fas fa-check-circle"></i> <span>${msg}</span>`;
        document.body.appendChild(div);
        setTimeout(() => div.style.display = 'flex', 50);
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { div.style.display = 'none'; }, 3000);
        return;
    }
    
    const icon = toast.querySelector('i');
    const span = toast.querySelector('span');
    
    // Меняем иконку в зависимости от типа
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    icon.className = `fas ${icons[type] || icons.success}`;
    span.textContent = msg;
    toast.style.display = 'flex';
    
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// ============================================================
// ЭКСПОРТ ФУНКЦИЙ (для использования в других файлах)
// ============================================================

// Если используется ES6 модули
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadFromBin,
        saveToBin,
        generateId,
        normalizeStatus,
        getStatusLabel,
        getStatusClass,
        getCategoryIcon,
        getPriorityLabel,
        formatDate,
        getAllCategories,
        getCategoryCount,
        getDefaultData,
        parseCSVLine,
        detectFieldType,
        toBoolean,
        toNumber,
        showToast
    };
}

// Если используется в браузере (глобальные переменные)
if (typeof window !== 'undefined') {
    window.loadFromBin = loadFromBin;
    window.saveToBin = saveToBin;
    window.generateId = generateId;
    window.normalizeStatus = normalizeStatus;
    window.getStatusLabel = getStatusLabel;
    window.getStatusClass = getStatusClass;
    window.getCategoryIcon = getCategoryIcon;
    window.getPriorityLabel = getPriorityLabel;
    window.formatDate = formatDate;
    window.getAllCategories = getAllCategories;
    window.getCategoryCount = getCategoryCount;
    window.getDefaultData = getDefaultData;
    window.parseCSVLine = parseCSVLine;
    window.detectFieldType = detectFieldType;
    window.toBoolean = toBoolean;
    window.toNumber = toNumber;
    window.showToast = showToast;
}

console.log('📦 API.js загружен — готов к работе с JSONBin');
console.log(`📁 BIN ID: ${BIN_ID}`);
console.log(`🔗 URL: ${BASE_URL}`);