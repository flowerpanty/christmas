// 관리자 페이지에서 주문 데이터를 읽어오는 함수
function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  // 헤더 제외하고 데이터만 가져오기
  const orders = data.slice(1).map(row => ({
    timestamp: row[0],
    name: row[1],
    email: row[2],
    phone: row[3],
    brookieBearQty: row[4],
    brookieTreeQty: row[5],
    brookie2Qty: row[6],
    santaPackageQty: row[7],
    totalPrice: row[8],
    pickupMethod: row[9],
    pickupDate: row[10],
    pickupTime: row[11],
    depositor: row[12],
    amount: row[13],
    memo: row[14],
    status: row[15] || '입금대기'
  }));
  
  return ContentService.createTextOutput(JSON.stringify({
    result: 'success',
    orders: orders
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // 1. Google Sheets에 저장 (새로운 상품 구조)
    sheet.appendRow([
      new Date(),
      data.name,
      data.email,
      data.phone,
      data.brookieBearQty || '0',
      data.brookieTreeQty || '0',
      data.brookie2Qty || '0',
      data.santaPackageQty || '0',
      data.totalPrice,
      data.pickupMethod,
      data.pickupDate,
      data.pickupTime,
      data.depositor,
      data.amount,
      data.memo || '',
      '입금대기' // 기본 상태
    ]);

    // 2. 고객에게 확인 이메일 전송
    const customerSubject = '[NothingMatters] 주문이 접수되었습니다! 🎄';
    const customerBody = `
안녕하세요 ${data.name}님!

주문해주셔서 감사합니다.

━━━━━━━━━━━━━━━━━━━━━━
📋 주문 내역
━━━━━━━━━━━━━━━━━━━━━━

• 브루키 (곰돌이): ${data.brookieBearQty || 0}개
• 브루키 (트리): ${data.brookieTreeQty || 0}개
• 브루키 세트: ${data.brookie2Qty || 0}개
• 산타꾸러미: ${data.santaPackageQty || 0}개

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

• 브루키 (곰돌이): ${data.brookieBearQty || 0}개
• 브루키 (트리): ${data.brookieTreeQty || 0}개
• 브루키 세트: ${data.brookie2Qty || 0}개
• 산타꾸러미: ${data.santaPackageQty || 0}개

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

관리자 페이지에서 확인하세요!
    `.trim();

    GmailApp.sendEmail('flowerpanty@gmail.com', adminSubject, adminBody);

    return ContentService.createTextOutput(JSON.stringify({ 
      'result': 'success',
      'message': '주문이 성공적으로 저장되었습니다.'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({ 
      'result': 'error', 
      'error': error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
