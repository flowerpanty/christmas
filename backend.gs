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
    } else if (data.action === 'delete_order') {
      return deleteOrder(sheet, data);
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

// 주문 삭제 함수
function deleteOrder(sheet, data) {
  const rowIndex = findOrderRowIndex(sheet, data);
  
  if (rowIndex !== -1) {
    sheet.deleteRow(rowIndex);
    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      message: 'Order deleted successfully'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  throw new Error('Order not found (Delete)');
}

// 주문 상태 업데이트 함수
function updateOrderStatus(sheet, data) {
  const newStatus = data.status;
  
  if (!newStatus) {
    throw new Error('Status is required');
  }
  
  const rowIndex = findOrderRowIndex(sheet, data);
  
  if (rowIndex !== -1) {
    // Status Column은 16번째 (Index 15, P열)
    sheet.getRange(rowIndex, 16).setValue(newStatus);
    
    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      message: 'Status updated successfully'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  throw new Error('Order not found (Update)');
}

// 주문 찾기 헬퍼 함수 (Timestamp OR Name+Phone)
function findOrderRowIndex(sheet, data) {
  const timestamp = data.timestamp;
  const name = data.name;
  const phone = data.phone;
  
  const range = sheet.getDataRange();
  const values = range.getDisplayValues();
  
  // 역순 검색 (최신 주문부터 검색)
  // 프론트엔드에서는 최신순으로 보여주므로, 중복 데이터가 있을 경우 최신 데이터를 수정해야 함.
  
  // 1. Timestamp로 검색 (가장 정확)
  if (timestamp) {
    for (let i = values.length - 1; i >= 1; i--) {
      if (values[i][0] == timestamp) {
        return i + 1; // 1-based index
      }
    }
  }
  
  // 2. (Fallback) Timestamp가 안 맞으면 Name + Phone으로 검색
  if (name && phone) {
    for (let i = values.length - 1; i >= 1; i--) {
      // Column 1 (B열): Name, Column 3 (D열): Phone
      const sheetName = values[i][1].toString().trim();
      const sheetPhone = values[i][3].toString().trim();
      const inputName = name.toString().trim();
      const inputPhone = phone.toString().trim();
      
      if (sheetName === inputName && sheetPhone === inputPhone) {
        return i + 1;
      }
    }
  }
  
  return -1;
}

// 새 주문 생성 함수
function createNewOrder(sheet, data) {
    // 유효성 검사: 이름이 없으면 주문을 생성하지 않음 (상태 업데이트 요청이 잘못 넘어온 경우 방지)
    if (!data.name) {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'error',
        message: 'Name is required for new orders'
      })).setMimeType(ContentService.MimeType.JSON);
    }

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
}
