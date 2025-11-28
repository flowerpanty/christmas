function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({status: 'alive'})).setMimeType(ContentService.MimeType.JSON);
}


  const testData = {
    name: "테스트고객",
    email: "test@example.com",
    phone: "010-1234-5678",
    brookie1Qty: "2",
    brookie1Option: "곰돌이",
    brookie2Qty: "1",
    faceSetQty: "3",
    totalPrice: "50,000",
    pickupMethod: "매장 픽업",
    pickupDate: "12월 20일",
    pickupTime: "15:00",
    depositor: "홍길동",
    amount: "50000",
    memo: "테스트입니다"
  };
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // 1. Sheets에 저장
  sheet.appendRow([
    new Date(),
    testData.name,
    testData.email,
    testData.phone,
    testData.brookie1Qty,
    testData.brookie1Option,
    testData.brookie2Qty,
    testData.faceSetQty,
    testData.totalPrice,
    testData.pickupMethod,
    testData.pickupDate,
    testData.pickupTime,
    testData.depositor,
    testData.amount,
    testData.memo
  ]);
  
  Logger.log('Sheets 저장 완료');
  
  // 2. 고객에게 이메일
  const customerSubject = '[NothingMatters] 주문이 접수되었습니다! 🎄';
  const customerBody = `테스트 이메일입니다.\n주문자: ${testData.name}`;
  
  GmailApp.sendEmail(testData.email, customerSubject, customerBody);
  Logger.log('고객 이메일 발송 완료: ' + testData.email);
  
  // 3. 관리자에게 이메일
  const adminSubject = '[새 주문] ' + testData.name + '님 주문';
  const adminBody = `테스트 알림입니다.\n주문자: ${testData.name}`;
  
  GmailApp.sendEmail('flowerpanty@gmail.com', adminSubject, adminBody);
  Logger.log('관리자 이메일 발송 완료');
  
  return 'SUCCESS!';
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // 1. Google Sheets에 저장
    sheet.appendRow([
      new Date(),
      data.name,
      data.email,
      data.phone,
      data.brookie1Qty,
      data.brookie1Option,
      data.brookie2Qty,
      data.faceSetQty,
      data.totalPrice,
      data.pickupMethod,
      data.pickupDate,
      data.pickupTime,
      data.depositor,
      data.amount,
      data.memo
    ]);

    // 2. 고객에게 확인 이메일 전송
    const customerSubject = '[NothingMatters] 주문이 접수되었습니다! 🎄';
    const customerBody = `
안녕하세요 ${data.name}님!

주문해주셔서 감사합니다.

━━━━━━━━━━━━━━━━━━━━━━
📋 주문 내역
━━━━━━━━━━━━━━━━━━━━━━

• 브루키 1구: ${data.brookie1Qty}개 (${data.brookie1Option})
• 브루키 2구: ${data.brookie2Qty}개
• 쿠키 얼굴 세트: ${data.faceSetQty}개

💰 총 주문 금액: ${data.totalPrice}원

━━━━━━━━━━━━━━━━━━━━━━
📦 픽업/배송 정보
━━━━━━━━━━━━━━━━━━━━━━

• 방법: ${data.pickupMethod}
• 날짜: ${data.pickupDate}
• 시간: ${data.pickupTime}

━━━━━━━━━━━━━━━━━━━━━━
💳 입금 정보
━━━━━━━━━━━━━━━━━━━━━━

• 입금자명: ${data.depositor}
• 입금액: ${data.amount}원
• 입금계좌: 국민은행 83050104204736 (남수찬)

📝 메모: ${data.memo || '없음'}

━━━━━━━━━━━━━━━━━━━━━━

⚠️ 1시간 이내 입금 확인 안될 시 자동 취소됩니다.
입금 확인 후 예약이 확정됩니다.

문의사항이 있으시면 카카오톡 채널로 연락주세요!
👉 https://pf.kakao.com/_QdCaK

감사합니다. 🎅🎄
NothingMatters
    `.trim();

    GmailApp.sendEmail(data.email, customerSubject, customerBody);

    // 3. 관리자에게 알림 이메일 전송
    const adminSubject = '[새 주문] ' + data.name + '님 주문';
    const adminBody = `
새로운 주문이 접수되었습니다!

━━━━━━━━━━━━━━━━━━━━━━
👤 주문자 정보
━━━━━━━━━━━━━━━━━━━━━━

• 이름: ${data.name}
• 이메일: ${data.email}
• 연락처: ${data.phone}

━━━━━━━━━━━━━━━━━━━━━━
📋 주문 내역
━━━━━━━━━━━━━━━━━━━━━━

• 브루키 1구: ${data.brookie1Qty}개 (${data.brookie1Option})
• 브루키 2구: ${data.brookie2Qty}개
• 쿠키 얼굴 세트: ${data.faceSetQty}개

💰 총 주문 금액: ${data.totalPrice}원

━━━━━━━━━━━━━━━━━━━━━━
📦 픽업/배송 정보
━━━━━━━━━━━━━━━━━━━━━━

• 방법: ${data.pickupMethod}
• 날짜: ${data.pickupDate}
• 시간: ${data.pickupTime}

━━━━━━━━━━━━━━━━━━━━━━
💳 입금 정보
━━━━━━━━━━━━━━━━━━━━━━

• 입금자명: ${data.depositor}
• 입금액: ${data.amount}원

📝 메모: ${data.memo || '없음'}

━━━━━━━━━━━━━━━━━━━━━━

Google Sheets에서 확인하세요!
    `.trim();

    GmailApp.sendEmail('flowerpanty@gmail.com', adminSubject, adminBody);

    return ContentService.createTextOutput(JSON.stringify({ 
      'result': 'success' 
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      'result': 'error', 
      'error': error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
