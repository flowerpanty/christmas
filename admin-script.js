// Admin Dashboard Script
const ADMIN_PASSWORD = 'nothingmatters2024';
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzKr77_KPQdoepPLqXynNbn6-3uGBodISlh2PMMzYqLwXlXaDuRcwsMgZWWLxxYi-g/exec'; // 사용자가 배포 후 입력

let allOrders = [];
let filteredOrders = [];

// Login Functionality
document.addEventListener('DOMContentLoaded', () => {
    checkLogin();
    setupLoginForm();
    setupDashboard();
});

function checkLogin() {
    const isLoggedIn = localStorage.getItem('admin_logged_in');
    if (isLoggedIn === 'true') {
        showDashboard();
        loadOrders();
    }
}

function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const password = document.getElementById('password-input').value;
        const errorEl = document.getElementById('login-error');

        if (password === ADMIN_PASSWORD) {
            localStorage.setItem('admin_logged_in', 'true');
            showDashboard();
            loadOrders();
        } else {
            errorEl.textContent = '비밀번호가 올바르지 않습니다.';
            setTimeout(() => {
                errorEl.textContent = '';
            }, 3000);
        }
    });
}

function showDashboard() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
}

function setupDashboard() {
    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('admin_logged_in');
        location.reload();
    });

    // Refresh
    document.getElementById('refresh-btn').addEventListener('click', () => {
        loadOrders();
    });

    // Export CSV
    document.getElementById('export-btn').addEventListener('click', () => {
        exportToCSV();
    });

    // Filters
    document.getElementById('date-filter').addEventListener('change', applyFilters);
    document.getElementById('status-filter').addEventListener('change', applyFilters);
    document.getElementById('search-input').addEventListener('input', applyFilters);

    // View Toggle
    document.getElementById('list-view-btn').addEventListener('click', () => {
        document.getElementById('list-view-btn').classList.add('active');
        document.getElementById('calendar-view-btn').classList.remove('active');
        document.querySelector('.table-container').classList.remove('hidden');
        document.getElementById('calendar-view').classList.add('hidden');
    });

    document.getElementById('calendar-view-btn').addEventListener('click', () => {
        document.getElementById('calendar-view-btn').classList.add('active');
        document.getElementById('list-view-btn').classList.remove('active');
        document.querySelector('.table-container').classList.add('hidden');
        document.getElementById('calendar-view').classList.remove('hidden');
        displayCalendarView(filteredOrders);
    });

    // Modal close
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('order-modal').addEventListener('click', (e) => {
        if (e.target.id === 'order-modal') {
            closeModal();
        }
    });
}

// Load Orders from Google Sheets
async function loadOrders() {
    const loadingEl = document.getElementById('loading-message');
    const noOrdersEl = document.getElementById('no-orders-message');
    const tbody = document.getElementById('orders-tbody');

    loadingEl.classList.remove('hidden');
    noOrdersEl.classList.add('hidden');
    tbody.innerHTML = '';

    try {
        const response = await fetch(GOOGLE_SCRIPT_URL);
        const data = await response.json();

        if (data.result === 'success' && data.orders) {
            allOrders = data.orders.reverse(); // 최신순
            filteredOrders = [...allOrders];
            displayOrders(filteredOrders);
            updateStatistics(allOrders);
        } else {
            throw new Error('데이터를 불러오는데 실패했습니다.');
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        alert('주문 데이터를 불러오는데 실패했습니다. Google Apps Script URL을 확인해주세요.');
    } finally {
        loadingEl.classList.add('hidden');
    }
}

// Display Orders in Table
function displayOrders(orders) {
    const tbody = document.getElementById('orders-tbody');
    const noOrdersEl = document.getElementById('no-orders-message');

    tbody.innerHTML = '';

    if (orders.length === 0) {
        noOrdersEl.classList.remove('hidden');
        return;
    }

    noOrdersEl.classList.add('hidden');

    orders.forEach((order, index) => {
        const row = document.createElement('tr');

        const timestamp = new Date(order.timestamp);
        const formattedDate = `${timestamp.getMonth() + 1}/${timestamp.getDate()} ${timestamp.getHours()}:${String(timestamp.getMinutes()).padStart(2, '0')}`;

        // 상품 요약
        const products = [];
        if (order.brookieBearQty > 0) products.push(`곰돌이 ${order.brookieBearQty}`);
        if (order.brookieTreeQty > 0) products.push(`트리 ${order.brookieTreeQty}`);
        if (order.brookie2Qty > 0) products.push(`세트 ${order.brookie2Qty}`);
        if (order.santaPackageQty > 0) products.push(`산타꾸러미 ${order.santaPackageQty}`);
        const productSummary = products.join(', ') || '-';

        row.innerHTML = `
            <td data-label="주문시간">${formattedDate}</td>
            <td data-label="주문자"><strong>${order.name}</strong></td>
            <td data-label="연락처">${order.phone}</td>
            <td data-label="상품">${productSummary}</td>
            <td data-label="금액"><strong>${order.totalPrice}원</strong></td>
            <td data-label="픽업일시">${order.pickupDate} ${order.pickupTime}</td>
            <td data-label="입금자">${order.depositor}</td>
            <td data-label="상태"><span class="status-badge status-${order.status}">${order.status}</span></td>
            <td data-label="상세"><button class="btn-view-detail" data-index="${index}">상세보기</button></td>
        `;

        tbody.appendChild(row);
    });

    // Add event listeners to detail buttons
    document.querySelectorAll('.btn-view-detail').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.target.dataset.index;
            showOrderDetail(filteredOrders[index], index);
        });
    });
}

// Update Statistics
function updateStatistics(orders) {
    const totalOrders = orders.length;
    const totalSales = orders.reduce((sum, order) => {
        const amount = parseInt(order.totalPrice.toString().replace(/,/g, ''));
        return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    const pendingOrders = orders.filter(o => o.status === '입금대기').length;
    const completedOrders = orders.filter(o => o.status === '픽업완료').length;

    document.getElementById('total-orders').textContent = totalOrders;
    document.getElementById('total-sales').textContent = totalSales.toLocaleString() + '원';
    document.getElementById('pending-orders').textContent = pendingOrders;
    document.getElementById('completed-orders').textContent = completedOrders;
}

// Apply Filters
function applyFilters() {
    const dateFilter = document.getElementById('date-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    const searchQuery = document.getElementById('search-input').value.toLowerCase();

    filteredOrders = allOrders.filter(order => {
        // Date filter
        let dateMatch = true;
        if (dateFilter !== 'all') {
            const orderDate = new Date(order.timestamp);
            const today = new Date();

            if (dateFilter === 'today') {
                dateMatch = orderDate.toDateString() === today.toDateString();
            } else if (dateFilter === 'week') {
                const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                dateMatch = orderDate >= weekAgo;
            } else if (dateFilter === 'month') {
                dateMatch = orderDate.getMonth() === today.getMonth() &&
                    orderDate.getFullYear() === today.getFullYear();
            }
        }

        // Status filter
        const statusMatch = statusFilter === 'all' || order.status === statusFilter;

        // Search filter
        const searchMatch = searchQuery === '' ||
            order.name.toLowerCase().includes(searchQuery) ||
            order.phone.includes(searchQuery);

        return dateMatch && statusMatch && searchMatch;
    });

    displayOrders(filteredOrders);
}

// Show Order Detail Modal
function showOrderDetail(order, index) {
    const modal = document.getElementById('order-modal');
    const content = document.getElementById('order-detail-content');

    const timestamp = new Date(order.timestamp);
    const formattedDateTime = timestamp.toLocaleString('ko-KR');

    content.innerHTML = `
        <div class="detail-row">
            <div class="detail-label">📅 주문 시간</div>
            <div class="detail-value">${formattedDateTime}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">👤 주문자 정보</div>
            <div class="detail-value">
                <strong>${order.name}</strong><br>
                ${order.email}<br>
                ${order.phone}
            </div>
        </div>
        <div class="detail-row">
            <div class="detail-label">🍪 주문 상품</div>
            <div class="detail-value">
                ${order.brookieBearQty > 0 ? `브루키 (곰돌이): ${order.brookieBearQty}개<br>` : ''}
                ${order.brookieTreeQty > 0 ? `브루키 (트리): ${order.brookieTreeQty}개<br>` : ''}
                ${order.brookie2Qty > 0 ? `브루키 세트: ${order.brookie2Qty}개<br>` : ''}
                ${order.santaPackageQty > 0 ? `산타꾸러미: ${order.santaPackageQty}개<br>` : ''}
            </div>
        </div>
        <div class="detail-row">
            <div class="detail-label">💰 금액</div>
            <div class="detail-value"><strong>${order.totalPrice}원</strong></div>
        </div>
        <div class="detail-row">
            <div class="detail-label">📦 픽업 정보</div>
            <div class="detail-value">
                ${order.pickupMethod}<br>
                ${order.pickupDate} ${order.pickupTime}
            </div>
        </div>
        <div class="detail-row">
            <div class="detail-label">💳 입금 정보</div>
            <div class="detail-value">
                입금자: ${order.depositor}<br>
                입금액: ${order.amount}원
            </div>
        </div>
        ${order.memo ? `
        <div class="detail-row">
            <div class="detail-label">📝 메모</div>
            <div class="detail-value">${order.memo}</div>
        </div>
        ` : ''}
        <div class="detail-row">
            <div class="detail-label">🏷️ 주문 상태</div>
            <select class="status-selector" id="status-select-${index}">
                <option value="입금대기" ${order.status === '입금대기' ? 'selected' : ''}>입금대기</option>
                <option value="입금완료" ${order.status === '입금완료' ? 'selected' : ''}>입금완료</option>
                <option value="제작중" ${order.status === '제작중' ? 'selected' : ''}>제작중</option>
                <option value="픽업완료" ${order.status === '픽업완료' ? 'selected' : ''}>픽업완료</option>
            </select>
        </div>
        <button class="btn-update-status" onclick="updateOrderStatus(${index})">상태 업데이트</button>
    `;

    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('order-modal').classList.add('hidden');
}

// Update Order Status (Note: This requires backend support to actually update the sheet)
window.updateOrderStatus = function (index) {
    const newStatus = document.getElementById(`status-select-${index}`).value;

    // Update in memory
    filteredOrders[index].status = newStatus;
    const originalIndex = allOrders.findIndex(o => o.timestamp === filteredOrders[index].timestamp);
    if (originalIndex !== -1) {
        allOrders[originalIndex].status = newStatus;
    }

    // Note: In a real implementation, you would send this update to the backend
    // For now, this is just a client-side update
    alert(`상태가 "${newStatus}"로 변경되었습니다.\n\n참고: 실제 Google Sheets 업데이트는 수동으로 해야 합니다.`);

    closeModal();
    displayOrders(filteredOrders);
    updateStatistics(allOrders);
}

// Export to CSV
function exportToCSV() {
    if (filteredOrders.length === 0) {
        alert('내보낼 주문이 없습니다.');
        return;
    }

    const headers = ['주문시간', '이름', '이메일', '전화번호', '곰돌이', '트리', '세트', '산타꾸러미',
        '총금액', '픽업방법', '픽업날짜', '픽업시간', '입금자', '입금액', '메모', '상태'];

    const rows = filteredOrders.map(order => {
        const timestamp = new Date(order.timestamp).toLocaleString('ko-KR');
        return [
            timestamp,
            order.name,
            order.email,
            order.phone,
            order.brookieBearQty,
            order.brookieTreeQty,
            order.brookie2Qty,
            order.santaPackageQty,
            order.totalPrice,
            order.pickupMethod,
            order.pickupDate,
            order.pickupTime,
            order.depositor,
            order.amount,
            order.memo || '',
            order.status
        ];
    });

    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `주문내역_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Display Calendar View
function displayCalendarView(orders) {
    const calendarContainer = document.getElementById('calendar-container');

    if (orders.length === 0) {
        calendarContainer.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">주문 내역이 없습니다.</p>';
        return;
    }

    // Group orders by pickup date
    const ordersByDate = {};
    orders.forEach((order, index) => {
        const pickupDate = order.pickupDate;
        if (!ordersByDate[pickupDate]) {
            ordersByDate[pickupDate] = [];
        }
        ordersByDate[pickupDate].push({ ...order, originalIndex: index });
    });

    // Sort dates
    const sortedDates = Object.keys(ordersByDate).sort((a, b) => {
        // Simple date comparison (assuming format "12월 20일")
        const dateA = a.match(/(\d+)월 (\d+)일/);
        const dateB = b.match(/(\d+)월 (\d+)일/);
        if (dateA && dateB) {
            const monthA = parseInt(dateA[1]);
            const dayA = parseInt(dateA[2]);
            const monthB = parseInt(dateB[1]);
            const dayB = parseInt(dateB[2]);
            if (monthA !== monthB) return monthB - monthA;
            return dayB - dayA;
        }
        return 0;
    });

    // Render calendar
    let html = '';
    sortedDates.forEach(date => {
        const dayOrders = ordersByDate[date];
        html += `
            <div class="calendar-day">
                <div class="calendar-day-header">📅 ${date}</div>
                <div class="calendar-orders">
        `;

        dayOrders.forEach(order => {
            const products = [];
            if (order.brookieBearQty > 0) products.push(`곰돌이 ${order.brookieBearQty}`);
            if (order.brookieTreeQty > 0) products.push(`트리 ${order.brookieTreeQty}`);
            if (order.brookie2Qty > 0) products.push(`세트 ${order.brookie2Qty}`);
            if (order.santaPackageQty > 0) products.push(`산타꾸러미 ${order.santaPackageQty}`);
            const productSummary = products.join(', ') || '-';

            html += `
                <div class="calendar-order-card" onclick="showOrderDetail(filteredOrders[${order.originalIndex}], ${order.originalIndex})">
                    <div class="calendar-order-time">⏰ ${order.pickupTime}</div>
                    <div class="calendar-order-info">
                        <div>
                            <div class="calendar-order-customer">👤 ${order.name}</div>
                            <div class="calendar-order-product">🍪 ${productSummary}</div>
                        </div>
                        <span class="status-badge status-${order.status}">${order.status}</span>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    calendarContainer.innerHTML = html;
}
