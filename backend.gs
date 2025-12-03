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
      status: row[15] || '입금대기',
      kakaoSent: row[16] || '' // 카카오톡 발송 여부 (Column Q)
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
    } else if (data.action === 'send_alimtalk') {
      return sendAligoKakao(sheet, data); // sheet 전달 추가
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

// 알리고 카카오톡 발송 함수
function sendAligoKakao(sheet, data) {
  // ⚠️ 알리고(Aligo) 카카오톡 API 설정
  const ALIGO_APIKEY = 'qyaz1cwfldsvmde36i6345jsfwmei4y7'; // 알리고 API Key
  const ALIGO_USERID = 'nsc21'; // 알리고 아이디 (Identifier)
  const ALIGO_SENDERKEY = '34e353e21a3ebc567c9df3bc527768d93ace882b'; // 발신프로필 키 (@낫띵메터스)
  const ALIGO_TPL_CODE = 'UD_8619'; // 등록된 템플릿 코드
  const ALIGO_SENDER_PHONE = '01028667976'; // 발신자 전화번호 (알리고에 등록된 번호)

  // 발송 여부를 시트에 기록 (API Key 설정 여부와 관계없이)
  const rowIndex = findOrderRowIndex(sheet, data);
  if (rowIndex !== -1) {
    // Column 17 (Index 16, Q열)에 'Y' 저장
    sheet.getRange(rowIndex, 17).setValue('Y');
  }

  if (ALIGO_APIKEY === 'YOUR_API_KEY') {
    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      message: 'API Key가 설정되지 않았지만 발송 상태를 저장했습니다.'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 템플릿 내용 구성 (알리고 템플릿 UD_8619과 정확히 일치해야 함)
  // #{고객명}, #{상품목록}, #{수령방법}, #{날짜}, #{시간}, #{총금액}
  const message = `[낫띵메터스]

주문 접수 안내드립니다.

고객명: ${data.name}
주문내역: ${data.productSummary}
수령방법: ${data.pickupMethod}
수령일시: ${data.pickupDate} ${data.pickupTime}
총금액: ${data.totalPrice}원

주문하신 제품은 안내드린 일정에 맞추어 준비해드립니다`;

  // 알리고 API 요청 파라미터
  const payload = {
    'apikey': ALIGO_APIKEY,
    'userid': ALIGO_USERID,
    'senderkey': ALIGO_SENDERKEY,
    'tpl_code': ALIGO_TPL_CODE,
    'sender': ALIGO_SENDER_PHONE,
    'receiver_1': data.phone,
    'subject_1': '주문 접수 안내',
    'message_1': message,
    // 'testmode_yn': 'Y' // 테스트 모드 필요시 주석 해제 (실제 발송 안됨)
  };

  try {
    const options = {
      'method': 'post',
      'payload': payload
    };

    const response = UrlFetchApp.fetch('https://kakaoapi.aligo.in/akv10/alimtalk/send/', options);
    const result = JSON.parse(response.getContentText());

    if (result.code == 0) { // 성공
       return ContentService.createTextOutput(JSON.stringify({
        result: 'success',
        message: '카카오톡이 발송되었습니다.'
      })).setMimeType(ContentService.MimeType.JSON);
    } else {
       return ContentService.createTextOutput(JSON.stringify({
        result: 'error',
        message: '발송 실패: ' + result.message
      })).setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: 'API 요청 중 오류 발생: ' + error.toString()
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
