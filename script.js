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


        console.log('Preparing to send quote email...');

        // EmailJS 초기화
        const EMAILJS_PUBLIC_KEY = 'zZfFgoxrtxr8JYucN';
        const EMAILJS_SERVICE_ID = 'service_xgj021m';
        const EMAILJS_TEMPLATE_ID = 'template_aluys8o';

        // EmailJS 초기화
        emailjs.init(EMAILJS_PUBLIC_KEY);

        // 타임스탬프 생성
        const timestamp = new Date().toLocaleString('ko-KR');

        // 이메일 파라미터
        const emailParams = {
            to_email: email,                    // 고객 이메일
            cc_email: 'nahmsososochan@gmail.com', // 관리자 이메일
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

        // EmailJS로 이메일 전송
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailParams)
            .then(function (response) {
                console.log('Email sent successfully!', response.status, response.text);
                showModal();
                form.reset();
                document.getElementById('total-price').textContent = '0';
            })
            .catch(function (error) {
                console.error('Email sending failed:', error);
                alert('견적서 이메일 전송에 실패했습니다. 다시 시도해 주세요.');
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
