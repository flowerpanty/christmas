document.addEventListener('DOMContentLoaded', () => {
    createSnowflakes();
    setupForm();
    setupPriceCalculation();
    setupModal();
});

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

        // Brookie 1pc
        const brookie1Qty = parseInt(form.querySelector('[name="brookie1_qty"]').value) || 0;
        const brookie1Option = form.querySelector('[name="brookie1_option"]').value;
        let brookie1Price = 8500;
        if (brookie1Option === 'tree') {
            brookie1Price += 500;
        }
        total += brookie1Price * brookie1Qty;

        // Brookie 2pc
        const brookie2Qty = parseInt(form.querySelector('[name="brookie2_qty"]').value) || 0;
        total += 17000 * brookie2Qty;

        // Face Set
        const faceSetQty = parseInt(form.querySelector('[name="faceset_qty"]').value) || 0;
        total += 2300 * faceSetQty;

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

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Gather Data
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;

        // Products
        const brookie1Qty = form.querySelector('[name="brookie1_qty"]').value;
        const brookie1Option = form.querySelector('[name="brookie1_option"]').options[form.querySelector('[name="brookie1_option"]').selectedIndex].text;
        const brookie2Qty = form.querySelector('[name="brookie2_qty"]').value;
        const faceSetQty = form.querySelector('[name="faceset_qty"]').value;

        // Pickup
        const pickupMethod = form.querySelector('input[name="pickup_method"]:checked')?.value === 'pickup' ? '매장 픽업' : '퀵 착불';
        const pickupDate = document.getElementById('pickup_date').value;
        const pickupTime = document.getElementById('pickup_time').value;

        // Payment
        const depositor = document.getElementById('depositor').value;
        const amount = document.getElementById('amount').value;
        const total = document.getElementById('total-price').textContent;

        const memo = document.getElementById('memo').value;


        // 견적서 내용 생성
        const quoteBody = `
===========================================
🎄 크리스마스 쿠키 주문 견적서 🎄
===========================================

📋 주문자 정보
--------------------------------------------
성함: ${name}
이메일: ${email}
연락처: ${phone}

🍪 주문 상품
--------------------------------------------
- 브루키 1 (${brookie1Option}): ${brookie1Qty}개
- 브루키 2: ${brookie2Qty}개
- 페이스 세트: ${faceSetQty}개

💰 결제 정보
--------------------------------------------
총 금액: ${total}
입금자명: ${depositor}
입금 예정액: ${amount}원

🚗 수령 방법
--------------------------------------------
방식: ${pickupMethod}
날짜: ${pickupDate}
시간: ${pickupTime}

📝 메모
--------------------------------------------
${memo || '없음'}

===========================================
본 견적서는 ${new Date().toLocaleString('ko-KR')}에 생성되었습니다.
문의사항은 nahmsososochan@gmail.com 으로 연락 주세요.
===========================================
        `.trim();

        // 고객용 이메일
        const customerSubject = `[크리스마스 쿠키] ${name}님의 주문 견적서`;
        const customerMailto = `mailto:${email}?cc=nahmsososochan@gmail.com&subject=${encodeURIComponent(customerSubject)}&body=${encodeURIComponent(quoteBody)}`;

        // 이메일 클라이언트 열기
        window.location.href = customerMailto;

        console.log('Quote email opened! Check your email client.');

        // 성공 모달 표시
        showModal();
        form.reset();
        document.getElementById('total-price').textContent = '0';

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
