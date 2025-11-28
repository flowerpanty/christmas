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
        total += 23000 * faceSetQty;

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
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();

        // Products (선택 사항)
        const brookie1Qty = form.querySelector('[name="brookie1_qty"]').value;
        const brookie1Option = form.querySelector('[name="brookie1_option"]').options[form.querySelector('[name="brookie1_option"]').selectedIndex].text;
        const brookie2Qty = form.querySelector('[name="brookie2_qty"]').value;
        const faceSetQty = form.querySelector('[name="faceset_qty"]').value;

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
            brookie1Qty: brookie1Qty,
            brookie1Option: brookie1Option,
            brookie2Qty: brookie2Qty,
            faceSetQty: faceSetQty,
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
            brookie1Qty: brookie1Qty,
            brookie1Option: brookie1Option,
            brookie2Qty: brookie2Qty,
            faceSetQty: faceSetQty,
            totalPrice: total,
            pickupMethod: pickupMethod,
            pickupDate: pickupDate,
            pickupTime: pickupTime,
            depositor: depositor,
            amount: amount,
            memo: memo || '없음',
            timestamp: timestamp
        };

        // 버튼 비활성화 및 텍스트 변경
        const submitBtn = form.querySelector('.submit-btn');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = '전송 중...';

        // 고객에게 이메일 발송
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, customerEmailParams)
            .then(function (response) {
                console.log('Customer email sent successfully!', response.status, response.text);

                // 관리자에게 이메일 발송
                return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, adminEmailParams);
            })
            .then(function (response) {
                console.log('Admin email sent successfully!', response.status, response.text);
                showModal();
                form.reset();
                document.getElementById('total-price').textContent = '0';
            })
            .catch(function (error) {
                console.error('Email sending failed:', error);
                alert('견적서 이메일 전송에 실패했습니다. 다시 시도해 주세요.');
            })
            .finally(function () {
                // 버튼 다시 활성화
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            });
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
