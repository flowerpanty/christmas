// Admin Dashboard Script
const ADMIN_PASSWORD = 'nothingmatters2024';
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxWdtxVwVwMiZgr8k2MOeg-U--C2eEvj7VUYcsj26K0IlNg4ieOwykcMvkpTaIFyDU/exec'; // 사용자가 배포 후 입력

let allOrders = [];
let filteredOrders = [];

// --- Calendar Manager (Moved to top) ---
const calendarManager = {
    currentDate: new Date(),
    selectedDate: null,

    init() {
        this.render();
        this.setupEventListeners();
    },

    setupEventListeners() {
        document.getElementById('btn-prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.render();
        });

        document.getElementById('btn-next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.render();
        });

        document.getElementById('btn-today').addEventListener('click', () => {
            this.currentDate = new Date();
            this.render();
        });
    },

    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // Update Title
        const titleEl = document.getElementById('calendar-title');
        if (titleEl) titleEl.textContent = `${year}년 ${month + 1}월`;

        const grid = document.getElementById('calendar-grid');
        if (!grid) return;
        grid.innerHTML = '';

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const startDayOfWeek = firstDay.getDay(); // 0 (Sun) - 6 (Sat)
        const totalDays = lastDay.getDate();

        // Previous Month Padding
        for (let i = 0; i < startDayOfWeek; i++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-day other-month';
            grid.appendChild(cell);
        }

        // Current Month Days
        for (let day = 1; day <= totalDays; day++) {
            const dateStr = `${month + 1}월 ${day}일`; // Format matching pickupDate
            const cell = document.createElement('div');
            cell.className = 'calendar-day';
            cell.innerHTML = `<div class="day-number">${day}</div>`;

            // Find orders for this day
            const dayOrders = allOrders.filter(o => o.pickupDate && o.pickupDate.includes(dateStr));

            if (dayOrders.length > 0) {
                const dotsContainer = document.createElement('div');
                dotsContainer.className = 'day-dots';
                dayOrders.forEach(order => {
                    const dot = document.createElement('div');
                    dot.className = `day-dot ${order.status === '픽업완료' ? 'completed' : ''}`;
                    dotsContainer.appendChild(dot);
                });
                cell.appendChild(dotsContainer);
            }

            // Click Event
            cell.addEventListener('click', () => {
                // Remove selected class from others
                document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                cell.classList.add('selected');
                this.renderDailySchedule(dateStr, dayOrders);
            });

            grid.appendChild(cell);
        }
    },

    renderDailySchedule(dateStr, orders) {
        const title = document.getElementById('selected-date-title');
        const list = document.getElementById('calendar-detail-list');

        if (title) title.textContent = `${this.currentDate.getFullYear()}년 ${dateStr} (${this.getDayOfWeek(dateStr)})`;
        if (!list) return;
        list.innerHTML = '';

        if (orders.length === 0) {
            list.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">예약된 주문이 없습니다.</p>';
            return;
        }

        // Sort by time
        orders.sort((a, b) => (a.pickupTime || '').localeCompare(b.pickupTime || ''));

        orders.forEach(order => {
            // Reuse the premium card style logic
            const card = document.createElement('div');
            card.className = 'mobile-card-premium'; // Reuse CSS class

            // 픽업 뱃지 스타일
            const pickupBadgeClass = order.pickupMethod.includes('퀵') ? 'badge-quick' : 'badge-pickup';
            const pickupIcon = order.pickupMethod.includes('퀵') ? '🚚' : '🛍️';

            // 상품 태그
            let productTagsHtml = '';
            if (order.brookieBearQty > 0) productTagsHtml += `<span class="product-tag">곰돌이 ${order.brookieBearQty}개</span>`;
            if (order.brookieTreeQty > 0) productTagsHtml += `<span class="product-tag">트리 ${order.brookieTreeQty}개</span>`;
            if (order.brookie2Qty > 0) productTagsHtml += `<span class="product-tag">세트 ${order.brookie2Qty}개</span>`;
            if (order.santaPackageQty > 0) productTagsHtml += `<span class="product-tag">산타꾸러미 ${order.santaPackageQty}개</span>`;

            card.innerHTML = `
                <div class="card-header-premium">
                    <div class="header-left">
                        <div class="customer-name">
                            ${order.name}
                            <span class="${pickupBadgeClass}">${pickupIcon} ${order.pickupMethod}</span>
                            <span class="status-badge status-${order.status}">${order.status}</span>
                        </div>
                    </div>
                    <div class="header-right">
                        <span class="total-price">${order.totalPrice}</span>
                    </div>
                </div>
                <div class="card-body-premium">
                    <div class="info-row">⏰ 픽업 시간: ${order.pickupTime}</div>
                    <div class="product-tags">${productTagsHtml}</div>
                </div>
            `;
            // Add click listener to show details
            card.addEventListener('click', () => showOrderDetail(order, order.originalIndex));
            list.appendChild(card);
        });
    },

    getDayOfWeek(dateStr) {
        const year = this.currentDate.getFullYear();
        const match = dateStr.match(/(\d+)월 (\d+)일/);
        if (match) {
            const date = new Date(year, parseInt(match[1]) - 1, parseInt(match[2]));
            const days = ['일', '월', '화', '수', '목', '금', '토'];
            return days[date.getDay()] + '요일';
        }
        return '';
    }
};

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

    // IP Check Button Injection & Event Listener
    let checkIpBtn = document.getElementById('check-ip-btn');
    if (!checkIpBtn) {
        // If button is missing (e.g. cached HTML), inject it dynamically
        const headerActions = document.querySelector('.header-actions') || document.querySelector('.admin-actions');
        if (headerActions) {
            checkIpBtn = document.createElement('button');
            checkIpBtn.id = 'check-ip-btn';
            checkIpBtn.className = 'btn-secondary';
            checkIpBtn.textContent = 'IP 확인';
            // Insert as first child
            headerActions.insertBefore(checkIpBtn, headerActions.firstChild);
        }
    }

    if (checkIpBtn) {
        checkIpBtn.addEventListener('click', checkServerIP);
    }

    // Refresh
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadOrders();
        });
    }

    // Filters
    // document.getElementById('date-filter').addEventListener('change', applyFilters); // Removed
    document.getElementById('status-filter').addEventListener('change', applyFilters);
    document.getElementById('search-input').addEventListener('input', applyFilters);

    // Tab Switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all tabs
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));

            // Add active class to clicked tab
            btn.classList.add('active');
            const tabName = btn.dataset.tab;

            // Show corresponding section
            if (tabName === 'list') {
                document.getElementById('section-list').classList.add('active');
            } else if (tabName === 'calendar') {
                document.getElementById('section-calendar').classList.add('active');
                calendarManager.render(); // Re-render calendar
            } else if (tabName === 'analysis') {
                document.getElementById('section-analysis').classList.add('active');
            }
        });
    });

    // Initialize Calendar
    calendarManager.init();

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

            // Render calendar with loaded data
            if (calendarManager) {
                calendarManager.render();
            }
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
    // Clear existing data
    tbody.innerHTML = '';
    const mobileListView = document.getElementById('mobile-list-view');
    if (mobileListView) mobileListView.innerHTML = '';

    if (orders.length === 0) {
        const noDataHtml = '<tr><td colspan="9" class="no-orders-message">주문 내역이 없습니다.</td></tr>';
        tbody.innerHTML = noDataHtml;
        if (mobileListView) mobileListView.innerHTML = '<div class="no-orders-message">주문 내역이 없습니다.</div>';
        return;
    }

    orders.forEach((order, index) => {
        // --- Desktop Table Row ---
        const row = document.createElement('tr');
        row.dataset.index = index; // Store index for event delegation

        // 날짜 포맷팅
        let formattedDate = order.timestamp || '-';
        try {
            const timestamp = new Date(order.timestamp);
            if (!isNaN(timestamp.getTime())) {
                const month = timestamp.getMonth() + 1;
                const date = timestamp.getDate();
                const hours = timestamp.getHours();
                const minutes = String(timestamp.getMinutes()).padStart(2, '0');
                formattedDate = `${month}월 ${date}일 ${hours}:${minutes}`;
            }
        } catch (e) {
            console.error('Date parsing error:', e);
        }

        // 상품 요약
        const products = [];
        if (order.brookieBearQty > 0) products.push(`곰돌이 ${order.brookieBearQty}`);
        if (order.brookieTreeQty > 0) products.push(`트리 ${order.brookieTreeQty}`);
        if (order.brookie2Qty > 0) products.push(`세트 ${order.brookie2Qty}`);
        if (order.santaPackageQty > 0) products.push(`산타꾸러미 ${order.santaPackageQty}`);
        const productSummary = products.join(', ') || '-';

        // 카카오톡 발송 상태 HTML
        let kakaoHtml = '';
        if (order.kakaoSent === 'Y') {
            kakaoHtml = '<span class="kakao-sent">✅ 발송완료</span>';
        } else {
            // Removed inline onclick, added class 'btn-kakao-list-send'
            kakaoHtml = `<button class="btn-kakao-quick btn-kakao-list-send" data-index="${index}">📤 발송</button>`;
        }

        row.innerHTML = `
            <td data-label="주문시간">${formattedDate}</td>
            <td data-label="이름">${order.name}</td>
            <td data-label="연락처">${order.phone}</td>
            <td data-label="주문내역">${productSummary}</td>
            <td data-label="총액">${order.totalPrice}</td>
            <td data-label="픽업일시">${order.pickupDate} ${order.pickupTime}</td>
            <td data-label="입금자">${order.depositor}</td>
            <td data-label="입금액">${order.amount}</td>
            <td data-label="상태"><span class="status-badge status-${order.status}" onclick="event.stopPropagation(); toggleStatus(this, ${index})">${order.status}</span></td>
            <td data-label="카톡발송">${kakaoHtml}</td>
        `;

        // Row click to open modal (Event Delegation will handle this better, but keeping simple for now)
        row.addEventListener('click', (e) => {
            // Prevent modal opening if clicking on specific elements
            if (e.target.closest('.btn-kakao-list-send') || e.target.closest('.status-badge')) {
                return;
            }
            showOrderDetail(order, index);
        });

        tbody.appendChild(row);

        // --- Mobile List Card (Premium Style) ---
        if (mobileListView) {
            const card = document.createElement('div');
            card.className = 'mobile-card-premium';
            card.dataset.index = index;

            // 픽업 뱃지 스타일
            const pickupBadgeClass = order.pickupMethod.includes('퀵') ? 'badge-quick' : 'badge-pickup';
            const pickupIcon = order.pickupMethod.includes('퀵') ? '🚚' : '🛍️';

            // 상품 태그 생성
            let productTagsHtml = '';
            if (order.brookieBearQty > 0) productTagsHtml += `<span class="product-tag">곰돌이 ${order.brookieBearQty}개</span>`;
            if (order.brookieTreeQty > 0) productTagsHtml += `<span class="product-tag">트리 ${order.brookieTreeQty}개</span>`;
            if (order.brookie2Qty > 0) productTagsHtml += `<span class="product-tag">세트 ${order.brookie2Qty}개</span>`;
            if (order.santaPackageQty > 0) productTagsHtml += `<span class="product-tag">산타꾸러미 ${order.santaPackageQty}개</span>`;

            // 카카오톡 발송 상태 HTML
            let kakaoMobileHtml = '';
            if (order.kakaoSent === 'Y') {
                kakaoMobileHtml = '<span class="kakao-sent-mobile">✅ 발송완료</span>';
            } else {
                // Removed inline onclick, added class 'btn-kakao-list-send'
                kakaoMobileHtml = `<button class="btn-kakao-mobile btn-kakao-list-send" data-index="${index}">📤 카톡발송</button>`;
            }

            card.innerHTML = `
                <div class="card-header-premium">
                    <div class="header-left">
                        <div class="customer-name">
                            ${order.name}
                            <span class="${pickupBadgeClass}">${pickupIcon} ${order.pickupMethod}</span>
                            <span class="status-badge status-${order.status}" onclick="event.stopPropagation(); toggleStatus(this, ${index})">${order.status}</span>
                        </div>
                        <div class="card-badges">
                            <span class="badge-pickup" style="background: #f5f5f5; color: #666; border: 1px solid #ddd;">입금확인 ${formattedDate.split(' ')[0]}</span>
                        </div>
                    </div>
                    <div class="header-right">
                        <span class="total-price">${order.totalPrice}</span>
                        <div class="email-row">${order.email}</div>
                    </div>
                </div>
                
                <div class="card-body-premium">
                    <div class="info-row">📅 픽업 날짜: ${order.pickupDate}</div>
                    <div class="info-row">⏰ 픽업 시간: ${order.pickupTime}</div>
                    <div class="product-tags">
                        ${productTagsHtml}
                    </div>
                    <div class="card-actions">
                        ${kakaoMobileHtml}
                        <button class="btn-detail-mobile" onclick="showOrderDetail(filteredOrders[${index}], ${index})">상세보기</button>
                    </div>
                </div>
            `;

            // Add event listener for the send button specifically
            const sendBtn = card.querySelector('.btn-kakao-list-send');
            if (sendBtn) {
                sendBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Stop bubbling to card
                    sendKakaoFromList(index, sendBtn);
                });
            }

            // Card click listener
            card.addEventListener('click', (e) => {
                if (e.target.closest('.btn-kakao-list-send') || e.target.closest('.status-badge') || e.target.closest('.btn-detail-mobile')) {
                    return;
                }
                showOrderDetail(order, index);
            });

            mobileListView.appendChild(card);
        }
    });

    // Add event listeners for Desktop buttons after rendering
    document.querySelectorAll('.orders-table .btn-kakao-list-send').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Stop bubbling to row
            const index = parseInt(btn.dataset.index);
            sendKakaoFromList(index, btn);
        });
    });

    // Ensure mobile list view is visible if in list mode
    const mobileListViewEl = document.getElementById('mobile-list-view');
    if (mobileListViewEl && !document.querySelector('.table-container').classList.contains('hidden')) {
        mobileListViewEl.classList.remove('hidden');
    }
}

// Update Statistics
function updateStatistics(orders) {
    const totalOrders = orders.length;
    const totalSales = orders.reduce((sum, order) => {
        // Remove all non-numeric characters (commas, '원', spaces, etc.)
        const amountStr = order.totalPrice.toString().replace(/[^0-9]/g, '');
        const amount = parseInt(amountStr);
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
    const statusValue = document.getElementById('status-filter').value;
    const searchValue = document.getElementById('search-input').value.toLowerCase();

    filteredOrders = allOrders.filter(order => {
        // Status Filter
        let statusMatch = true;
        if (statusValue !== 'all') {
            statusMatch = order.status === statusValue;
        }

        // Search Filter
        let searchMatch = true;
        if (searchValue) {
            searchMatch = order.name.toLowerCase().includes(searchValue) ||
                order.phone.includes(searchValue);
        }

        return statusMatch && searchMatch;
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
                <option value="입금확인" ${order.status === '입금확인' ? 'selected' : ''}>입금확인</option>
                <option value="제작중" ${order.status === '제작중' ? 'selected' : ''}>제작중</option>
                <option value="픽업완료" ${order.status === '픽업완료' ? 'selected' : ''}>픽업완료</option>
            </select>
        </div>
        <div class="modal-actions">
            <button class="btn-update-status" onclick="updateOrderStatus(${index})">상태 업데이트</button>
            <button class="btn-kakao-send" onclick="sendKakaoNotification(${index})">카카오톡 발송</button>
            <button class="btn-delete-order" onclick="deleteOrder(${index})">주문 삭제</button>
        </div>
    `;

    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('order-modal').classList.add('hidden');
}

// Send Kakao Notification
window.sendKakaoNotification = async function (index) {
    const order = filteredOrders[index];

    if (!confirm(`"${order.name}"님에게 주문 접수 알림톡을 발송하시겠습니까?`)) {
        return;
    }

    const btn = document.querySelector('.btn-kakao-send');
    if (btn) {
        btn.textContent = '발송 중...';
        btn.disabled = true;
    }

    // 상품 요약 생성
    const products = [];
    if (order.brookieBearQty > 0) products.push(`브루키(곰돌이) ${order.brookieBearQty}개`);
    if (order.brookieTreeQty > 0) products.push(`브루키(트리) ${order.brookieTreeQty}개`);
    if (order.brookie2Qty > 0) products.push(`브루키 세트 ${order.brookie2Qty}개`);
    if (order.santaPackageQty > 0) products.push(`산타꾸러미 ${order.santaPackageQty}개`);
    const productSummary = products.join(', ');

    try {
        const params = new URLSearchParams();
        params.append('data', JSON.stringify({
            action: 'send_alimtalk',
            timestamp: order.timestamp,
            name: order.name,
            phone: order.phone,
            productSummary: productSummary,
            pickupMethod: order.pickupMethod,
            pickupDate: order.pickupDate,
            pickupTime: order.pickupTime,
            totalPrice: order.totalPrice
        }));

        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            // mode: 'no-cors', // CORS 모드로 변경
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });

        const result = await response.json();

        if (result.result === 'success') {
            alert('✅ 카카오톡이 발송되었습니다!');
        } else {
            alert('❌ 발송 실패: ' + result.message);
        }

    } catch (error) {
        console.error('Error sending Kakao notification:', error);
        alert('카카오톡 발송 중 오류가 발생했습니다: ' + error.message);
    } finally {
        if (btn) {
            btn.textContent = '카카오톡 발송';
            btn.disabled = false;
        }
    }
}

// Check Server IP
async function checkServerIP() {
    try {
        const response = await fetch('/api/check-ip');
        const data = await response.json();
        if (data.success) {
            alert(`현재 서버 IP: ${data.ip}\n\n알리고 관리자 페이지(https://smartsms.aligo.in/)의 [API 연동설정] 메뉴에서 이 IP가 등록되어 있는지 확인해주세요.`);
        } else {
            alert('IP 확인 실패: ' + data.message);
        }
    } catch (error) {
        console.error('IP check error:', error);
        alert('IP 확인 중 오류가 발생했습니다.');
    }
}

// Send Kakao From List (without modal)
window.sendKakaoFromList = async function (index, btnElement) {
    const order = filteredOrders[index];

    if (!confirm(`"${order.name}"님에게 주문 접수 알림톡을 발송하시겠습니까?`)) {
        return;
    }

    // Use the passed button element or find it if not provided
    let btn = btnElement;
    if (!btn) {
        // Fallback for any legacy calls
        btn = document.querySelector(`button[data-index="${index}"]`);
    }

    if (btn) {
        btn.textContent = '발송 중...';
        btn.disabled = true;
    }

    // 상품 요약 생성
    const products = [];
    if (order.brookieBearQty > 0) products.push(`브루키(곰돌이) ${order.brookieBearQty}개`);
    if (order.brookieTreeQty > 0) products.push(`브루키(트리) ${order.brookieTreeQty}개`);
    if (order.brookie2Qty > 0) products.push(`브루키 세트 ${order.brookie2Qty}개`);
    if (order.santaPackageQty > 0) products.push(`산타꾸러미 ${order.santaPackageQty}개`);
    const productSummary = products.join(', ');

    try {
        // 1. Railway 서버를 통해 알리고 API 호출 (Fixie Proxy 사용)
        const railwayResponse = await fetch('/api/send-kakao', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: order.name,
                phone: order.phone,
                productSummary: productSummary,
                pickupMethod: order.pickupMethod,
                pickupDate: order.pickupDate,
                pickupTime: order.pickupTime,
                totalPrice: order.totalPrice
            })
        });

        const railwayResult = await railwayResponse.json();

        if (railwayResult.success) {
            // 2. 성공 시 Google Sheets 상태 업데이트 (GAS 호출)
            // no-cors 모드 사용 (응답 확인 불가하지만 실행됨)
            const params = new URLSearchParams();
            params.append('data', JSON.stringify({
                action: 'update_kakao_status',
                timestamp: order.timestamp,
                name: order.name,
                phone: order.phone
            }));

            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                // mode: 'no-cors',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            });

            // Optimistic update
            order.kakaoSent = 'Y';
            const originalIndex = allOrders.findIndex(o => o.timestamp === order.timestamp);
            if (originalIndex !== -1) {
                allOrders[originalIndex].kakaoSent = 'Y';
            }

            // UI 즉시 업데이트
            const updateButtonUI = (button) => {
                if (button) {
                    const span = document.createElement('span');
                    span.className = button.classList.contains('btn-kakao-mobile') ? 'kakao-sent-mobile' : 'kakao-sent';
                    span.textContent = '✅ 발송완료';
                    button.parentNode.replaceChild(span, button);
                }
            };

            const desktopBtn = document.querySelector(`.orders-table button[data-index="${index}"]`);
            updateButtonUI(desktopBtn);

            const mobileBtn = document.querySelector(`.mobile-card-premium button[data-index="${index}"]`);
            updateButtonUI(mobileBtn);

            if (typeof calendarManager !== 'undefined') {
                calendarManager.render();
            }

            alert('✅ 카카오톡이 발송되었습니다!');

        } else {
            // 상세 에러 메시지 표시
            let errorMsg = railwayResult.message;
            if (railwayResult.code) {
                errorMsg += `\n\n에러 코드: ${railwayResult.code}`;
                if (railwayResult.serverIp) {
                    errorMsg += `\n실제 발송 IP: ${railwayResult.serverIp}`;
                }
                if (railwayResult.code == -102) {
                    errorMsg += '\n(인증되지 않은 IP입니다. 위 "실제 발송 IP"를 알리고 관리자 페이지에 등록해주세요.)';
                }
            }
            throw new Error(errorMsg);
        }

    } catch (error) {
        console.error('Error sending Kakao notification:', error);
        alert(error.message); // 이미 상세 메시지가 포함되어 있음
        if (btn) {
            btn.textContent = '📤 발송';
            btn.disabled = false;
        }
    }
}

// Delete Order
window.deleteOrder = async function (index) {
    const order = filteredOrders[index];

    if (!confirm(`정말로 "${order.name}"님의 주문을 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.`)) {
        return;
    }

    const btn = document.querySelector('.btn-delete-order');
    if (btn) {
        btn.textContent = '삭제 중...';
        btn.disabled = true;
    }

    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'delete_order',
                timestamp: order.timestamp,
                name: order.name,
                phone: order.phone
            })
        });

        // Optimistic delete
        const originalIndex = allOrders.findIndex(o => o.timestamp === order.timestamp);
        if (originalIndex !== -1) {
            allOrders.splice(originalIndex, 1);
        }

        // Re-filter if necessary, but easiest to just reload or re-apply filters
        applyFilters(); // Re-applies filters to allOrders and updates display
        updateStatistics(allOrders);

        if (typeof calendarManager !== 'undefined') {
            calendarManager.render();
        }

        alert('주문이 삭제되었습니다.');
        closeModal();

    } catch (error) {
        console.error('Error deleting order:', error);
        alert('주문 삭제 중 오류가 발생했습니다.');
        if (btn) {
            btn.textContent = '주문 삭제';
            btn.disabled = false;
        }
    }
}

// Update Order Status (Backend Integration)
window.updateOrderStatus = async function (index) {
    const newStatus = document.getElementById(`status-select-${index}`).value;
    const order = filteredOrders[index];

    if (!confirm(`"${order.name}"님의 주문 상태를 "${newStatus}"(으)로 변경하시겠습니까?`)) {
        return;
    }

    const btn = document.querySelector('.btn-update-status');
    if (btn) {
        btn.textContent = '업데이트 중...';
        btn.disabled = true;
    }

    try {
        // Send update to backend
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Google Apps Script limitation
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'update_status',
                timestamp: order.timestamp,
                name: order.name, // Fallback search key
                phone: order.phone, // Fallback search key
                status: newStatus
            })
        });

        // Update local data immediately (optimistic update)
        // Note: With no-cors, we can't read the response, so we assume success if no error thrown
        order.status = newStatus;
        const originalIndex = allOrders.findIndex(o => o.timestamp === order.timestamp);
        if (originalIndex !== -1) {
            allOrders[originalIndex].status = newStatus;
        }

        alert(`상태가 "${newStatus}"로 변경되었습니다.`);
        closeModal();
        displayOrders(filteredOrders);
        updateStatistics(allOrders);

        // Re-render calendar if it exists
        if (typeof calendarManager !== 'undefined') {
            calendarManager.render();
        }

    } catch (error) {
        console.error('Error updating status:', error);
        alert('상태 업데이트 중 오류가 발생했습니다.');
        if (btn) {
            btn.textContent = '상태 업데이트';
            btn.disabled = false;
        }
    }
}

// Toggle Status (Badge Click)
window.toggleStatus = async function (element, index) {
    const order = filteredOrders[index];
    const statuses = ['입금대기', '입금확인', '제작중', '픽업완료'];
    const currentIndex = statuses.indexOf(order.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];

    if (confirm(`상태를 "${nextStatus}"(으)로 변경하시겠습니까?`)) {
        // Reuse the update logic but we need to mock the select element or call API directly
        // Calling API directly here for cleaner code
        try {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_status',
                    timestamp: order.timestamp,
                    name: order.name,
                    phone: order.phone,
                    status: nextStatus
                })
            });

            // Optimistic update
            order.status = nextStatus;
            const originalIndex = allOrders.findIndex(o => o.timestamp === order.timestamp);
            if (originalIndex !== -1) {
                allOrders[originalIndex].status = nextStatus;
            }

            displayOrders(filteredOrders);
            updateStatistics(allOrders);
            if (typeof calendarManager !== 'undefined') {
                calendarManager.render();
            }

        } catch (error) {
            console.error('Error toggling status:', error);
            alert('상태 변경 실패');
        }
    }
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

// End of script

// 초기 로드 시 리사이즈 이벤트 트리거 (모바일 렌더링 이슈 해결용)
window.addEventListener('load', () => {
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 500);
});
