// 관리자 페이지에서 주문 데이터를 읽어오는 함수
function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // getDisplayValues()를 사용하여 표시된 텍스트 그대로 가져오기 (날짜 변환 방지)
  const data = sheet.getDataRange().getDisplayValues();
  
  // 헤더 제외하고 데이터만 가져오기
  const orders = data.slice(1).map(row => {
    return {
      timestamp: row[0] || new Date().toISOString(), // 주문시간 (표시된 그대로 or fallback)
      name: row[1] || '',
      email: row[2] || '',
      phone: row[3] || '',
      brookieBearQty: row[4] || 0,
      brookieTreeQty: row[5] || 0,
      brookie2Qty: row[6] || 0,
      santaPackageQty: row[7] || 0,
      totalPrice: row[8] || '',
      pickupMethod: row[9] || '',
      pickupDate: row[10] || '',
      pickupTime: row[11] || '',
      depositor: row[12] || '',
      amount: row[13] || '',
      memo: row[14] || '',
      status: row[15] || '입금대기'
    };
  });
  
  return ContentService.createTextOutput(JSON.stringify({
    result: 'success',
    orders: orders
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Action 분기 처리
    if (data.action === 'update_status') {
      return updateOrderStatus(sheet, data);
    }
    
    // 기본: 새로운 주문 생성
    return createNewOrder(sheet, data);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 주문 상태 업데이트 함수
function updateOrderStatus(sheet, data) {
  const timestamp = data.timestamp;
  const newStatus = data.status;
  
  if (!timestamp || !newStatus) {
    throw new Error('Timestamp and status are required');
  }
  
  const range = sheet.getDataRange();
  const values = range.getValues();
  
  // 헤더 제외하고 검색 (Row index 1부터 시작)
  for (let i = 1; i < values.length; i++) {
    // Column 0 (A열)이 Timestamp라고 가정
    if (values[i][0] == timestamp) {
      // Status Column은 16번째 (Index 15, P열)
      // getRange(row, column) -> row는 1-based, column은 1-based
      // i + 1 (헤더 포함 행 번호), 16 (P열)
      sheet.getRange(i + 1, 16).setValue(newStatus);
      
      return ContentService.createTextOutput(JSON.stringify({
        result: 'success',
        message: 'Status updated successfully'
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  throw new Error('Order not found');
}

// 새 주문 생성 함수
function createNewOrder(sheet, data) {
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
    const customerSubject = `[크리스마스 쿠키] ${data.name}님의 주문 견적서`;
    const customerBody = `
===========================================
🎄 크리스마스 쿠키 주문 견적서 🎄
===========================================

📋 주문자 정보
--------------------------------------------
성함: ${data.name}
이메일: ${data.email}
연락처: ${data.phone}

🍪 주문 상품
--------------------------------------------
- 브루키 (곰돌이): ${data.brookieBearQty || 0}개
- 브루키 (트리): ${data.brookieTreeQty || 0}개
- 브루키 세트: ${data.brookie2Qty || 0}개
- 산타꾸러미: ${data.santaPackageQty || 0}개

 

💰 결제 정보
--------------------------------------------
총 금액: ${data.totalPrice}
입금자명: ${data.depositor}
입금 예정액: ${data.amount}원

입금계좌 : 국민은행 83050104204736
예금주: 남수찬(낫띵메터스)

 

🚗 수령 방법
--------------------------------------------
방식: ${data.pickupMethod}
날짜: ${data.pickupDate}
시간: ${data.pickupTime}

 메모
--------------------------------------------
${data.memo || '없음'}

===========================================
본 견적서는 ${new Date().toLocaleString('ko-KR')}에 생성되었습니다.
문의사항은 flowerpanty@gmail.com 으로 연락 주세요.
===========================================
    `.trim();

    GmailApp.sendEmail(data.email, customerSubject, customerBody);

    // 3. 관리자에게 알림 이메일 전송 (고객용과 동일한 견적서 스타일로 통일)
    const adminSubject = `[새 주문] ${data.name}님의 주문 견적서`;
    const adminBody = `
===========================================
🎄 크리스마스 쿠키 주문 견적서 (관리자용) 🎄
===========================================

� 주문자 정보
--------------------------------------------
성함: ${data.name}
이메일: ${data.email}
연락처: ${data.phone}

🍪 주문 상품
--------------------------------------------
- 브루키 (곰돌이): ${data.brookieBearQty || 0}개
- 브루키 (트리): ${data.brookieTreeQty || 0}개
- 브루키 세트: ${data.brookie2Qty || 0}개
- 산타꾸러미: ${data.santaPackageQty || 0}개

 

💰 결제 정보
--------------------------------------------
총 금액: ${data.totalPrice}
입금자명: ${data.depositor}
입금 예정액: ${data.amount}원

입금계좌 : 국민은행 83050104204736
예금주: 남수찬(낫띵메터스)

 

🚗 수령 방법
--------------------------------------------
방식: ${data.pickupMethod}
날짜: ${data.pickupDate}
시간: ${data.pickupTime}

📝 메모
--------------------------------------------
${data.memo || '없음'}

===========================================
본 견적서는 ${new Date().toLocaleString('ko-KR')}에 생성되었습니다.
===========================================
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
