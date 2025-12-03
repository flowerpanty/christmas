const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// JSON body parser
app.use(express.json());

// 캐시 방지 헤더 추가
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Expires', '-1');
    res.set('Pragma', 'no-cache');
    next();
});

// 정적 파일 서빙
app.use(express.static(__dirname));

// 카카오톡 발송 API
app.post('/api/send-kakao', async (req, res) => {
    try {
        const { name, phone, productSummary, pickupMethod, pickupDate, pickupTime, totalPrice } = req.body;

        // 알리고 API 설정
        const ALIGO_APIKEY = process.env.ALIGO_APIKEY || 'qyaz1cwfldsvmde36i6345jsfwmei4y7';
        const ALIGO_USERID = process.env.ALIGO_USERID || 'nsc21';
        const ALIGO_SENDERKEY = process.env.ALIGO_SENDERKEY || '34e353e21a3ebc567c9df3bc527768d93ace882b';
        const ALIGO_TPL_CODE = process.env.ALIGO_TPL_CODE || 'UD_8619';
        const ALIGO_SENDER_PHONE = process.env.ALIGO_SENDER_PHONE || '01028667976';

        // 메시지 구성
        // 메시지 구성 (템플릿과 정확히 일치해야 함)
        // 주의: totalPrice에 이미 "원"이 포함되어 있으므로 추가하지 않음
        const message = `[낫띵메터스]\n\n주문 접수 안내드립니다.\n\n고객명: ${name}\n주문내역: ${productSummary}\n수령방법: ${pickupMethod}\n수령일시: ${pickupDate} ${pickupTime}\n총금액: ${totalPrice}\n\n주문하신 제품은 안내드린 일정에 맞추어 준비해드립니다`;

        console.log('=== 발송 메시지 ===');
        console.log(message);
        console.log('=== 메시지 끝 ===');

        // 전화번호 포맷팅
        const phoneNumber = phone.replace(/[^0-9]/g, '');

        // 버튼 정보 (일단 제거하고 테스트)
        // const buttonInfo = {
        //     "button": [
        //         {
        //             "name": "더 많은 귀여움 보러가기",
        //             "linkType": "WL",
        //             "linkTypeName": "웹링크",
        //             "linkMo": "https://nothingmatters.co.kr/",
        //             "linkPc": "https://example.com"
        //         }
        //     ]
        // };

        // 알리고 API 요청 파라미터
        const params = new URLSearchParams({
            'apikey': ALIGO_APIKEY,
            'userid': ALIGO_USERID,
            'senderkey': ALIGO_SENDERKEY,
            'tpl_code': ALIGO_TPL_CODE,
            'sender': ALIGO_SENDER_PHONE,
            'receiver_1': phoneNumber,
            'recvname_1': name,
            'subject_1': '주문 접수 안내',
            'message_1': message
            // 'button_1': JSON.stringify(buttonInfo) // 버튼 제거
        });

        // Axios 설정 (IPv4 강제 사용)
        const axios = require('axios');
        const https = require('https');

        const httpsAgent = new https.Agent({
            family: 4 // IPv4 강제
        });

        let axiosConfig = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            httpsAgent: httpsAgent
        };

        // 0. 발송 전 실제 나가는 IP 확인 (디버깅용)
        let currentOutgoingIp = '확인불가';
        try {
            const ipCheckResponse = await axios.get('https://api.ipify.org', { httpsAgent: httpsAgent });
            currentOutgoingIp = ipCheckResponse.data;
            console.log('알리고 발송 시도 IP:', currentOutgoingIp);
        } catch (ipError) {
            console.error('IP 확인 실패:', ipError.message);
        }

        const response = await axios.post('https://kakaoapi.aligo.in/akv10/alimtalk/send/', params, axiosConfig);
        const result = response.data;

        console.log('알리고 API 응답:', result);

        if (result.code == 0) {
            res.json({ success: true, message: '카카오톡이 발송되었습니다.' });
        } else {
            // 실패 시 상세 에러 코드와 메시지 반환
            res.json({
                success: false,
                message: `발송 실패: ${result.message} (코드: ${result.code})`,
                code: result.code,
                serverIp: currentOutgoingIp
            });
        }

    } catch (error) {
        console.error('카카오톡 발송 에러:', error);
        res.status(500).json({ success: false, message: 'API 요청 중 오류 발생: ' + error.message });
    }
});

// IP 확인 엔드포인트
app.get('/api/check-ip', async (req, res) => {
    try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        res.json({
            success: true,
            ip: ipData.ip,
            message: `Railway 서버 IP: ${ipData.ip}`
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

// 루트 경로 - index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 관리자 페이지 - admin.html
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
