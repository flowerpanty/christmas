document.addEventListener('DOMContentLoaded', () => {
    createSnowflakes();
    setupForm();
    setupPriceCalculation();
    setupModal();
    setupImageSliders();
});

function setupImageSliders() {
    const arrows = document.querySelectorAll('.slider-arrow');
    arrows.forEach(arrow => {
        arrow.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent any default behavior
            const wrapper = arrow.closest('.slider-wrapper');
            const slider = wrapper.querySelector('.image-slider');

            if (slider) {
                // Scroll to the next slide (width of container)
                // If at the end, scroll back to start
                const maxScroll = slider.scrollWidth - slider.clientWidth;
                const currentScroll = slider.scrollLeft;

                if (currentScroll >= maxScroll - 10) {
                    slider.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    slider.scrollBy({ left: slider.clientWidth, behavior: 'smooth' });
                }
            }
        });
    });
}

function createSnowflakes() {
    const snowContainer = document.getElementById('snow-container');
    const snowflakeCount = 50;

    for (let i = 0; i < snowflakeCount; i++) {
        const snowflake = document.createElement('div');
        snowflake.classList.add('snowflake');

        const left = Math.random() * 100;
        const size = Math.random() * 5 + 2;
        const duration = Math.random() * 5 + 5;
        const delay = Math.random() * 5;

        snowflake.style.left = `${left}%`;
        snowflake.style.width = `${size}px`;
        snowflake.style.height = `${size}px`;
        snowflake.style.animationDuration = `${duration}s`;
        snowflake.style.animationDelay = `${delay}s`;

        snowContainer.appendChild(snowflake);
    }
}

function setupPriceCalculation() {
    const form = document.getElementById('order-form');
    const inputs = form.querySelectorAll('.product-input');
    const totalPriceEl = document.getElementById('total-price');

    function calculateTotal() {
        let total = 0;

        // Brookie Bear (곰돌이)
        const brookieBearQty = parseInt(form.querySelector('[name="brookie_bear_qty"]').value) || 0;
        total += 8500 * brookieBearQty;

        // Brookie Tree (트리)
        const brookieTreeQty = parseInt(form.querySelector('[name="brookie_tree_qty"]').value) || 0;
        total += 9000 * brookieTreeQty;

        // Brookie 2pc
        const brookie2Qty = parseInt(form.querySelector('[name="brookie2_qty\"]').value) || 0;
        total += 17000 * brookie2Qty;

        // Santa Package (산타꾸러미)
        const santaPackageQty = parseInt(form.querySelector('[name="faceset_qty"]').value) || 0;
        total += 23000 * santaPackageQty;

        totalPriceEl.textContent = total.toLocaleString();

        // Auto-fill Deposit Amount
        const amountInput = document.getElementById('amount');
        if (amountInput) {
            amountInput.value = total;
        }

        // Trigger Animation
        const priceBox = document.querySelector('.total-price-box');
        priceBox.classList.remove('pop');
        void priceBox.offsetWidth; // Trigger reflow
        priceBox.classList.add('pop');
    }

    inputs.forEach(input => {
        input.addEventListener('input', calculateTotal);
        input.addEventListener('change', calculateTotal);
    });
}

function setupForm() {
    const form = document.getElementById('order-form');

    // 전화번호 자동 포맷팅
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, ''); // 숫자만 추출

            // 최대 11자리까지만 허용
            if (value.length > 11) {
                value = value.slice(0, 11);
            }

            // 010-xxxx-xxxx 형식으로 포맷팅
            let formatted = '';
            if (value.length <= 3) {
                formatted = value;
            } else if (value.length <= 7) {
                formatted = value.slice(0, 3) + '-' + value.slice(3);
            } else {
                formatted = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7);
            }

            e.target.value = formatted;
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Gather Data
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();

        // Products (선택 사항)
        const brookieBearQty = form.querySelector('[name="brookie_bear_qty"]').value;
        const brookieTreeQty = form.querySelector('[name="brookie_tree_qty"]').value;
        const brookie2Qty = form.querySelector('[name="brookie2_qty"]').value;
        const santaPackageQty = form.querySelector('[name="faceset_qty"]').value;

        // Pickup
        const pickupMethodElement = form.querySelector('input[name="pickup_method"]:checked');
        const pickupMethod = pickupMethodElement?.value === 'pickup' ? '매장 픽업' : '퀵 착불';
        const pickupDate = document.getElementById('pickup_date').value;
        const pickupTime = document.getElementById('pickup_time').value;

        // Payment
        const depositor = document.getElementById('depositor').value.trim();
        const amount = document.getElementById('amount').value.trim();
        const total = document.getElementById('total-price').textContent;

        const memo = document.getElementById('memo').value; // 선택 사항

        // ===== 필수 입력 검증 =====
        const missingFields = [];

        if (!name) missingFields.push('주문자 성함');
        if (!email) missingFields.push('이메일');
        if (!phone) missingFields.push('연락처');
        if (!pickupMethodElement) missingFields.push('수령 방법');
        if (!pickupDate) missingFields.push('픽업 날짜');
        if (!pickupTime) missingFields.push('픽업 시간');
        if (!depositor) missingFields.push('입금자명');
        if (!amount) missingFields.push('입금 예정액');

        // 이메일 형식 검증
        if (email && !email.includes('@')) {
            alert('올바른 이메일 주소를 입력해 주세요.');
            return;
        }

        // 누락된 필드가 있을 경우
        if (missingFields.length > 0) {
            const fieldList = missingFields.join(', ');
            alert(`다음 항목을 입력해 주세요:\n\n${fieldList}\n\n※ 상품 수량과 메모는 선택 사항입니다.`);
            return;
        }

        // 12월 25일 예약 시간 제한 검증 (12:00까지만 접수)
        if (pickupDate === '12월 25일') {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTimeInMinutes = currentHour * 60 + currentMinute;
            const cutoffTime = 12 * 60; // 12:00 = 720분

            if (currentTimeInMinutes >= cutoffTime) {
                alert('12월 25일 주문은 당일 12:00(정오)까지만 접수 가능합니다.\n다른 날짜를 선택해 주세요.');
                return;
            }
        }


        console.log('Preparing to send quote email...');

        // EmailJS 초기화
        const EMAILJS_PUBLIC_KEY = 'zZfFgoxrtxr8JYucN';
        const EMAILJS_SERVICE_ID = 'service_xgj021m';
        const EMAILJS_TEMPLATE_ID = 'template_aluys8o';

        // EmailJS 초기화
        emailjs.init(EMAILJS_PUBLIC_KEY);

        // 타임스탬프 생성
        const timestamp = new Date().toLocaleString('ko-KR');

        // 고객용 이메일 파라미터
        const customerEmailParams = {
            to_email: email,
            name: name,
            email: email,
            phone: phone,
            brookieBearQty: brookieBearQty,
            brookieTreeQty: brookieTreeQty,
            brookie2Qty: brookie2Qty,
            santaPackageQty: santaPackageQty,
            totalPrice: total,
            pickupMethod: pickupMethod,
            pickupDate: pickupDate,
            pickupTime: pickupTime,
            depositor: depositor,
            amount: amount,
            memo: memo || '없음',
            timestamp: timestamp
        };

        // 관리자용 이메일 파라미터
        const adminEmailParams = {
            to_email: 'flowerpanty@gmail.com',
            name: name,
            email: email,
            phone: phone,
            brookieBearQty: brookieBearQty,
            brookieTreeQty: brookieTreeQty,
            brookie2Qty: brookie2Qty,
            santaPackageQty: santaPackageQty,
            totalPrice: total,
            pickupMethod: pickupMethod,
            pickupDate: pickupDate,
            pickupTime: pickupTime,
            depositor: depositor,
            amount: amount,
            memo: memo || '없음',
            timestamp: timestamp
        };

        // Google Apps Script URL (사용자가 배포 후 입력해야 함)
        const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzKr77_KPQdoepPLqXynNbn6-3uGBodISlh2PMMzYqLwXlXaDuRcwsMgZWWLxxYi-g/exec';

        // 버튼 비활성화 및 텍스트 변경
        const submitBtn = form.querySelector('.submit-btn');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = '전송 중...';

        // 주문 데이터 객체
        const orderData = {
            name: name,
            email: email,
            phone: phone,
            brookieBearQty: brookieBearQty,
            brookieTreeQty: brookieTreeQty,
            brookie2Qty: brookie2Qty,
            santaPackageQty: santaPackageQty,
            totalPrice: total,
            pickupMethod: pickupMethod,
            pickupDate: pickupDate,
            pickupTime: pickupTime,
            depositor: depositor,
            amount: amount,
            memo: memo || '없음',
            timestamp: timestamp
        };

        // 1. Google Sheets에 저장 시도 (Primary Storage)
        let sheetsSuccess = false;
        if (GOOGLE_SCRIPT_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
            try {
                const sheetsResponse = await fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(orderData)
                });
                console.log('Google Sheets 저장 완료');
                sheetsSuccess = true;
            } catch (error) {
                console.error('Google Sheets 저장 실패:', error);
                console.log('이메일로만 발송합니다.');
            }
        } else {
            console.log('Google Script URL이 설정되지 않음. 이메일로만 발송합니다.');
        }

        // 2. 이메일 발송 (Google Apps Script가 처리하므로 프론트엔드에서는 생략)
        // 만약 Google Apps Script가 실패했을 때를 대비해 알림만 표시

        console.log('주문 데이터 전송 완료');

        // 성공 모달 표시 (Apps Script는 비동기로 처리되므로 성공으로 가정)
        showModal();
        form.reset();
        document.getElementById('total-price').textContent = '0';

        // 버튼 다시 활성화
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    });
}

function setupModal() {
    const modal = document.getElementById('success-modal');
    const closeBtn = document.querySelector('.close-modal-btn');
    const laterBtn = document.querySelector('.later-btn');

    function closeModal() {
        modal.classList.add('hidden');
    }

    closeBtn.addEventListener('click', closeModal);
    laterBtn.addEventListener('click', closeModal);

    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

function showModal() {
    const modal = document.getElementById('success-modal');
    modal.classList.remove('hidden');
}
