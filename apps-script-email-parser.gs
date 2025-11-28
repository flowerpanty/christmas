function processOrderEmails() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const label = GmailApp.getUserLabelByName('쿠키주문') || GmailApp.createLabel('쿠키주문');
  
  // 처리되지 않은 주문 이메일 검색
  const threads = GmailApp.search('subject:[쿠키주문] is:unread');
  
  threads.forEach(thread => {
    const messages = thread.getMessages();
    messages.forEach(message => {
      try {
        const body = message.getPlainBody();
        
        // JSON 데이터 파싱
        const data = JSON.parse(body);
        
        // Sheets에 추가
        sheet.appendRow([
          new Date(),
          data.name,
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
        
        // 이메일을 읽음으로 표시하고 라벨 추가
        message.markRead();
        thread.addLabel(label);
        
        Logger.log('주문 처리 완료: ' + data.name);
        
      } catch (error) {
        Logger.log('Error processing email: ' + error.toString());
      }
    });
  });
}
