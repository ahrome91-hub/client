// ============================================================
// import.js — Логика импорта CSV файлов
// ============================================================

// ============================================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ============================================================

let importedData = [];
let importHeaders = [];
let fieldMapping = {};

// ============================================================
// ИНИЦИАЛИЗАЦИЯ СТРАНИЦЫ ИМПОРТА
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📂 Страница импорта загружена');
    
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('csvFile');
    const importBtn = document.getElementById('importBtn');
    const confirmBtn = document.getElementById('confirmImport');
    
    // Клик по drop-зоне
    if (dropZone) {
        dropZone.addEventListener('click', () => fileInput?.click());
        
        // Drag & Drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                handleFileSelect(fileInput.files[0]);
            }
        });
    }
    
    // Выбор файла
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (this.files.length) {
                handleFileSelect(this.files[0]);
            }
        });
    }
    
    // Кнопка "Импортировать" (старый вариант)
    if (importBtn) {
        importBtn.addEventListener('click', function() {
            const file = fileInput?.files[0];
            if (!file) {
                showToast('Выберите CSV файл', 'warning');
                return;
            }
            handleFileSelect(file);
        });
    }
    
    // Кнопка "Подтвердить импорт"
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            confirmImport();
        });
    }
    
    // Инициализация темы
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        if (savedTheme === 'dark') {
            themeToggle.querySelector('i').className = 'fas fa-sun';
        }
        themeToggle.addEventListener('click', function() {
            const html = document.documentElement;
            const current = html.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            this.querySelector('i').className = next === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        });
    }
});

// ============================================================
// ОБРАБОТКА ВЫБРАННОГО ФАЙЛА
// ============================================================

function handleFileSelect(file) {
    // Проверка расширения
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'csv') {
        showToast('Пожалуйста, выберите CSV файл', 'error');
        return;
    }
    
    // Показываем информацию о файле
    const fileInfo = document.getElementById('fileInfo');
    if (fileInfo) {
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = (file.size / 1024).toFixed(1) + ' KB';
        fileInfo.style.display = 'flex';
    }
    
    // Читаем файл
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            processCSVContent(event.target.result);
        } catch (e) {
            console.error('Ошибка обработки CSV:', e);
            showToast('Ошибка обработки файла: ' + e.message, 'error');
        }
    };
    reader.onerror = function() {
        showToast('Ошибка чтения файла', 'error');
    };
    reader.readAsText(file, 'UTF-8');
}

// ============================================================
// ПРОЦЕССИНГ CSV КОНТЕНТА
// ============================================================

function processCSVContent(text) {
    // Разбиваем на строки
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) {
        showToast('Файл пуст или содержит только заголовки', 'warning');
        return;
    }
    
    // Парсим заголовки
    importHeaders = parseCSVLine(lines[0]);
    console.log('📋 Заголовки CSV:', importHeaders);
    
    // Парсим данные
    const rawData = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length >= 1 && values.some(v => v.trim())) {
            const row = {};
            importHeaders.forEach((h, idx) => {
                row[h.trim()] = (values[idx] || '').trim();
            });
            rawData.push(row);
        }
    }
    
    if (rawData.length === 0) {
        showToast('Не найдено данных для импорта', 'warning');
        return;
    }
    
    console.log(`📊 Найдено ${rawData.length} записей`);
    
    // Автоматическое определение полей
    fieldMapping = autoDetectFields(importHeaders);
    console.log('🧩 Определение полей:', fieldMapping);
    
    // Преобразуем данные в формат CRM
    importedData = rawData.map(row => mapRowToCRM(row, fieldMapping));
    
    // Показываем предпросмотр
    showPreview(importedData, importHeaders, fieldMapping);
    
    // Обновляем прогресс
    updateProgress(50);
    
    showToast(`Найдено ${importedData.length} записей для импорта`, 'success');
}

// ============================================================
// АВТОМАТИЧЕСКОЕ ОПРЕДЕЛЕНИЕ ПОЛЕЙ
// ============================================================

function autoDetectFields(headers) {
    const mapping = {};
    const fieldMap = {
        'name': ['name', 'название', 'компания', 'фирма', 'организация', 'наименование', 'бизнес'],
        'category': ['category', 'категория', 'тип', 'вид', 'направление', 'сфера'],
        'phone': ['phone', 'телефон', 'номер', 'контакт', 'мобильный', 'tel'],
        'website': ['website', 'сайт', 'web', 'url', 'ссылка', 'страница'],
        'rating': ['rating', 'рейтинг', 'оценка', 'балл', 'звёзды'],
        'status': ['status', 'статус', 'этап', 'состояние', 'положение'],
        'priority': ['priority', 'приоритет', 'важность', 'срочность'],
        'notes': ['notes', 'заметки', 'комментарий', 'примечание', 'описание'],
        'address': ['address', 'адрес', 'локация', 'место', 'расположение'],
        'reviews_count': ['reviews_count', 'отзывы', 'отзывов', 'количество отзывов'],
        'price_level': ['price_level', 'цены', 'уровень цен', 'прайс'],
        'micro': ['micro', 'микро', 'микробизнес', 'малый бизнес'],
        'favorite': ['favorite', 'избранное', 'звезда', 'важное']
    };
    
    // Для каждого заголовка ищем соответствие
    headers.forEach(header => {
        const lower = header.toLowerCase().trim();
        let found = false;
        
        for (const [field, synonyms] of Object.entries(fieldMap)) {
            if (synonyms.some(s => lower.includes(s))) {
                mapping[field] = header;
                found = true;
                break;
            }
        }
        
        // Если не нашли — пропускаем
        if (!found) {
            mapping['_skip'] = (mapping['_skip'] || []).concat(header);
        }
    });
    
    // Проверяем обязательные поля
    const required = ['name'];
    required.forEach(field => {
        if (!mapping[field]) {
            console.warn(`⚠️ Обязательное поле "${field}" не найдено в CSV`);
        }
    });
    
    return mapping;
}

// ============================================================
// МАППИНГ СТРОКИ CSV В ФОРМАТ CRM
// ============================================================

function mapRowToCRM(row, mapping) {
    const result = {
        id: generateId(),
        name: '',
        category: '—',
        phone: '—',
        website: '',
        rating: 0,
        status: 'new',
        priority: 'medium',
        notes: '',
        address: '',
        reviews_count: 0,
        price_level: '',
        micro: false,
        favorite: false,
        history: []
    };
    
    // Заполняем поля из маппинга
    for (const [field, header] of Object.entries(mapping)) {
        if (field === '_skip') continue;
        const value = row[header] || '';
        
        switch (field) {
            case 'name':
                result.name = value || 'Без названия';
                break;
            case 'category':
                result.category = value || '—';
                break;
            case 'phone':
                result.phone = value || '—';
                break;
            case 'website':
                result.website = value || '';
                break;
            case 'rating':
                result.rating = parseFloat(value.replace(',', '.')) || 0;
                break;
            case 'status':
                result.status = normalizeStatus(value);
                break;
            case 'priority':
                const p = value.toLowerCase();
                if (p.includes('высок') || p === 'high') result.priority = 'high';
                else if (p.includes('низк') || p === 'low') result.priority = 'low';
                else result.priority = 'medium';
                break;
            case 'notes':
                result.notes = value || '';
                break;
            case 'address':
                result.address = value || '';
                break;
            case 'reviews_count':
                result.reviews_count = parseInt(value) || 0;
                break;
            case 'price_level':
                result.price_level = value || '';
                break;
            case 'micro':
                result.micro = toBoolean(value);
                break;
            case 'favorite':
                result.favorite = toBoolean(value);
                break;
        }
    }
    
    // Добавляем запись в историю
    result.history.push({
        date: new Date().toLocaleString(),
        type: 'import',
        note: 'Импортировано из CSV'
    });
    
    return result;
}

// ============================================================
// ПРЕДПРОСМОТР ДАННЫХ
// ============================================================

function showPreview(data, headers, mapping) {
    const container = document.getElementById('previewContainer');
    if (!container) return;
    
    // Определяем колонки для отображения
    const displayFields = ['name', 'category', 'phone', 'rating', 'status', 'priority'];
    const displayHeaders = {
        name: 'Название',
        category: 'Категория',
        phone: 'Телефон',
        rating: 'Рейтинг',
        status: 'Статус',
        priority: 'Приоритет'
    };
    
    let html = `
        <div style="margin-top:16px; padding:16px; background:var(--bg-toolbar); border-radius:var(--radius-md); border:1px solid var(--border-light);">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
                <h4 style="font-size:16px; font-weight:600;">
                    <i class="fas fa-eye" style="color:var(--btn-primary);"></i> 
                    Предпросмотр (${data.length} записей)
                </h4>
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    <button class="btn btn-success btn-sm" id="confirmImport">
                        <i class="fas fa-check"></i> Подтвердить импорт
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="clearPreview()">
                        <i class="fas fa-times"></i> Отмена
                    </button>
                </div>
            </div>
            <div style="overflow-x:auto; max-height:400px; overflow-y:auto;">
                <table style="min-width:500px; font-size:13px;">
                    <thead>
                        <tr>
                            <th>#</th>
                            ${displayFields.map(f => `<th>${displayHeaders[f] || f}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.slice(0, 10).map((row, idx) => `
                            <tr>
                                <td>${idx + 1}</td>
                                ${displayFields.map(f => `
                                    <td>
                                        ${f === 'status' ? `<span class="status ${getStatusClass(row[f])}">${getStatusLabel(row[f])}</span>` :
                                          f === 'rating' ? (row[f] || '—') :
                                          f === 'priority' ? (row[f] === 'high' ? '🔴 Высокий' : row[f] === 'medium' ? '🟡 Средний' : '🟢 Низкий') :
                                          (row[f] || '—')}
                                    </td>
                                `).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${data.length > 10 ? `<p style="margin-top:8px; color:var(--text-secondary); font-size:13px;">... и ещё ${data.length - 10} записей</p>` : ''}
            </div>
            <div style="margin-top:12px; padding:12px; background:var(--bg-app); border-radius:var(--radius-sm); border:1px solid var(--border-light); font-size:13px; color:var(--text-secondary);">
                <i class="fas fa-info-circle" style="color:var(--btn-primary);"></i>
                <strong>Определённые поля:</strong>
                ${Object.entries(mapping).filter(([k]) => k !== '_skip').map(([k, v]) => 
                    `<span style="margin:0 4px; background:var(--bg-toolbar); padding:2px 8px; border-radius:4px;">${v} → ${k}</span>`
                ).join(' ')}
                ${mapping._skip ? `<span style="margin-left:8px; color:var(--text-muted);">(пропущено: ${mapping._skip.join(', ')})</span>` : ''}
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Привязываем событие для кнопки подтверждения
    const confirmBtn = document.getElementById('confirmImport');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmImport);
    }
}

function clearPreview() {
    const container = document.getElementById('previewContainer');
    if (container) container.innerHTML = '';
    updateProgress(0);
}

// ============================================================
// ПОДТВЕРЖДЕНИЕ ИМПОРТА
// ============================================================

async function confirmImport() {
    if (!importedData || importedData.length === 0) {
        showToast('Нет данных для импорта', 'warning');
        return;
    }
    
    const confirmBtn = document.getElementById('confirmImport');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Импорт...';
    }
    
    updateProgress(30);
    
    try {
        // Загружаем существующие данные
        const existingData = await loadFromBin();
        updateProgress(60);
        
        // Добавляем новые записи
        let imported = 0;
        importedData.forEach(row => {
            // Проверяем на дубликаты по названию и телефону
            const isDuplicate = existingData.some(ex =>
                ex.name === row.name &&
                ex.phone === row.phone &&
                ex.phone !== '—'
            );
            
            if (!isDuplicate) {
                existingData.push(row);
                imported++;
            }
        });
        
        updateProgress(80);
        
        // Сохраняем в JSONBin
        const saved = await saveToBin(existingData);
        
        if (saved) {
            updateProgress(100);
            showToast(`✅ Успешно импортировано ${imported} записей!`, 'success');
            
            // Очищаем данные
            importedData = [];
            
            // Показываем кнопку перехода к клиентам
            const container = document.getElementById('previewContainer');
            if (container) {
                container.innerHTML = `
                    <div style="margin-top:16px; padding:20px; background:var(--status-deal-bg); border-radius:var(--radius-md); text-align:center;">
                        <i class="fas fa-check-circle" style="font-size:32px; color:var(--status-deal-color);"></i>
                        <h3 style="margin:8px 0; color:var(--status-deal-color);">Импорт завершён!</h3>
                        <p style="color:var(--text-secondary); margin-bottom:12px;">Импортировано ${imported} записей</p>
                        <a href="clients.html" class="btn btn-primary">
                            <i class="fas fa-users"></i> Перейти к клиентам
                        </a>
                    </div>
                `;
            }
            
            // Сбрасываем файл
            const fileInput = document.getElementById('csvFile');
            if (fileInput) fileInput.value = '';
            const fileInfo = document.getElementById('fileInfo');
            if (fileInfo) fileInfo.style.display = 'none';
            
        } else {
            showToast('Ошибка сохранения данных', 'error');
        }
        
    } catch (e) {
        console.error('Ошибка импорта:', e);
        showToast('Ошибка импорта: ' + e.message, 'error');
    } finally {
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-check"></i> Подтвердить импорт';
        }
    }
}

// ============================================================
// ОБНОВЛЕНИЕ ПРОГРЕССА
// ============================================================

function updateProgress(percent) {
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.width = Math.min(percent, 100) + '%';
        if (percent >= 100) {
            setTimeout(() => {
                progressBar.style.width = '0%';
            }, 3000);
        }
    }
}

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Парсинг строки CSV с учётом кавычек
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
 * Генерация уникального ID
 */
function generateId() {
    return Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
}

/**
 * Нормализация статуса
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
 * Получение названия статуса
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
 * Получение CSS-класса статуса
 */
function getStatusClass(st) {
    return `status-${st}`;
}

/**
 * Преобразование в булево
 */
function toBoolean(val) {
    if (typeof val === 'boolean') return val;
    const str = String(val).toLowerCase().trim();
    return str === 'true' || str === '1' || str === 'да' || str === 'yes';
}

/**
 * Показ уведомления
 */
function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) {
        const div = document.createElement('div');
        div.className = 'toast';
        div.id = 'toast';
        div.innerHTML = `<i class="fas fa-check-circle"></i> <span>${msg}</span>`;
        document.body.appendChild(div);
        setTimeout(() => div.style.display = 'flex', 50);
        setTimeout(() => { div.style.display = 'none'; }, 3000);
        return;
    }
    
    const icon = toast.querySelector('i');
    const span = toast.querySelector('span');
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    icon.className = `fas ${icons[type] || icons.success}`;
    span.textContent = msg;
    toast.style.display = 'flex';
    
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// ============================================================
// ЗАГРУЗКА И СОХРАНЕНИЕ (из api.js)
// ============================================================

// Эти функции будут использоваться из api.js
// Если api.js не загружен, используем fallback

async function loadFromBin() {
    if (typeof window.loadFromBin === 'function') {
        return await window.loadFromBin();
    }
    console.warn('⚠️ loadFromBin не найден, используем пустой массив');
    return [];
}

async function saveToBin(data) {
    if (typeof window.saveToBin === 'function') {
        return await window.saveToBin(data);
    }
    console.warn('⚠️ saveToBin не найден, данные не сохранены');
    // Сохраняем в localStorage как fallback
    try {
        localStorage.setItem('crm_data', JSON.stringify(data));
        return true;
    } catch {
        return false;
    }
}

console.log('📦 import.js загружен — готов к импорту CSV');